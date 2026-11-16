import { describe, expect, it } from 'vitest';
import { QUEST_GIVERS } from '../gameplay/QuestNetwork';
import { REGIONS, REGION_SIZES } from '../gameplay/WorldRegions';
import { ARKANA_ENCOUNTERS } from '../gameplay/ArkanaEncounters';
import { FOREST_CLEARINGS, FOREST_OBSTACLES, FOREST_PATHS, FOREST_PROPS, FOREST_SIZE, FOREST_TRAINING, FOREST_TREES, forestBlocked } from './ForestLayout';

describe('Großer Aetherwald mit verbundenen Lichtungen', () => {
  it('ist viermal so groß wie das Akademietal und verteilt die Orte auch in die neue Fläche', () => {
    expect(FOREST_SIZE.width * FOREST_SIZE.height).toBe(REGION_SIZES.valley.width * REGION_SIZES.valley.height * 4);
    expect(QUEST_GIVERS.neria.x).toBeGreaterThan(REGION_SIZES.valley.width);
    expect(QUEST_GIVERS.tala.y).toBeGreaterThan(REGION_SIZES.valley.height);
    expect(FOREST_TREES.length).toBeGreaterThan(200); expect(FOREST_TREES.length).toBeLessThan(500);
    expect(new Set(FOREST_TREES.map((tree) => tree.variant)).size).toBe(4); expect(FOREST_PROPS.length).toBeGreaterThan(30);
  });
  it('erreicht alle Personen, Fundorte, Trainings- und Rückreisepunkte mit voller Spielerbreite', () => {
    const step = 20; const key = (x: number, y: number) => `${Math.round(x / step)},${Math.round(y / step)}`;
    const start = { x: 240, y: 1640 }; const queue = [start]; const visited = new Set([key(start.x, start.y)]);
    for (let head = 0; head < queue.length; head++) for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const point = { x: queue[head].x + dx, y: queue[head].y + dy }; const id = key(point.x, point.y);
      if (visited.has(id) || forestBlocked(point, 18)) continue;
      visited.add(id); queue.push(point);
    }
    const targets = [REGIONS.forest.arrival, REGIONS.forest.exit, FOREST_TRAINING, ...FOREST_CLEARINGS,
      ...Object.values(QUEST_GIVERS).filter((giver) => giver.region === 'forest'), ...ARKANA_ENCOUNTERS.filter((encounter) => encounter.region === 'forest')];
    for (const target of targets) { expect(forestBlocked(target, 18), JSON.stringify(target)).toBe(false); expect(visited.has(key(target.x, target.y)), JSON.stringify(target)).toBe(true); }
  });
  it('hält die Wegmitten frei, blockiert Stämme, Felsen und Ränder mit denselben Kollisionsflächen wie die Szene', () => {
    for (const path of FOREST_PATHS) for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]; const b = path[i];
      for (let t = 0; t <= 1; t += .025) expect(forestBlocked({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, 30)).toBe(false);
    }
    for (const obstacle of FOREST_OBSTACLES) expect(forestBlocked(obstacle, 0)).toBe(true);
    for (const point of [{ x: -1, y: 300 }, { x: 3201, y: 300 }, { x: 500, y: -1 }, { x: 500, y: 2081 }]) expect(forestBlocked(point)).toBe(true);
  });
});
