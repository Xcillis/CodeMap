import type Phaser from 'phaser';
import manifest from '../../public/assets/aetheria-valley-v2/frames.json';

export const VALLEY_ART = manifest;
export type ValleyProp = keyof typeof manifest.environment.frames;
export const VALLEY_ART_BASE = 'assets/aetheria-valley-v2/';
export const VALLEY_ART_KEYS = { environment: 'cm-valley-environment-v2', grass: 'cm-valley-grass-v2', water: 'cm-valley-water-v2', foam: 'cm-valley-foam-v2', groundTile: 'cm-valley-ground-tile-v2', glow: 'cm-valley-window-glow-v2' } as const;
export const WATER_TILES = [0, 1, 2, 3].map((index) => `cm-valley-water-tile-v2-${index}`);

export function preloadValleyArt(scene: Phaser.Scene): void {
  for (const kind of ['environment', 'grass', 'water', 'foam'] as const) {
    if (!scene.textures.exists(VALLEY_ART_KEYS[kind])) scene.load.image(VALLEY_ART_KEYS[kind], `${VALLEY_ART_BASE}${manifest[kind].file}`);
  }
}

/** Small shared power-of-two tiles avoid per-frame canvas uploads and large TileSprite copies. */
export function registerValleyArt(scene: Phaser.Scene): void {
  for (const kind of ['environment', 'foam'] as const) {
    if (!scene.textures.exists(VALLEY_ART_KEYS[kind])) continue;
    const texture = scene.textures.get(VALLEY_ART_KEYS[kind]);
    for (const [name, frame] of Object.entries(manifest[kind].frames)) if (!texture.has(name)) texture.add(name, 0, frame.x, frame.y, frame.width, frame.height);
  }
  const tile = (source: string, key: string, x: number, y: number, width: number, height: number) => {
    if (!scene.textures.exists(source) || scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 256, 256);
    if (canvas) { canvas.context.drawImage(scene.textures.get(source).getSourceImage() as HTMLImageElement, x, y, width, height, 0, 0, 256, 256); canvas.refresh(); }
  };
  tile(VALLEY_ART_KEYS.grass, VALLEY_ART_KEYS.groundTile, 0, 0, manifest.grass.width, manifest.grass.height);
  Object.values(manifest.water.frames).forEach((frame, index) => tile(VALLEY_ART_KEYS.water, WATER_TILES[index], frame.x, frame.y, frame.width, frame.height));
  if (!scene.textures.exists(VALLEY_ART_KEYS.glow)) {
    const glow = scene.textures.createCanvas(VALLEY_ART_KEYS.glow, 128, 128);
    if (glow) {
      const gradient = glow.context.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255,221,130,0.9)'); gradient.addColorStop(.3, 'rgba(255,177,56,0.35)'); gradient.addColorStop(1, 'rgba(255,154,32,0)');
      glow.context.fillStyle = gradient; glow.context.fillRect(0, 0, 128, 128); glow.refresh();
    }
  }
}

export function valleyImage(scene: Phaser.Scene, frame: ValleyProp, x: number, y: number, width: number, height?: number): Phaser.GameObjects.Image | undefined {
  if (!scene.textures.exists(VALLEY_ART_KEYS.environment)) return;
  const size = manifest.environment.frames[frame];
  return scene.add.image(x, y, VALLEY_ART_KEYS.environment, frame).setOrigin(.5, 1).setDisplaySize(width, height ?? width * size.height / size.width);
}
