import { REGIONS, REGION_SIZES } from '../gameplay/WorldRegions';
import { INTERIORS, VILLAGE_BUILDINGS, VILLAGE_RESIDENTS, type InteriorId, type MapPoint, type WorldLocation } from '../gameplay/VillagePlaces';
import type { InteractionTarget } from '../gameplay/InteractionController';
import type { Obstacle } from './ValleyLayout';

export interface Furniture extends MapPoint { frame: 'table' | 'bookshelf' | 'bed' | 'workbench'; width: number; height: number }
export const ROOM_FURNITURE: Record<InteriorId, readonly Furniture[]> = {
  inn: [{ frame: 'table', x: 290, y: 410, width: 160, height: 135 }, { frame: 'table', x: 680, y: 480, width: 150, height: 125 }, { frame: 'bed', x: 210, y: 240, width: 100, height: 140 }, { frame: 'bookshelf', x: 750, y: 250, width: 125, height: 160 }],
  workshop: [{ frame: 'workbench', x: 290, y: 300, width: 220, height: 155 }, { frame: 'workbench', x: 720, y: 490, width: 170, height: 120 }, { frame: 'bookshelf', x: 740, y: 250, width: 125, height: 160 }],
  library: [{ frame: 'bookshelf', x: 220, y: 250, width: 135, height: 170 }, { frame: 'bookshelf', x: 420, y: 250, width: 135, height: 170 }, { frame: 'bookshelf', x: 740, y: 250, width: 135, height: 170 }, { frame: 'table', x: 300, y: 465, width: 170, height: 140 }],
};
export const VILLAGE_PROPS = [
  { frame: 'well', x: 1630, y: 1080, width: 125, height: 145 },
  { frame: 'market', x: 1360, y: 990, width: 175, height: 160 },
  { frame: 'cart', x: 2420, y: 890, width: 110, height: 85 },
  { frame: 'flowers', x: 1150, y: 910, width: 90, height: 60 },
  { frame: 'flowers', x: 1830, y: 520, width: 90, height: 60 },
] as const;
export const VILLAGE_TREES: readonly MapPoint[] = [
  { x: 300, y: 400 }, { x: 760, y: 350 }, { x: 1250, y: 280 }, { x: 2250, y: 300 }, { x: 2830, y: 450 },
  { x: 350, y: 950 }, { x: 900, y: 1150 }, { x: 2550, y: 1370 }, { x: 2950, y: 1510 },
  { x: 1150, y: 1770 }, { x: 1450, y: 1860 }, { x: 1800, y: 1810 }, { x: 2700, y: 1840 },
];
export const VILLAGE_PATHS: readonly (readonly MapPoint[])[] = [
  [REGIONS.village.exit, REGIONS.village.arrival, { x: 650, y: 1600 }, { x: 1120, y: 1290 }, { x: 1600, y: 1210 }, { x: 2200, y: 1280 }, { x: 2780, y: 1390 }],
  [{ x: 1030, y: 850 }, { x: 1160, y: 1050 }, { x: 1600, y: 1210 }, { x: 1950, y: 1080 }, { x: 2230, y: 840 }],
  [{ x: 1750, y: 480 }, { x: 1750, y: 750 }, { x: 1810, y: 1000 }, { x: 1600, y: 1210 }],
  [{ x: 2150, y: 1810 }, { x: 2000, y: 1510 }, { x: 2200, y: 1280 }],
  [{ x: 570, y: 1310 }, { x: 650, y: 1600 }],
  [{ x: 2760, y: 1290 }, { x: 2780, y: 1390 }],
  [{ x: 520, y: 600 }, { x: 730, y: 860 }, { x: 1030, y: 850 }],
  [{ x: 2230, y: 840 }, { x: 2500, y: 700 }, { x: 2750, y: 590 }],
];
const borders = (width: number, height: number): Obstacle[] => [
  { x: 20, y: height / 2, width: 40, height }, { x: width - 20, y: height / 2, width: 40, height },
  { x: width / 2, y: 20, width, height: 40 }, { x: width / 2, y: height - 20, width, height: 40 },
];
export const VILLAGE_OBSTACLES: readonly Obstacle[] = [
  ...borders(REGION_SIZES.village.width, REGION_SIZES.village.height),
  ...VILLAGE_BUILDINGS.map((house) => ({ x: house.x, y: house.y - house.height * .25, width: house.width * .8, height: house.height * .5 })),
  ...VILLAGE_TREES.map((tree) => ({ x: tree.x, y: tree.y - 10, width: 32, height: 26 })),
  ...VILLAGE_PROPS.filter((prop) => prop.frame !== 'flowers').map((prop) => ({ x: prop.x, y: prop.y - prop.height * .2, width: prop.width * .7, height: prop.height * .4 })),
];
export function roomObstacles(id: InteriorId): readonly Obstacle[] {
  return [
    { x: 65, y: 360, width: 30, height: 600 }, { x: 895, y: 360, width: 30, height: 600 },
    { x: 480, y: 110, width: 800, height: 30 }, { x: 480, y: 665, width: 860, height: 30 },
    ...ROOM_FURNITURE[id].map((item) => ({ x: item.x, y: item.y - item.height * .22, width: item.width * .8, height: item.height * .44 })),
  ];
}
export function villageBlocked(point: MapPoint, interior?: InteriorId, radius = 14): boolean {
  const size = interior ? INTERIORS[interior].size : REGION_SIZES.village;
  return point.x < radius || point.y < radius || point.x > size.width - radius || point.y > size.height - radius
    || (interior ? roomObstacles(interior) : VILLAGE_OBSTACLES).some((o) => Math.abs(point.x - o.x) < o.width / 2 + radius && Math.abs(point.y - o.y) < o.height / 2 + radius);
}
export function villageTargets(place: WorldLocation): InteractionTarget[] {
  if (place.region !== 'village') return [];
  return [
    ...VILLAGE_RESIDENTS.filter((person) => person.interior === place.interior).map((person) => ({ id: `resident:${person.id}`, label: `Mit ${person.name} sprechen`, x: person.x, y: person.y, range: 75 })),
    ...(place.interior ? [{ id: 'leave-house', label: 'Haus verlassen', ...INTERIORS[place.interior].exit, range: 55 }]
      : [...VILLAGE_BUILDINGS.map((house) => ({ id: `door:${house.id}`, label: house.name, x: house.x, y: house.y + 45, range: 65 })), { id: 'travel', label: 'Zurück in den Aetherwald', ...REGIONS.village.exit, range: 55 }]),
  ];
}
