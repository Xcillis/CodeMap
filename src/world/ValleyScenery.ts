import { RIVER_POINTS, RIVER_WIDTH, VALLEY_BRIDGE, type Point } from './ValleyLayout';

/** Filled corridor: Canvas geometry masks clip filled paths, not the width of stroked lines. */
export const RIVER_WATER_POLYGON: readonly Point[] = [
  ...RIVER_POINTS.map(({ x, y }) => ({ x: x - RIVER_WIDTH / 2 + 2, y })),
  ...[...RIVER_POINTS].reverse().map(({ x, y }) => ({ x: x + RIVER_WIDTH / 2 - 2, y })),
];

/** One narrow approach, explicitly requested after the previous road loops were removed. */
export const ACADEMY_PATH: readonly Point[] = [
  { x: 70, y: 885 }, { x: 120, y: 805 }, { x: 145, y: VALLEY_BRIDGE.y },
  { x: 200, y: VALLEY_BRIDGE.y }, { x: 300, y: VALLEY_BRIDGE.y }, { x: 400, y: 735 },
  { x: 600, y: 650 }, { x: 780, y: 620 }, { x: 915, y: 540 }, { x: 1040, y: 465 }, { x: 1040, y: 425 },
];
export function nearAcademyPath(point: Point, distance = 24): boolean {
  return ACADEMY_PATH.slice(1).some((end, index) => {
    const start = ACADEMY_PATH[index]; const dx = end.x - start.x; const dy = end.y - start.y;
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy) < distance;
  });
}
