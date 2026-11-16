import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import provenance from '../../public/assets/aetheria-village-v1/provenance.json';
import { VILLAGE_ART, VILLAGE_ART_BASE, VILLAGE_ART_KEYS, preloadVillageArt, registerVillageArt, villageImage } from './VillageArt';

describe('Lokale Dorf-, Bewohner- und Einrichtungsatlanten', () => {
  it('prüft Originale, Transparenz und getrennte gültige Ausschnitte aller vier Atlanten', () => {
    for (const sheet of Object.values(VILLAGE_ART)) {
      const bytes = readFileSync(`public/${VILLAGE_ART_BASE}${sheet.file}`);
      expect(bytes.readUInt32BE(16)).toBe(sheet.width); expect(bytes.readUInt32BE(20)).toBe(sheet.height);
      const origin = provenance.assets[sheet.file as keyof typeof provenance.assets];
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(origin.sha256); expect(origin.alphaMin).toBe(0);
      const frames = Object.values(sheet.frames); expect(frames).toHaveLength(4);
      for (const frame of frames) {
        expect(frame.x).toBeGreaterThanOrEqual(0); expect(frame.y).toBeGreaterThanOrEqual(0);
        expect(frame.x + frame.width).toBeLessThanOrEqual(sheet.width); expect(frame.y + frame.height).toBeLessThanOrEqual(sheet.height);
        for (const other of frames) if (other !== frame) expect(frame.x >= other.x + other.width || other.x >= frame.x + frame.width || frame.y >= other.y + other.height || other.y >= frame.y + frame.height).toBe(true);
      }
    }
  });
  it('lädt über mehrere Haus- und Gebietsbesuche jeden Atlas und Frame nur einmal', () => {
    const keys = new Set<string>(); const frames = new Set<string>();
    const load = vi.fn((key: string) => keys.add(key)); const add = vi.fn((name: string) => frames.add(name));
    const scene = { load: { image: load }, textures: { exists: (key: string) => keys.has(key), get: () => ({ has: (name: string) => frames.has(name), add }) } } as unknown as Phaser.Scene;
    for (let visit = 0; visit < 12; visit++) { preloadVillageArt(scene); registerVillageArt(scene); }
    expect(load).toHaveBeenCalledTimes(4); expect(add).toHaveBeenCalledTimes(16);
    expect(keys.size).toBe(Object.keys(VILLAGE_ART_KEYS).length);
    const fallback = { textures: { exists: () => false } } as unknown as Phaser.Scene;
    expect(() => registerVillageArt(fallback)).not.toThrow(); expect(villageImage(fallback, 'buildings', 'inn', 0, 0, 250)).toBeUndefined();
  });
});
