import { VALLEY_CLIFFS, VALLEY_PASS, WORLD_SIZE } from '../gameplay/WorldRegions';

export interface Point { readonly x: number; readonly y: number }
export interface Obstacle extends Point { readonly width: number; readonly height: number }
export interface ValleyTree extends Point { readonly kind: 'broad' | 'pine'; readonly size: number }

/** Shared authored geometry: water, bridge and solid scenery have the same footprint in view and physics. */
export const VALLEY_BRIDGE: Obstacle = { x: 248, y: 735, width: 164, height: 76 };
export const VALLEY_POND: Obstacle = { x: 1180, y: 820, width: 208, height: 132 };
export const RIVER_WIDTH = 58;
export const RIVER_ROUTE: readonly Point[] = [
  { x: 190, y: 40 }, { x: 205, y: 130 }, { x: 155, y: 220 }, { x: 185, y: 310 },
  { x: 130, y: 405 }, { x: 160, y: 500 }, { x: 155, y: 590 }, { x: 225, y: 670 },
  { x: 248, y: 735 }, { x: 265, y: 810 }, { x: 340, y: 880 }, { x: 400, y: 950 }, { x: 470, y: 1020 },
];

export const VALLEY_PATHS: readonly (readonly Point[])[] = [
  [{ x: 70, y: 885 }, { x: 140, y: 805 }, { x: 248, y: 735 }, { x: 400, y: 735 }, { x: 600, y: 650 }, { x: 780, y: 620 }, { x: 915, y: 540 }, { x: 1110, y: 560 }, { x: 1280, y: 650 }],
  [{ x: 600, y: 650 }, { x: 450, y: 570 }, { x: 440, y: 390 }],
  [{ x: 450, y: 570 }, { x: 620, y: 455 }, { x: 760, y: 490 }, { x: 780, y: 620 }],
  [{ x: 915, y: 540 }, { x: 1040, y: 465 }, { x: 1040, y: 408 }],
  [{ x: 780, y: 620 }, { x: 850, y: 730 }, { x: 1000, y: 720 }],
  [{ x: 1110, y: 560 }, { x: 1330, y: 530 }, { x: 1540, y: 520 }],
];

export const VALLEY_TREES: readonly ValleyTree[] = [
  { x: 105, y: 170, kind: 'pine', size: 1 }, { x: 320, y: 180, kind: 'broad', size: 1.1 },
  { x: 365, y: 265, kind: 'broad', size: .95 }, { x: 560, y: 220, kind: 'broad', size: 1.15 },
  { x: 715, y: 170, kind: 'pine', size: 1.2 }, { x: 850, y: 155, kind: 'pine', size: 1.1 },
  { x: 1250, y: 220, kind: 'broad', size: 1.1 }, { x: 1320, y: 350, kind: 'pine', size: 1.05 },
  { x: 1135, y: 440, kind: 'broad', size: .9 }, { x: 335, y: 545, kind: 'broad', size: 1 },
  { x: 480, y: 870, kind: 'pine', size: .95 }, { x: 610, y: 925, kind: 'broad', size: 1.25 },
  { x: 765, y: 880, kind: 'pine', size: 1.05 }, { x: 920, y: 925, kind: 'broad', size: 1.15 },
  { x: 1120, y: 940, kind: 'pine', size: 1 }, { x: 1335, y: 890, kind: 'broad', size: 1.1 },
];
export const VALLEY_BOULDERS: readonly Obstacle[] = [
  { x: 710, y: 290, width: 146, height: 76 }, { x: 510, y: 480, width: 46, height: 30 },
  { x: 815, y: 780, width: 50, height: 32 }, { x: 1285, y: 480, width: 44, height: 34 },
  { x: 510, y: 810, width: 36, height: 26 }, { x: 1020, y: 885, width: 42, height: 30 },
];
export const VALLEY_BORDERS: readonly Obstacle[] = [
  { x: 800, y: 32.5, width: 1600, height: 65 }, { x: 800, y: 1007.5, width: 1600, height: 65 },
  { x: 25, y: 520, width: 50, height: 1040 }, ...VALLEY_CLIFFS,
];

export function riverX(y: number): number {
  const end = RIVER_ROUTE.findIndex((point) => point.y >= y);
  if (end <= 0) return end === 0 ? RIVER_ROUTE[0].x : RIVER_ROUTE[RIVER_ROUTE.length - 1].x;
  const a = RIVER_ROUTE[end - 1]; const b = RIVER_ROUTE[end]; const t = (y - a.y) / (b.y - a.y);
  // Smooth each bend without overshooting the authored banks.
  return a.x + (b.x - a.x) * t * t * (3 - 2 * t);
}
export const RIVER_POINTS: readonly Point[] = Array.from({ length: 197 }, (_, i) => ({ x: riverX(40 + i * 5), y: 40 + i * 5 }));

const riverObstacles: Obstacle[] = [];
for (let y = 40; y < 1020; y += 7) {
  for (const [low, high] of [[y, Math.min(y + 7, VALLEY_BRIDGE.y - VALLEY_BRIDGE.height / 2)], [Math.max(y, VALLEY_BRIDGE.y + VALLEY_BRIDGE.height / 2), y + 7]]) {
    if (high <= low) continue;
    const left = Math.min(riverX(low), riverX(high)); const right = Math.max(riverX(low), riverX(high));
    riverObstacles.push({ x: (left + right) / 2, y: (low + high) / 2, width: right - left + RIVER_WIDTH, height: high - low });
  }
}
const pondObstacles: Obstacle[] = [];
for (let y = -VALLEY_POND.height / 2; y < VALLEY_POND.height / 2; y += 6) {
  const middle = y + 3; const width = VALLEY_POND.width * Math.sqrt(Math.max(0, 1 - (middle / (VALLEY_POND.height / 2)) ** 2));
  pondObstacles.push({ x: VALLEY_POND.x, y: VALLEY_POND.y + middle, width, height: 6 });
}
export const VALLEY_OBSTACLES: readonly Obstacle[] = [
  ...VALLEY_BORDERS, { x: 1040, y: 325, width: 270, height: 160 },
  ...VALLEY_TREES.map((tree) => ({ x: tree.x, y: tree.y + 10, width: 26 * tree.size, height: 24 * tree.size })),
  ...VALLEY_BOULDERS, ...riverObstacles, ...pondObstacles,
  ...[-1, 1].map((side) => ({ x: VALLEY_BRIDGE.x, y: VALLEY_BRIDGE.y + side * (VALLEY_BRIDGE.height / 2 - 2), width: VALLEY_BRIDGE.width, height: 4 })),
];

/** Conservative clearance check used for decoration placement and navigation validation. */
export function valleyBlocked(point: Point, passOpen = false, radius = 14): boolean {
  if (point.x < radius || point.x > WORLD_SIZE.width - radius || point.y < radius || point.y > WORLD_SIZE.height - radius) return true;
  return (passOpen ? VALLEY_OBSTACLES : [...VALLEY_OBSTACLES, VALLEY_PASS]).some((body) =>
    Math.abs(point.x - body.x) < body.width / 2 + radius && Math.abs(point.y - body.y) < body.height / 2 + radius);
}
