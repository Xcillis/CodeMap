import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { MOTION_MANIFEST, MOTION_KEYS, motionKey, type MotionActor, type MotionSheet } from './MotionCatalog';
import { motionSprite, playMotion, preloadMotion, registerMotion } from './MotionSprites';
import provenance from '../../public/assets/aetheria-motion-v1/provenance.json';

describe('Idle- und Laufatlanten', () => {
  it('enthält 72 Bildausschnitte für alle Figuren mit gemeinsamer Fußlinie je Identität', () => {
    expect(Object.keys(MOTION_MANIFEST.actors)).toHaveLength(14);
    expect(Object.values(MOTION_MANIFEST.sheets).flatMap((sheet) => Object.keys(sheet.frames))).toHaveLength(72);
    for (const actor of Object.values(MOTION_MANIFEST.actors)) {
      const sheet = MOTION_MANIFEST.sheets[actor.sheet as MotionSheet];
      const frames: Record<string, { x: number; y: number; width: number; height: number; canvasWidth: number; canvasHeight: number; offsetX: number; offsetY: number }> = sheet.frames;
      expect(actor.idle).toHaveLength(2); expect(actor.walk.length).toBeGreaterThanOrEqual(2);
      for (const name of [...actor.idle, ...actor.walk]) {
        const frame = frames[name]; expect(frame).toBeDefined(); expect(frame.canvasHeight).toBe(actor.height);
        expect(frame.offsetY + frame.height).toBe(frame.canvasHeight); expect(frame.offsetX).toBeGreaterThanOrEqual(0);
        expect(frame.offsetX + frame.width).toBeLessThanOrEqual(frame.canvasWidth);
        expect(frame.x + frame.width).toBeLessThanOrEqual(sheet.width); expect(frame.y + frame.height).toBeLessThanOrEqual(sheet.height);
      }
    }
    expect(new Set(['hero-down', 'hero-up', 'hero-left', 'hero-right'].map((id) => MOTION_MANIFEST.actors[id as MotionActor].height)).size).toBe(1);
  });
  it('liefert lokale RGBA-PNGs mit geprüfter Transparenz und unveränderter Herkunft', () => {
    for (const [id, sheet] of Object.entries(MOTION_MANIFEST.sheets)) {
      const bytes = readFileSync(`public/assets/aetheria-motion-v1/${sheet.file}`);
      expect(bytes.readUInt32BE(16)).toBe(sheet.width); expect(bytes.readUInt32BE(20)).toBe(sheet.height); expect(bytes[25]).toBe(6);
      const info = provenance.assets[`${id}.png` as keyof typeof provenance.assets];
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(info.sha256);
      expect(info.alphaMin).toBe(0); expect(info.transparentFraction).toBeGreaterThan(.4);
    }
  });
  it('registriert Texturen, Trimmung und Endlosschleifen nur einmal über Szenenwechsel hinweg', () => {
    const keys = new Set<string>(); const frames = new Set<string>(); const clips = new Set<string>(); const trim = vi.fn();
    const load = vi.fn((key: string, path: string) => { expect(path).toMatch(/^assets\/aetheria-motion-v1\//); keys.add(key); });
    const add = vi.fn((name: string) => { frames.add(name); return { setTrim: trim }; });
    const create = vi.fn((config: { key: string; repeat: number; frames: unknown[] }) => { expect(config.repeat).toBe(-1); expect(config.frames.length).toBeGreaterThanOrEqual(2); clips.add(config.key); });
    const scene = { load: { image: load }, textures: { exists: (key: string) => keys.has(key), get: () => ({ has: (name: string) => frames.has(name), add }) }, anims: { exists: (key: string) => clips.has(key), create } } as unknown as Phaser.Scene;
    preloadMotion(scene); registerMotion(scene); preloadMotion(scene); registerMotion(scene);
    expect(load).toHaveBeenCalledTimes(3); expect(add).toHaveBeenCalledTimes(72); expect(trim).toHaveBeenCalledTimes(72); expect(create).toHaveBeenCalledTimes(28);
  });
  it('wechselt zwischen Idle und Laufen ohne erneutes Starten desselben Clips und erhält die Fußskalierung', () => {
    const play = vi.fn(); const flip = vi.fn(); const origin = vi.fn(); const scale = vi.fn(); const figure = { play, setFlipX: flip, setOrigin: origin, setScale: scale };
    for (const method of [play, flip, origin, scale]) method.mockReturnValue(figure);
    const scene = { textures: { exists: () => true }, anims: { exists: () => true }, add: { sprite: vi.fn(() => figure) } } as unknown as Phaser.Scene;
    const sprite = motionSprite(scene, 'hero-left', 10, 20, 64)!;
    expect(origin).toHaveBeenCalledWith(.5, 1); expect(scale).toHaveBeenCalledWith(64 / MOTION_MANIFEST.actors['hero-left'].height);
    playMotion(sprite, 'hero-left', 'walk', -1); expect(play).toHaveBeenLastCalledWith(motionKey('hero-left', 'walk'), true); expect(flip).toHaveBeenLastCalledWith(false);
    playMotion(sprite, 'glutling', 'walk', 1); expect(flip).toHaveBeenLastCalledWith(true);
    playMotion(sprite, 'glutling', 'walk', -1); expect(flip).toHaveBeenLastCalledWith(false);
    expect(Object.values(MOTION_KEYS)).toHaveLength(3);
  });
  it('lässt fehlende Animationsbilder auf die vorhandenen statischen Figuren zurückfallen', () => {
    const scene = { textures: { exists: () => false } } as unknown as Phaser.Scene;
    expect(motionSprite(scene, 'brann', 0, 0)).toBeUndefined(); expect(() => registerMotion(scene)).not.toThrow();
  });
});
