import type Phaser from 'phaser';
import manifest from '../../public/assets/aetheria-forest-v1/signpost-v1.json';

export const SIGNPOST_ART = manifest;
export const SIGNPOST_KEY = 'cm-signpost-v1';
export const SIGNPOST_URL = `assets/aetheria-forest-v1/${manifest.file}`;

export function preloadSignpost(scene: Phaser.Scene): void {
  if (!scene.textures.exists(SIGNPOST_KEY)) scene.load.image(SIGNPOST_KEY, SIGNPOST_URL);
}

export function registerSignpost(scene: Phaser.Scene): void {
  if (!scene.textures.exists(SIGNPOST_KEY)) return;
  const texture = scene.textures.get(SIGNPOST_KEY);
  const { x, y, width, height } = manifest.frame;
  if (!texture.has('signpost')) texture.add('signpost', 0, x, y, width, height);
}

export function signpostImage(scene: Phaser.Scene, x: number, y: number, height = 84): Phaser.GameObjects.Image | undefined {
  if (!scene.textures.exists(SIGNPOST_KEY)) return;
  return scene.add.image(x, y, SIGNPOST_KEY, 'signpost').setOrigin(.5, 1).setDisplaySize(height * manifest.frame.width / manifest.frame.height, height);
}
