import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import provenance from '../../public/assets/aetheria-mountains-v1/provenance.json';
import { MOUNTAIN_ART, MOUNTAIN_KEY, mountainImage, preloadMountainArt, registerMountainArt } from './MountainArt';
import { VALLEY_MOUNTAINS } from '../world/ValleyMountains';

describe('Große unterschiedliche Gebirgsformen', () => {
  it('liefert sechs getrennte freigestellte Formen und prüft die unveränderte Bildquelle', () => {
    const bytes = readFileSync(`public/assets/aetheria-mountains-v1/${MOUNTAIN_ART.file}`);
    expect(bytes.readUInt32BE(16)).toBe(MOUNTAIN_ART.width); expect(bytes.readUInt32BE(20)).toBe(MOUNTAIN_ART.height);
    expect(bytes[25]).toBe(6); expect(provenance.alphaMin).toBe(0);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(provenance.sha256);
    const frames = Object.values(MOUNTAIN_ART.frames); expect(frames).toHaveLength(6);
    for (const frame of frames) {
      expect(frame.x).toBeGreaterThanOrEqual(0); expect(frame.y).toBeGreaterThanOrEqual(0);
      expect(frame.x + frame.width).toBeLessThanOrEqual(MOUNTAIN_ART.width); expect(frame.y + frame.height).toBeLessThanOrEqual(MOUNTAIN_ART.height);
      for (const other of frames) if (frame !== other) expect(frame.x >= other.x + other.width || other.x >= frame.x + frame.width || frame.y >= other.y + other.height || other.y >= frame.y + frame.height).toBe(true);
    }
    for (const area of VALLEY_MOUNTAINS) expect(MOUNTAIN_ART.frames[area.variant]).toBeDefined();
  });
  it('teilt denselben Atlas über wiederholte Gebietswechsel und erhält den vorhandenen Fallback', () => {
    const keys = new Set<string>(); const frames = new Set<string>();
    const image = vi.fn((key: string) => keys.add(key)); const add = vi.fn((name: string) => frames.add(name));
    const scene = { load: { image }, textures: { exists: (key: string) => keys.has(key), get: () => ({ has: (name: string) => frames.has(name), add }) } } as unknown as Phaser.Scene;
    expect(mountainImage(scene, VALLEY_MOUNTAINS[0])).toBeUndefined(); registerMountainArt(scene);
    for (let visit = 0; visit < 8; visit++) { preloadMountainArt(scene); registerMountainArt(scene); }
    expect(image).toHaveBeenCalledTimes(1); expect(add).toHaveBeenCalledTimes(6); expect(keys.has(MOUNTAIN_KEY)).toBe(true);
  });
});
