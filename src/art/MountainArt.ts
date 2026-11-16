import type Phaser from 'phaser';
import manifest from '../../public/assets/aetheria-mountains-v1/frames.json';
import type { MountainArea } from '../world/ValleyMountains';

export const MOUNTAIN_ART = manifest;
export const MOUNTAIN_KEY = 'cm-mountain-massifs-v1';
export function preloadMountainArt(scene: Phaser.Scene): void {
  if (!scene.textures.exists(MOUNTAIN_KEY)) scene.load.image(MOUNTAIN_KEY, `assets/aetheria-mountains-v1/${manifest.file}`);
}
export function registerMountainArt(scene: Phaser.Scene): void {
  if (!scene.textures.exists(MOUNTAIN_KEY)) return;
  const texture = scene.textures.get(MOUNTAIN_KEY);
  for (const [name, frame] of Object.entries(manifest.frames)) if (!texture.has(name)) texture.add(name, 0, frame.x, frame.y, frame.width, frame.height);
}
export function mountainImage(scene: Phaser.Scene, area: MountainArea): Phaser.GameObjects.Image | undefined {
  if (!scene.textures.exists(MOUNTAIN_KEY)) return;
  return scene.add.image(area.x, area.y + area.height / 2, MOUNTAIN_KEY, area.variant).setOrigin(.5, 1).setDisplaySize(area.width, area.height);
}
