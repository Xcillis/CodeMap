import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { staticLandscape } from './StaticLandscape';

function fixture() {
  const keys = new Set<string>();
  const graphics = { generateTexture: vi.fn((key: string) => { keys.add(key); }), destroy: vi.fn() };
  const image = { setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() };
  const scene = {
    textures: { exists: (key: string) => keys.has(key), remove: vi.fn((key: string) => { keys.delete(key); }) },
    make: { graphics: vi.fn(() => graphics) }, add: { image: vi.fn(() => image) },
  };
  return { scene, graphics, image, keys, context: scene as unknown as Phaser.Scene };
}

describe('Zwischengespeicherte Landschaft', () => {
  it('baut die Geometrie nur einmal auf und verwendet sie bei späteren Gebietsbesuchen erneut', () => {
    const f = fixture(); const paint = vi.fn();
    staticLandscape(f.context, 'terrain', 1600, 1040, 0, paint);
    expect(f.scene.make.graphics).toHaveBeenCalledWith({}, false);
    expect(f.graphics.generateTexture).toHaveBeenCalledWith('terrain', 1600, 1040);
    expect(f.graphics.destroy).toHaveBeenCalledTimes(1);
    // A second scene instance shares the game's texture manager, not its display objects.
    const next = { ...f.scene, add: { image: vi.fn(() => f.image) } } as unknown as Phaser.Scene;
    staticLandscape(next, 'terrain', 1600, 1040, 0, paint);
    expect(paint).toHaveBeenCalledTimes(1); expect(f.scene.make.graphics).toHaveBeenCalledTimes(1);
    expect(f.scene.add.image).toHaveBeenCalledWith(0, 0, 'terrain'); expect(f.image.setOrigin).toHaveBeenCalledWith(0);
    expect(f.image.setDepth).toHaveBeenCalledWith(0);
  });
  it('hält Baumkronen und Geröll unabhängig schichtbar und verhindert einen wachsenden Texturcache', () => {
    const f = fixture(); const paint = vi.fn();
    for (let visit = 0; visit < 8; visit++) {
      staticLandscape(f.context, 'terrain', 1600, 1040, 0, paint);
      staticLandscape(f.context, 'canopies', 1600, 1040, 6, paint);
      staticLandscape(f.context, 'rubble', 112, 192, 0, paint);
    }
    expect(f.keys.size).toBe(3); expect(paint).toHaveBeenCalledTimes(3); expect(f.graphics.destroy).toHaveBeenCalledTimes(3);
    expect(f.image.setDepth).toHaveBeenCalledWith(6);
  });
  it('räumt Geometrie und eine unvollständige Textur nach Fehlern auf und lässt den nächsten Versuch zu', () => {
    const f = fixture();
    f.graphics.generateTexture.mockImplementationOnce((key: string) => { f.keys.add(key); throw new Error('Abbruch'); });
    expect(() => staticLandscape(f.context, 'terrain', 1600, 1040, 0, vi.fn())).toThrow('Abbruch');
    expect(f.graphics.destroy).toHaveBeenCalledTimes(1); expect(f.keys.size).toBe(0); expect(f.scene.add.image).not.toHaveBeenCalled();
    staticLandscape(f.context, 'terrain', 1600, 1040, 0, vi.fn()); expect(f.keys.has('terrain')).toBe(true);
    expect(f.graphics.destroy).toHaveBeenCalledTimes(2);
  });
});
