import { describe, expect, it } from 'vitest';
import { QUEST_GIVERS } from '../gameplay/QuestNetwork';
import { ARKANA_ENCOUNTERS } from '../gameplay/ArkanaEncounters';
import { REGIONS, WORLD_SIZE } from '../gameplay/WorldRegions';
import { VALLEY_BRIDGE, VALLEY_POND, riverX, valleyBlocked, type Point } from './ValleyLayout';

/** Four-way search with the player's full clearance, not just a point-sized path. */
function reachable(passOpen: boolean, sealBridge = false): Set<string> {
  const step = 10; const key = ({ x, y }: Point) => `${x},${y}`;
  const start = { x: REGIONS.valley.spawn.x, y: Math.round(REGIONS.valley.spawn.y / step) * step };
  const visited = new Set([key(start)]); const queue: Point[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const point = { x: current.x + dx, y: current.y + dy }; const id = key(point);
      if (visited.has(id) || valleyBlocked(point, passOpen)) continue;
      if (sealBridge && Math.abs(point.x - VALLEY_BRIDGE.x) < VALLEY_BRIDGE.width / 2 && Math.abs(point.y - VALLEY_BRIDGE.y) < VALLEY_BRIDGE.height / 2 + 14) continue;
      visited.add(id); queue.push(point);
    }
  }
  return visited;
}
const gridKey = ({ x, y }: Point) => `${Math.round(x / 10) * 10},${Math.round(y / 10) * 10}`;

describe('Begehbare Tallandschaft nach der Bildreferenz', () => {
  it('hält Wasser geschlossen und lässt die Brücke mit Spielerbreite passieren', () => {
    expect(valleyBlocked({ x: riverX(500), y: 500 })).toBe(true);
    expect(valleyBlocked({ x: VALLEY_POND.x, y: VALLEY_POND.y })).toBe(true);
    for (let x = 170; x <= 330; x += 5) expect(valleyBlocked({ x, y: VALLEY_BRIDGE.y })).toBe(false);
    expect(valleyBlocked({ x: VALLEY_BRIDGE.x, y: VALLEY_BRIDGE.y - VALLEY_BRIDGE.height / 2 })).toBe(true);
  });
  it('erreicht vom Start alle Talpersonen, Glutling, Training und Runenwinde ohne die Sperre zu umgehen', () => {
    const cells = reachable(false);
    const targets: Point[] = [...Object.values(QUEST_GIVERS).filter((giver) => giver.region === 'valley'),
      ...ARKANA_ENCOUNTERS.filter((encounter) => encounter.region === 'valley'), { x: 1000, y: 720 }, { x: 1360, y: 520 }, REGIONS.valley.arrival];
    for (const point of targets) expect(cells.has(gridKey(point)), JSON.stringify(point)).toBe(true);
    expect(cells.has(gridKey(REGIONS.valley.exit))).toBe(false);
    expect(cells.has('120,800')).toBe(true);
    for (const point of [REGIONS.valley.spawn, REGIONS.valley.arrival]) expect(valleyBlocked(point)).toBe(false);
  });
  it('öffnet durch die Räumung nur den Pass und verlangt für den Bach die Brücke', () => {
    const opened = reachable(true); expect(opened.has(gridKey(REGIONS.valley.exit))).toBe(true);
    const noBridge = reachable(false, true); expect(noBridge.has('120,800')).toBe(false);
    expect(noBridge.has(gridKey(QUEST_GIVERS.eldren))).toBe(true);
    expect(valleyBlocked({ x: -1, y: 500 }, true)).toBe(true);
    expect(valleyBlocked({ x: WORLD_SIZE.width + 1, y: 500 }, true)).toBe(true);
  });
});
