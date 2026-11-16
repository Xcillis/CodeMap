import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import provenance from '../../public/assets/aetheria-valley-v2/provenance.json';
import { preloadValleyArt, registerValleyArt, valleyImage, VALLEY_ART, VALLEY_ART_KEYS, WATER_TILES } from './ValleyArt';

describe('Malerisches Tal und lokale Effekt-Assets', () => {
  it('prüft Herkunft, tatsächliche PNG-Größen, Ausschnitte und getrennte Animationsbilder', () => {
    for (const sheet of Object.values(VALLEY_ART)) {
      const bytes = readFileSync(`public/assets/aetheria-valley-v2/${sheet.file}`);
      expect(bytes.readUInt32BE(16)).toBe(sheet.width); expect(bytes.readUInt32BE(20)).toBe(sheet.height);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(provenance.assets[sheet.file as keyof typeof provenance.assets].sha256);
      const frames = Object.values(sheet.frames);
      for (const frame of frames) {
        expect(frame.x).toBeGreaterThanOrEqual(0); expect(frame.y).toBeGreaterThanOrEqual(0);
        expect(frame.x + frame.width).toBeLessThanOrEqual(sheet.width); expect(frame.y + frame.height).toBeLessThanOrEqual(sheet.height);
        for (const other of frames) if (frame !== other) expect(frame.x >= other.x + other.width || other.x >= frame.x + frame.width || frame.y >= other.y + other.height || other.y >= frame.y + frame.height).toBe(true);
      }
    }
    expect(Object.keys(VALLEY_ART.environment.frames)).toHaveLength(12); expect(Object.keys(VALLEY_ART.water.frames)).toHaveLength(4); expect(Object.keys(VALLEY_ART.foam.frames)).toHaveLength(4);
    expect(provenance.assets['environment.png'].alphaMin).toBe(0); expect(provenance.assets['foam.png'].alphaMin).toBe(0);
  });
  it('lädt Quellen und baut kleine Kacheln und Lichtschein nur einmal über mehrere Szenenbesuche', () => {
    const keys = new Set<string>(); const names = new Set<string>(); const draw = vi.fn(); const refresh = vi.fn();
    const gradient = { addColorStop: vi.fn() }; const create = vi.fn((key: string, width: number, height: number) => {
      keys.add(key); expect(width).toBeLessThanOrEqual(256); expect(height).toBe(width);
      return { context: { drawImage: draw, createRadialGradient: () => gradient, fillRect: vi.fn() }, refresh };
    });
    const load = vi.fn((key: string, path: string) => { expect(path).toMatch(/^assets\/aetheria-valley-v2\//); keys.add(key); });
    const add = vi.fn((name: string) => names.add(name));
    const scene = { load: { image: load }, textures: { exists: (key: string) => keys.has(key), createCanvas: create, get: () => ({ has: (name: string) => names.has(name), add, getSourceImage: () => ({}) }) } } as unknown as Phaser.Scene;
    for (let visit = 0; visit < 8; visit++) { preloadValleyArt(scene); registerValleyArt(scene); }
    expect(load).toHaveBeenCalledTimes(4); expect(create).toHaveBeenCalledTimes(6); expect(draw).toHaveBeenCalledTimes(5); expect(refresh).toHaveBeenCalledTimes(6); expect(add).toHaveBeenCalledTimes(16);
    for (const [index, frame] of Object.values(VALLEY_ART.water.frames).entries()) {
      expect(keys.has(WATER_TILES[index])).toBe(true); expect(draw).toHaveBeenCalledWith({}, frame.x, frame.y, frame.width, frame.height, 0, 0, 256, 256);
    }
    expect(keys.has(VALLEY_ART_KEYS.glow)).toBe(true);
  });
  it('erlaubt die vorhandenen Fallbacks, wenn die neuen Bilddateien fehlen', () => {
    const scene = { textures: { exists: () => false, createCanvas: () => undefined } } as unknown as Phaser.Scene;
    expect(valleyImage(scene, 'academy', 0, 0, 300)).toBeUndefined(); expect(() => registerValleyArt(scene)).not.toThrow();
  });
});
