import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { FOREST_PATHS, forestBlocked, nearForestPath } from './ForestLayout';
import { drawForestPaths, forestPathSurface, FOREST_PATH_SURFACES } from './ForestPaths';

describe('Zusammenhängende Waldwege ohne Kreisstempel', () => {
  it('rundet Kurven, hält den Spieler frei und bleibt mit allen Rändern im reservierten Korridor', () => {
    for (const [index, surface] of FOREST_PATH_SURFACES.entries()) {
      const source = FOREST_PATHS[index];
      const last = source[source.length - 1];
      expect(surface.center[0]).toMatchObject({ x: source[0].x, y: source[0].y }); expect(surface.center.at(-1)).toMatchObject({ x: last.x, y: last.y });
      for (const point of surface.center) expect(forestBlocked(point, 18)).toBe(false);
      for (const polygon of surface.edges) for (const point of polygon) {
        expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
        expect(nearForestPath(point, 65)).toBe(true);
      }
      for (let i = 1; i < surface.center.length; i++) expect(Math.hypot(surface.center[i].x - surface.center[i - 1].x, surface.center[i].y - surface.center[i - 1].y)).toBeLessThanOrEqual(6.01);
    }
  });
  it('hält Breite und Erdstruktur bei erneutem Zeichnen stabil und verteilt sie unregelmäßig', () => {
    const a = forestPathSurface(FOREST_PATHS[0], 8201); const b = forestPathSurface(FOREST_PATHS[0], 8201);
    expect(a).toEqual(b); expect(a.pebbles.length).toBeGreaterThan(100);
    const widths = a.center.map((p) => p.left + p.right);
    expect(Math.max(...widths) - Math.min(...widths)).toBeGreaterThan(5);
    expect(new Set(a.pebbles.map((p) => p.width.toFixed(2))).size).toBeGreaterThan(100);
  });
  it('zeichnet an Texturgrenzen dieselben vollständigen Flächen und keine überlappenden Kreisbögen', () => {
    const graphics = { fillStyle: vi.fn().mockReturnThis(), fillPoints: vi.fn().mockReturnThis(), fillEllipse: vi.fn().mockReturnThis(), fillCircle: vi.fn().mockReturnThis() };
    for (const x of [512, 1024]) drawForestPaths(graphics as unknown as Phaser.GameObjects.Graphics, x, 1536, 512, 512);
    expect(graphics.fillCircle).not.toHaveBeenCalled();
    const common = FOREST_PATH_SURFACES[0];
    for (const edge of common.edges) expect(graphics.fillPoints.mock.calls.filter(([points]) => points === edge)).toHaveLength(2);
    expect(graphics.fillEllipse).toHaveBeenCalled();
  });
});
