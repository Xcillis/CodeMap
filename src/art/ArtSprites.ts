import type Phaser from 'phaser';
import { ART_BASE, ART_KEYS, ART_MANIFEST, type CharacterFrame, type EnvironmentFrame } from './ArtCatalog';

/** Shared local textures survive scene switches. Failure retains the procedural prototype visuals. */
export function preloadArt(scene: Phaser.Scene): void {
  for (const kind of ['environment', 'characters', 'grass'] as const) {
    if (!scene.textures.exists(ART_KEYS[kind])) scene.load.image(ART_KEYS[kind], `${ART_BASE}${ART_MANIFEST[kind].file}`);
  }
}
export function registerArtFrames(scene: Phaser.Scene): void {
  for (const kind of ['environment', 'characters'] as const) {
    if (!scene.textures.exists(ART_KEYS[kind])) continue;
    const texture = scene.textures.get(ART_KEYS[kind]);
    for (const [name, frame] of Object.entries(ART_MANIFEST[kind].frames)) if (!texture.has(name)) texture.add(name, 0, frame.x, frame.y, frame.width, frame.height);
  }
  // TileSprite otherwise expands a non-power-of-two generated PNG into a large private canvas per scene.
  if (scene.textures.exists(ART_KEYS.grass) && !scene.textures.exists(ART_KEYS.groundTile)) {
    const tile = scene.textures.createCanvas(ART_KEYS.groundTile, 256, 256);
    if (tile) { tile.context.drawImage(scene.textures.get(ART_KEYS.grass).getSourceImage() as HTMLImageElement, 0, 0, 256, 256); tile.refresh(); }
  }
}
export function characterImage(scene: Phaser.Scene, frame: string, x: number, y: number, height = 64): Phaser.GameObjects.Image | undefined {
  if (!Object.hasOwn(ART_MANIFEST.characters.frames, frame) || !scene.textures.exists(ART_KEYS.characters)) return;
  const size = ART_MANIFEST.characters.frames[frame as CharacterFrame];
  return scene.add.image(x, y, ART_KEYS.characters, frame).setOrigin(.5, 1).setDisplaySize(height * size.width / size.height, height);
}
export function environmentImage(scene: Phaser.Scene, frame: EnvironmentFrame, x: number, y: number, width: number, height?: number): Phaser.GameObjects.Image | undefined {
  if (!scene.textures.exists(ART_KEYS.environment)) return;
  const size = ART_MANIFEST.environment.frames[frame];
  return scene.add.image(x, y, ART_KEYS.environment, frame).setOrigin(.5, 1).setDisplaySize(width, height ?? width * size.height / size.width);
}
