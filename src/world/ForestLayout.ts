import { WORLD_SIZE } from '../gameplay/WorldRegions';

export const FOREST_TREES: readonly (readonly [number, number])[] = [[170, 160], [350, 210], [500, 160], [780, 150], [950, 220], [1300, 150], [1470, 230], [240, 800], [440, 910], [650, 780], [790, 950], [1230, 940], [1500, 700], [1350, 650], [300, 350], [830, 650]];
export function forestBlocked(point: { x: number; y: number }, radius = 14): boolean {
  return point.x < radius || point.y < radius || point.x > WORLD_SIZE.width - radius || point.y > WORLD_SIZE.height - radius
    || FOREST_TREES.some(([x, y]) => Math.abs(point.x - x) < 15 + radius && Math.abs(point.y - y - 10) < 15 + radius);
}
