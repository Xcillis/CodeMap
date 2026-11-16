import type Phaser from 'phaser';
import manifest from '../../public/assets/aetheria-village-v1/frames.json';

export const VILLAGE_ART = manifest;
export const VILLAGE_ART_BASE = 'assets/aetheria-village-v1/';
export const VILLAGE_ART_KEYS = { buildings: 'cm-village-buildings-v1', interior: 'cm-village-interior-v1', props: 'cm-village-props-v1', people: 'cm-village-people-v1' } as const;
type Sheet = keyof typeof manifest;
export function preloadVillageArt(scene: Phaser.Scene): void {
  for (const kind of Object.keys(manifest) as Sheet[]) if (!scene.textures.exists(VILLAGE_ART_KEYS[kind])) scene.load.image(VILLAGE_ART_KEYS[kind], VILLAGE_ART_BASE + manifest[kind].file);
}
export function registerVillageArt(scene: Phaser.Scene): void {
  for (const kind of Object.keys(manifest) as Sheet[]) {
    if (!scene.textures.exists(VILLAGE_ART_KEYS[kind])) continue;
    const texture = scene.textures.get(VILLAGE_ART_KEYS[kind]);
    for (const [name, frame] of Object.entries(manifest[kind].frames)) if (!texture.has(name)) texture.add(name, 0, frame.x, frame.y, frame.width, frame.height);
  }
}
export function villageImage<S extends Sheet>(scene: Phaser.Scene, sheet: S, frame: keyof typeof manifest[S]['frames'] & string, x: number, y: number, width: number, height?: number): Phaser.GameObjects.Image | undefined {
  const key = VILLAGE_ART_KEYS[sheet]; if (!scene.textures.exists(key)) return;
  const dimensions = scene.textures.getFrame(key, frame);
  return scene.add.image(x, y, key, frame).setOrigin(.5, 1).setDisplaySize(width, height ?? width * dimensions.height / dimensions.width);
}
