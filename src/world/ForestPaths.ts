import type Phaser from 'phaser';
import type { Point } from './ValleyLayout';
import { FOREST_PATHS } from './ForestLayout';

interface PathSample extends Point { nx: number; ny: number; left: number; right: number }
interface Pebble extends Point { width: number; height: number; light: boolean }
export interface ForestPathSurface {
  center: readonly PathSample[];
  edges: readonly Point[][];
  pebbles: readonly Pebble[];
  bounds: { left: number; right: number; top: number; bottom: number };
}

/** Round only the corners, staying inside the already reserved walking corridors. */
function smoothPath(path: readonly Point[]): Point[] {
  if (path.length < 2) return [...path];
  const points: Point[] = [{ ...path[0] }];
  const lineTo = (end: Point) => {
    const start = points[points.length - 1]; const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const steps = Math.ceil(distance / 6);
    for (let step = 1; step <= steps; step++) points.push({ x: start.x + (end.x - start.x) * step / steps, y: start.y + (end.y - start.y) * step / steps });
  };
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i - 1]; const b = path[i]; const c = path[i + 1];
    const before = Math.hypot(b.x - a.x, b.y - a.y); const after = Math.hypot(c.x - b.x, c.y - b.y);
    if (!before || !after) continue;
    const trim = Math.min(55, before / 3, after / 3);
    const entry = { x: b.x + (a.x - b.x) * trim / before, y: b.y + (a.y - b.y) * trim / before };
    const exit = { x: b.x + (c.x - b.x) * trim / after, y: b.y + (c.y - b.y) * trim / after };
    lineTo(entry);
    const steps = Math.ceil(trim * 2 / 6);
    for (let step = 1; step <= steps; step++) {
      const t = step / steps; const u = 1 - t;
      points.push({ x: u * u * entry.x + 2 * u * t * b.x + t * t * exit.x, y: u * u * entry.y + 2 * u * t * b.y + t * t * exit.y });
    }
  }
  lineTo(path[path.length - 1]); return points;
}

/** One continuous filled ribbon, with irregular edges and fixed world-space texture detail. */
export function forestPathSurface(path: readonly Point[], seed: number): ForestPathSurface {
  const points = smoothPath(path); let distance = 0; let value = seed;
  const random = () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  const center = points.map((point, index) => {
    if (index) distance += Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y);
    const a = points[Math.max(0, index - 1)]; const b = points[Math.min(points.length - 1, index + 1)];
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { ...point, nx: -(b.y - a.y) / length, ny: (b.x - a.x) / length,
      left: 17 + Math.sin(distance / 49 + seed) * 2 + Math.sin(distance / 17) * .8,
      right: 18 + Math.cos(distance / 63 + seed) * 2.5 + Math.sin(distance / 21) * .9 };
  });
  const edges = [1.15, 1, .62].map((scale) => [
    ...center.map((p) => ({ x: p.x + p.nx * p.left * scale, y: p.y + p.ny * p.left * scale })),
    ...[...center].reverse().map((p) => ({ x: p.x - p.nx * p.right * scale, y: p.y - p.ny * p.right * scale })),
  ]);
  const pebbles = center.flatMap((p): Pebble[] => {
    if (random() < .32) return [];
    const across = (random() * 2 - 1) * Math.min(p.left, p.right) * .88; const along = random() * 5 - 2.5;
    return [{ x: p.x + p.nx * across - p.ny * along, y: p.y + p.ny * across + p.nx * along,
      width: 1 + random() * 3, height: .7 + random() * 1.6, light: random() > .7 }];
  });
  return { center, edges, pebbles, bounds: { left: Math.min(...points.map((p) => p.x)) - 28, right: Math.max(...points.map((p) => p.x)) + 28,
    top: Math.min(...points.map((p) => p.y)) - 28, bottom: Math.max(...points.map((p) => p.y)) + 28 } };
}

export const FOREST_PATH_SURFACES = FOREST_PATHS.map((path, index) => forestPathSurface(path, 8201 + index));
export function drawForestPaths(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
  const visible = FOREST_PATH_SURFACES.filter(({ bounds: b }) => b.right >= x && b.left <= x + width && b.bottom >= y && b.top <= y + height);
  // Paint each layer for ALL branches before the next layer, so joins cannot form bands.
  for (const [layer, color] of [0x72654a, 0xb8a170, 0xc5ae7b].entries()) for (const path of visible) g.fillStyle(color).fillPoints(path.edges[layer], true);
  for (const path of visible) for (const pebble of path.pebbles) {
    if (pebble.x < x - 4 || pebble.x > x + width + 4 || pebble.y < y - 4 || pebble.y > y + height + 4) continue;
    g.fillStyle(pebble.light ? 0xe1c994 : 0x857451, pebble.light ? .65 : .5).fillEllipse(pebble.x, pebble.y, pebble.width, pebble.height);
  }
}
