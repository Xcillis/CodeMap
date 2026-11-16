import { describe, expect, it } from 'vitest';
import { REGION_SIZES, REGIONS, FOREST_VILLAGE_ARRIVAL, FOREST_VILLAGE_EXIT } from '../gameplay/WorldRegions';
import { INTERIOR_IDS, INTERIORS, VILLAGE_BUILDINGS, type InteriorId, type MapPoint } from '../gameplay/VillagePlaces';
import { villageBlocked, villageTargets, VILLAGE_OBSTACLES, roomObstacles } from './VillageLayout';
import { forestBlocked } from './ForestLayout';

function reachable(start: MapPoint, interior?: InteriorId): Set<string> {
  const key = (point: MapPoint) => `${Math.round(point.x / 10)},${Math.round(point.y / 10)}`;
  const first = { x: Math.round(start.x / 10) * 10, y: Math.round(start.y / 10) * 10 }; const queue = [first]; const visited = new Set([key(first)]);
  for (let head = 0; head < queue.length; head++) for (const [dx, dy] of [[10, 0], [-10, 0], [0, 10], [0, -10]]) {
    const point = { x: queue[head].x + dx, y: queue[head].y + dy }; const id = key(point);
    if (visited.has(id) || villageBlocked(point, interior, 18)) continue;
    visited.add(id); queue.push(point);
  }
  return visited;
}
describe('Begehbares Dorf und eingerichtete Innenräume', () => {
  it('ist so groß wie der Wald und erreicht alle Haustüren, Pia und den Rückweg mit Spielerfreiraum', () => {
    expect(REGION_SIZES.village).toEqual(REGION_SIZES.forest); expect(VILLAGE_BUILDINGS.length).toBeGreaterThanOrEqual(7);
    expect(VILLAGE_BUILDINGS.filter((house) => house.interior)).toHaveLength(3);
    const cells = reachable(REGIONS.village.arrival);
    for (const target of villageTargets({ region: 'village' })) expect(cells.has(`${Math.round(target.x / 10)},${Math.round(target.y / 10)}`), target.id).toBe(true);
    expect(forestBlocked(FOREST_VILLAGE_EXIT, 18)).toBe(false); expect(forestBlocked(FOREST_VILLAGE_ARRIVAL, 18)).toBe(false);
  });
  it('erreicht in jedem Haus seinen Bewohner und die Ausgangstür ohne Möbel zu durchqueren', () => {
    for (const id of INTERIOR_IDS) {
      const cells = reachable(INTERIORS[id].spawn, id); const targets = villageTargets({ region: 'village', interior: id });
      expect(targets.some((target) => target.id.startsWith('door:'))).toBe(false); expect(targets.some((target) => target.id === 'travel')).toBe(false);
      expect(targets).toHaveLength(2);
      for (const target of targets) expect(cells.has(`${Math.round(target.x / 10)},${Math.round(target.y / 10)}`), `${id}:${target.id}`).toBe(true);
      for (const obstacle of roomObstacles(id)) expect(villageBlocked(obstacle, id, 0)).toBe(true);
    }
    for (const obstacle of VILLAGE_OBSTACLES) expect(villageBlocked(obstacle, undefined, 0)).toBe(true);
  });
});
