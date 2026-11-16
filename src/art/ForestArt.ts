import type Phaser from 'phaser';
import manifest from '../../public/assets/aetheria-forest-v1/frames.json';

export const FOREST_ART = manifest;
export const FOREST_ART_BASE = 'assets/aetheria-forest-v1/';
export const FOREST_ART_KEYS = { trees: 'cm-forest-trees-v1', props: 'cm-forest-props-v1', floor: 'cm-forest-floor-v1', tile: 'cm-forest-tile-v1' } as const;
export function preloadForestArt(scene: Phaser.Scene): void {
  for (const kind of ['trees', 'props', 'floor'] as const) if (!scene.textures.exists(FOREST_ART_KEYS[kind])) scene.load.image(FOREST_ART_KEYS[kind], FOREST_ART_BASE + manifest[kind].file);
}
export function registerForestArt(scene: Phaser.Scene): void {
  for (const kind of ['trees', 'props'] as const) {
    if (!scene.textures.exists(FOREST_ART_KEYS[kind])) continue;
    const texture = scene.textures.get(FOREST_ART_KEYS[kind]);
    for (const [name, frame] of Object.entries(manifest[kind].frames)) if (!texture.has(name)) texture.add(name, 0, frame.x, frame.y, frame.width, frame.height);
  }
  if (scene.textures.exists(FOREST_ART_KEYS.floor) && !scene.textures.exists(FOREST_ART_KEYS.tile)) {
    const tile = scene.textures.createCanvas(FOREST_ART_KEYS.tile, 256, 256);
    if (tile) { tile.context.drawImage(scene.textures.get(FOREST_ART_KEYS.floor).getSourceImage() as HTMLImageElement, 0, 0, manifest.floor.width, manifest.floor.height, 0, 0, 256, 256); tile.refresh(); }
  }
}
export function forestImage(scene: Phaser.Scene, sheet: 'trees', frame: keyof typeof manifest.trees.frames, x: number, y: number, width: number, height?: number): Phaser.GameObjects.Image | undefined;
export function forestImage(scene: Phaser.Scene, sheet: 'props', frame: keyof typeof manifest.props.frames, x: number, y: number, width: number, height?: number): Phaser.GameObjects.Image | undefined;
export function forestImage(scene: Phaser.Scene, sheet: 'trees' | 'props', frame: string, x: number, y: number, width: number, height?: number): Phaser.GameObjects.Image | undefined {
  if (!scene.textures.exists(FOREST_ART_KEYS[sheet])) return;
  const size = scene.textures.getFrame(FOREST_ART_KEYS[sheet], frame);
  return scene.add.image(x, y, FOREST_ART_KEYS[sheet], frame).setOrigin(.5, 1).setDisplaySize(width, height ?? width * size.height / size.width);
}
