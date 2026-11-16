import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import provenance from '../../public/assets/aetheria-forest-v1/provenance.json';
import { FOREST_ART, FOREST_ART_BASE, FOREST_ART_KEYS, forestImage, preloadForestArt, registerForestArt } from './ForestArt';

describe('Eigene Wald-Assets', () => {
  it('belegt lokale Originaldateien, transparente Atlanten und gültige voneinander getrennte Ausschnitte', () => {
    for (const sheet of Object.values(FOREST_ART)) {
      const bytes = readFileSync(`public/${FOREST_ART_BASE}${sheet.file}`);
      expect(bytes.readUInt32BE(16)).toBe(sheet.width); expect(bytes.readUInt32BE(20)).toBe(sheet.height);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(provenance.assets[sheet.file as keyof typeof provenance.assets].sha256);
      const frames = Object.values(sheet.frames);
      for (const frame of frames) {
        expect(frame.x).toBeGreaterThanOrEqual(0); expect(frame.y).toBeGreaterThanOrEqual(0);
        expect(frame.x + frame.width).toBeLessThanOrEqual(sheet.width); expect(frame.y + frame.height).toBeLessThanOrEqual(sheet.height);
        for (const other of frames) if (frame !== other) expect(frame.x >= other.x + other.width || other.x >= frame.x + frame.width || frame.y >= other.y + other.height || other.y >= frame.y + frame.height).toBe(true);
      }
    }
    expect(provenance.assets['trees.png'].alphaMin).toBe(0); expect(provenance.assets['props.png'].alphaMin).toBe(0);
  });
  it('verwendet beim erneuten Besuch Quellen, Frames und die kleine Bodenkachel wieder', () => {
    const keys = new Set<string>(); const names = new Set<string>(); const draw = vi.fn(); const refresh = vi.fn();
    const load = vi.fn((key: string) => keys.add(key)); const add = vi.fn((name: string) => names.add(name));
    const create = vi.fn((key: string, width: number, height: number) => { keys.add(key); expect([width, height]).toEqual([256, 256]); return { context: { drawImage: draw }, refresh }; });
    const scene = { load: { image: load }, textures: { exists: (key: string) => keys.has(key), createCanvas: create, get: () => ({ has: (name: string) => names.has(name), add, getSourceImage: () => ({}) }) } } as unknown as Phaser.Scene;
    for (let visit = 0; visit < 6; visit++) { preloadForestArt(scene); registerForestArt(scene); }
    expect(load).toHaveBeenCalledTimes(3); expect(add).toHaveBeenCalledTimes(8); expect(create).toHaveBeenCalledTimes(1); expect(refresh).toHaveBeenCalledTimes(1);
    expect(keys.has(FOREST_ART_KEYS.tile)).toBe(true);
    const fallback = { textures: { exists: () => false } } as unknown as Phaser.Scene;
    expect(() => registerForestArt(fallback)).not.toThrow(); expect(forestImage(fallback, 'trees', 'oak', 0, 0, 100)).toBeUndefined();
  });
});
