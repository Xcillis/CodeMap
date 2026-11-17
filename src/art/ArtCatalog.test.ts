import { readFileSync } from 'node:fs';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { ART_KEYS, ART_MANIFEST, groundDepth, heroFacing } from './ArtCatalog';
import { characterImage, environmentImage, preloadArt, registerArtFrames } from './ArtSprites';
import { ARKANA_IDS } from '../gameplay/ArkanaCatalog';
import { MOTION_MANIFEST } from './MotionCatalog';
import { QUEST_GIVERS } from '../gameplay/QuestNetwork';

describe('Generierte lokale Spielgrafiken', () => {
  it('liefert echte PNGs mit dokumentierten Abmessungen und ohne überlappende Atlas-Ausschnitte', () => {
    for (const kind of ['environment', 'characters', 'grass'] as const) {
      const info = ART_MANIFEST[kind]; const png = readFileSync(`public/assets/aetheria-v1/${info.file}`);
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.readUInt32BE(16)).toBe(info.width); expect(png.readUInt32BE(20)).toBe(info.height);
      if (kind !== 'grass') expect(png[25]).toBe(6); // RGBA supports the generated alpha channel.
      const frames = Object.values(info.frames);
      for (const [index, frame] of frames.entries()) {
        expect(frame.width).toBeGreaterThan(0); expect(frame.height).toBeGreaterThan(0);
        expect(frame.x).toBeGreaterThanOrEqual(0); expect(frame.y).toBeGreaterThanOrEqual(0);
        expect(frame.x + frame.width).toBeLessThanOrEqual(info.width); expect(frame.y + frame.height).toBeLessThanOrEqual(info.height);
        for (const other of frames.slice(index + 1)) expect(frame.x >= other.x + other.width || other.x >= frame.x + frame.width || frame.y >= other.y + other.height || other.y >= frame.y + frame.height).toBe(true);
      }
    }
  });
  it('enthält alle Questgeber, gesammelten Arten und vier Blickrichtungen des Helden', () => {
    for (const id of [...Object.keys(QUEST_GIVERS), ...ARKANA_IDS.filter((id) => id !== 'frostmolch'), 'konstrukt', 'hero-up', 'hero-down', 'hero-left', 'hero-right']) expect(ART_MANIFEST.characters.frames).toHaveProperty(id);
    expect(MOTION_MANIFEST.actors['frostmolch-down']).toBeDefined();
    expect(heroFacing(0, 1)).toBe('hero-down'); expect(heroFacing(0, -1)).toBe('hero-up');
    expect(heroFacing(-1, 0)).toBe('hero-left'); expect(heroFacing(1, 0)).toBe('hero-right');
    expect(heroFacing(0, 0, 'hero-left')).toBe('hero-left'); expect(heroFacing(1, -2)).toBe('hero-up');
    expect(groundDepth(500)).toBeGreaterThan(groundDepth(499));
  });
  it('lädt lokale Bilder einmal, registriert Frames einmal und teilt eine kleine Bodenkachel', () => {
    const textures = new Set<string>(); const frameNames = new Set<string>();
    const add = vi.fn((name: string) => frameNames.add(name)); const draw = vi.fn(); const refresh = vi.fn();
    const load = vi.fn((key: string, path: string) => { expect(path).toMatch(/^assets\/aetheria-v1\//); textures.add(key); });
    const canvas = vi.fn((key: string) => { textures.add(key); return { context: { drawImage: draw }, refresh }; });
    const scene = { load: { image: load }, textures: { exists: (key: string) => textures.has(key), get: () => ({ has: (name: string) => frameNames.has(name), add, getSourceImage: () => ({}) }), createCanvas: canvas } } as unknown as Phaser.Scene;
    preloadArt(scene); registerArtFrames(scene); preloadArt(scene); registerArtFrames(scene);
    expect(load).toHaveBeenCalledTimes(3); expect(add).toHaveBeenCalledTimes(22);
    expect(canvas).toHaveBeenCalledExactlyOnceWith(ART_KEYS.groundTile, 256, 256); expect(draw).toHaveBeenCalledTimes(1); expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('verankert zugeschnittene Figuren an den Füßen und lässt die Kollisionsgeometrie getrennt', () => {
    const origin = vi.fn(); const size = vi.fn(); const image = { setOrigin: origin, setDisplaySize: size };
    origin.mockReturnValue(image); size.mockReturnValue(image);
    const add = vi.fn(() => image); const scene = { textures: { exists: () => true }, add: { image: add } } as unknown as Phaser.Scene;
    characterImage(scene, 'hero-down', 50, 60, 64);
    expect(add).toHaveBeenLastCalledWith(50, 60, ART_KEYS.characters, 'hero-down'); expect(origin).toHaveBeenLastCalledWith(.5, 1);
    const frame = ART_MANIFEST.characters.frames['hero-down']; expect(size).toHaveBeenLastCalledWith(64 * frame.width / frame.height, 64);
    environmentImage(scene, 'bridge', 248, 773, 164, 76); expect(size).toHaveBeenLastCalledWith(164, 76);
  });
  it('lässt bei fehlenden Bildern den bestehenden Platzhalter-Fallback zu', () => {
    const scene = { textures: { exists: () => false } } as unknown as Phaser.Scene;
    expect(characterImage(scene, 'glutling', 0, 0)).toBeUndefined(); expect(environmentImage(scene, 'oak', 0, 0, 120)).toBeUndefined();
    expect(() => registerArtFrames(scene)).not.toThrow();
  });
});
