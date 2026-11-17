import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { MOTION_MANIFEST, MOTION_KEYS, motionDirection, motionKey, arkanaMotion, type MotionActor, type MotionSheet } from './MotionCatalog';
import { motionSprite, playMotion, preloadMotion, registerMotion } from './MotionSprites';
import provenance from '../../public/assets/aetheria-motion-v1/provenance.json';
import arkanaProvenance from '../../public/assets/aetheria-motion-v1/arkana-4way-provenance.json';

describe('Idle- und Laufatlanten', () => {
  it('enthält 168 Bildausschnitte für alle Figuren mit gemeinsamer Fußlinie je Identität', () => {
    expect(Object.keys(MOTION_MANIFEST.actors)).toHaveLength(30);
    expect(Object.values(MOTION_MANIFEST.sheets).flatMap((sheet) => Object.keys(sheet.frames))).toHaveLength(168);
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
    for (const actor of ['hero', 'brann', 'glutling', 'moosling', 'felsbock']) expect(new Set(['down', 'up', 'left', 'right'].map((direction) => MOTION_MANIFEST.actors[`${actor}-${direction}` as MotionActor].height)).size).toBe(1);
  });
  it('liefert lokale RGBA-PNGs mit geprüfter Transparenz und unveränderter Herkunft', () => {
    for (const sheet of Object.values(MOTION_MANIFEST.sheets)) {
      const bytes = readFileSync(`public/assets/aetheria-motion-v1/${sheet.file}`);
      expect(bytes.readUInt32BE(16)).toBe(sheet.width); expect(bytes.readUInt32BE(20)).toBe(sheet.height); expect(bytes[25]).toBe(6);
      const sources = { ...provenance.assets, ...arkanaProvenance.assets };
      const info = sources[sheet.file as keyof typeof sources];
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
    expect(load).toHaveBeenCalledTimes(7); expect(add).toHaveBeenCalledTimes(168); expect(trim).toHaveBeenCalledTimes(168); expect(create).toHaveBeenCalledTimes(60);
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
    for (const direction of ['down', 'up', 'left', 'right'] as const) {
      playMotion(sprite, `brann-${direction}`, 'walk', -1); expect(flip).toHaveBeenLastCalledWith(false);
      expect(play).toHaveBeenLastCalledWith(motionKey(`brann-${direction}`, 'walk'), true);
    }
    expect(Object.values(MOTION_KEYS)).toHaveLength(7);
  });
  it('wählt für jedes Arkana echte Richtungsclips und spiegelt Rückwärtsbewegungen nicht', () => {
    const play = vi.fn(); const flip = vi.fn(); const sprite = { play, setFlipX: flip } as unknown as Phaser.GameObjects.Sprite;
    for (const actor of ['glutling', 'moosling', 'felsbock'] as const) {
      const keys = new Set<string>();
      for (const facing of ['east', 'south', 'west', 'north'] as const) {
        const identity = arkanaMotion(actor, facing); keys.add(identity);
        // A westward displacement while looking east is backward walking: keep the east view.
        playMotion(sprite, identity, 'walk', -1);
        expect(flip).toHaveBeenLastCalledWith(false); expect(play).toHaveBeenLastCalledWith(motionKey(identity, 'walk'), true);
        playMotion(sprite, identity, 'idle'); expect(play).toHaveBeenLastCalledWith(motionKey(identity, 'idle'), true);
      }
      expect(keys.size).toBe(4); expect(arkanaMotion(actor, 'north')).toBe(`${actor}-up`);
    }
  });
  it('wählt die wirkliche Laufrichtung und hält sie bei Idle und Pausen fest', () => {
    expect(motionDirection(1, 0, 'up')).toBe('right'); expect(motionDirection(-1, 0, 'up')).toBe('left');
    expect(motionDirection(0, 1, 'left')).toBe('down'); expect(motionDirection(0, -1, 'left')).toBe('up');
    expect(motionDirection(0, 0, 'up')).toBe('up');
    const down = MOTION_MANIFEST.actors['brann-down']; const up = MOTION_MANIFEST.actors['brann-up'];
    expect(up.walk).not.toEqual(down.walk); expect(up.sheet).toBe('brann');
  });
  it('lässt fehlende Animationsbilder auf die vorhandenen statischen Figuren zurückfallen', () => {
    const scene = { textures: { exists: () => false } } as unknown as Phaser.Scene;
    expect(motionSprite(scene, 'brann', 0, 0)).toBeUndefined(); expect(() => registerMotion(scene)).not.toThrow();
  });
});
