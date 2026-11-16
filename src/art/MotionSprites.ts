import type Phaser from 'phaser';
import { MOTION_BASE, MOTION_KEYS, MOTION_MANIFEST, motionKey, type MotionActor, type MotionMode, type MotionSheet } from './MotionCatalog';

export const motionTexture = (sheet: MotionSheet): string => MOTION_KEYS[sheet];

export function preloadMotion(scene: Phaser.Scene): void {
  for (const sheet of Object.keys(MOTION_MANIFEST.sheets) as MotionSheet[]) {
    const key = motionTexture(sheet); if (!scene.textures.exists(key)) scene.load.image(key, `${MOTION_BASE}${MOTION_MANIFEST.sheets[sheet].file}`);
  }
}
export function registerMotion(scene: Phaser.Scene): void {
  for (const sheet of Object.keys(MOTION_MANIFEST.sheets) as MotionSheet[]) {
    const key = motionTexture(sheet); if (!scene.textures.exists(key)) continue;
    const texture = scene.textures.get(key);
    for (const [name, frame] of Object.entries(MOTION_MANIFEST.sheets[sheet].frames)) {
      if (texture.has(name)) continue;
      texture.add(name, 0, frame.x, frame.y, frame.width, frame.height)?.setTrim(frame.canvasWidth, frame.canvasHeight, frame.offsetX, frame.offsetY, frame.width, frame.height);
    }
  }
  for (const [actor, data] of Object.entries(MOTION_MANIFEST.actors)) {
    const texture = motionTexture(data.sheet as MotionSheet); if (!scene.textures.exists(texture)) continue;
    for (const mode of ['idle', 'walk'] as const) {
      const key = motionKey(actor as MotionActor, mode); if (scene.anims.exists(key)) continue;
      const frames = data[mode].map((frame) => ({ key: texture, frame }));
      scene.anims.create({ key, repeat: -1, frameRate: mode === 'walk' ? data.sheet === 'npcs' ? 5 : 8 : 10,
        frames: mode === 'idle' ? [{ ...frames[0], duration: 1400 + Object.keys(MOTION_MANIFEST.actors).indexOf(actor) % 7 * 173 }, { ...frames[1], duration: 90 }, { ...frames[0], duration: 500 }] : frames });
    }
  }
}
export function motionSprite(scene: Phaser.Scene, actor: MotionActor, x: number, y: number, height = 64): Phaser.GameObjects.Sprite | undefined {
  const data = MOTION_MANIFEST.actors[actor]; const texture = motionTexture(data.sheet as MotionSheet);
  if (!scene.textures.exists(texture) || !scene.anims.exists(motionKey(actor, 'idle'))) return;
  const sprite = scene.add.sprite(x, y, texture, data.idle[0]).setOrigin(.5, 1).setScale(height / data.height);
  playMotion(sprite, actor, 'idle'); return sprite;
}
export function playMotion(sprite: Phaser.GameObjects.Sprite, actor: MotionActor, mode: MotionMode, horizontal = 0): void {
  if (actor.startsWith('hero-')) sprite.setFlipX(false);
  else if (horizontal) sprite.setFlipX(horizontal > 0 ? MOTION_MANIFEST.actors[actor].sourceFacing === 'left' : MOTION_MANIFEST.actors[actor].sourceFacing !== 'left');
  sprite.play(motionKey(actor, mode), true);
}
