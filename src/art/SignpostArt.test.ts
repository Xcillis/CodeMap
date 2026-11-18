import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { SIGNPOST_ART, SIGNPOST_KEY, SIGNPOST_URL, preloadSignpost, registerSignpost, signpostImage } from './SignpostArt';

describe('Generierter Wegweiser', () => {
  it('liefert das unveränderte transparente PNG mit gültigem Ausschnitt', () => {
    const bytes = readFileSync(`public/${SIGNPOST_URL}`);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(SIGNPOST_ART.sha256);
    expect(bytes.readUInt32BE(16)).toBe(SIGNPOST_ART.width); expect(bytes.readUInt32BE(20)).toBe(SIGNPOST_ART.height);
    expect(SIGNPOST_ART.alphaMin).toBe(0); expect(SIGNPOST_ART.transparentFraction).toBeGreaterThan(.5);
    const frame = SIGNPOST_ART.frame;
    expect(frame.x).toBeGreaterThanOrEqual(0); expect(frame.y).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.width).toBeLessThanOrEqual(SIGNPOST_ART.width);
    expect(frame.y + frame.height).toBeLessThanOrEqual(SIGNPOST_ART.height);
  });
  it('verwendet bei weiteren Waldbesuchen dieselbe Textur und denselben Frame', () => {
    const keys = new Set<string>(); const frames = new Set<string>();
    const load = vi.fn((key: string) => keys.add(key));
    const add = vi.fn((name: string) => frames.add(name));
    const sprite = { setOrigin: vi.fn().mockReturnThis(), setDisplaySize: vi.fn().mockReturnThis() };
    const image = vi.fn(() => sprite);
    const scene = { load: { image: load }, add: { image }, textures: { exists: (key: string) => keys.has(key), get: () => ({ has: (name: string) => frames.has(name), add }) } } as unknown as Phaser.Scene;
    for (let i = 0; i < 4; i++) { preloadSignpost(scene); registerSignpost(scene); }
    expect(load).toHaveBeenCalledTimes(1); expect(add).toHaveBeenCalledTimes(1);
    signpostImage(scene, 780, 1280);
    expect(image).toHaveBeenCalledWith(780, 1280, SIGNPOST_KEY, 'signpost');
    expect(sprite.setOrigin).toHaveBeenCalledWith(.5, 1);
    expect(sprite.setDisplaySize).toHaveBeenCalledWith(84 * SIGNPOST_ART.frame.width / SIGNPOST_ART.frame.height, 84);
    const missing = { textures: { exists: () => false } } as unknown as Phaser.Scene;
    expect(() => registerSignpost(missing)).not.toThrow(); expect(signpostImage(missing, 0, 0)).toBeUndefined();
  });
});
