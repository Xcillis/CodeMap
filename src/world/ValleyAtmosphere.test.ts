import { EventEmitter } from 'node:events';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { ValleyAtmosphere } from './ValleyAtmosphere';
import { bindValleyAtmosphere } from './ValleyEffects';
import { RIVER_WATER_POLYGON } from './ValleyScenery';
import { riverX } from './ValleyLayout';

describe('Wasserbewegung und ruhiges Fensterlicht', () => {
  it('begrenzt die gefüllte Flussmaske auch im Canvas-Fallback auf das Flussbett', () => {
    const inside = (x: number, y: number) => {
      let found = false;
      for (let i = 0, j = RIVER_WATER_POLYGON.length - 1; i < RIVER_WATER_POLYGON.length; j = i++) {
        const a = RIVER_WATER_POLYGON[i]; const b = RIVER_WATER_POLYGON[j];
        if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) found = !found;
      }
      return found;
    };
    for (let y = 45; y < 1020; y += 7) {
      expect(inside(riverX(y), y)).toBe(true); expect(inside(riverX(y) - 34, y)).toBe(false); expect(inside(riverX(y) + 34, y)).toBe(false);
    }
    expect(inside(915, 540)).toBe(false); expect(inside(1040, 425)).toBe(false);
  });
  it('überblendet vier Bilder zyklisch ohne Sprung am Übergang und bewegt die Oberfläche weiter', () => {
    const clock = new ValleyAtmosphere(); const frames = new Set<number>(); let last = clock.advance(0);
    for (let tick = 1; tick <= 72; tick++) {
      const next = clock.advance(100); frames.add(next.frame);
      expect(next.flow).toBeGreaterThan(last.flow); expect(next.blend).toBeGreaterThanOrEqual(0); expect(next.blend).toBeLessThan(1);
      expect(next.light).toBeGreaterThanOrEqual(.23); expect(next.light).toBeLessThanOrEqual(.33);
      if (next.frame !== last.frame) { expect(next.frame).toBe(last.nextFrame); expect(next.blend).toBe(0); expect(last.blend).toBeGreaterThan(.98); }
      last = next;
    }
    expect(frames).toEqual(new Set([0, 1, 2, 3])); expect(last.frame).toBe(0); expect(last.nextFrame).toBe(1); expect(last.flow).toBeCloseTo(100.8);
  });
  it('begrenzt große Zeitdeltas und ignoriert ungültige oder negative Zeiten', () => {
    const clock = new ValleyAtmosphere(); const start = clock.advance(0);
    for (const delta of [-50, NaN, Infinity]) expect(clock.advance(delta)).toEqual(start);
    expect(clock.advance(10000)).toEqual(new ValleyAtmosphere().advance(100));
    const foam = new Set<number>(); for (let i = 0; i < 10; i++) foam.add(clock.advance(100).foamFrame);
    expect(foam).toEqual(new Set([0, 1, 2, 3]));
  });
  it('hält bei reduzierter Bewegung Wasser und Licht konstant', () => {
    const clock = new ValleyAtmosphere(true); const initial = clock.advance(0);
    for (let tick = 0; tick < 100; tick++) expect(clock.advance(100)).toEqual(initial);
  });
  it('folgt nur der aktiven Szene und entfernt Listener sowie Masken bei jedem Gebietswechsel', () => {
    const events = new EventEmitter(); const scene = { events } as unknown as Phaser.Scene;
    for (let visit = 0; visit < 8; visit++) {
      const paint = vi.fn(); const cleanup = vi.fn(); bindValleyAtmosphere(scene, paint, cleanup, false);
      expect(events.listenerCount('update')).toBe(1); const initial = paint.mock.lastCall?.[0];
      // While the scene is paused there are no update events and therefore no global timer/catch-up.
      expect(paint).toHaveBeenCalledTimes(1); events.emit('update', 30000, 50); expect(paint.mock.lastCall?.[0].flow).toBeCloseTo(.7);
      events.emit('shutdown'); events.emit('destroy'); events.emit('update', 31000, 50);
      expect(cleanup).toHaveBeenCalledTimes(1); expect(paint).toHaveBeenCalledTimes(2);
      expect(events.eventNames()).toEqual([]); expect(initial?.flow).toBe(0);
    }
  });
});
