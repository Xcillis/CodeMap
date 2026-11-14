import type Phaser from 'phaser';

/** Paint once per game, reuse on region visits. Temporary vector geometry never enters the display list. */
export function staticLandscape(
  scene: Phaser.Scene, key: string, width: number, height: number, depth: number,
  paint: (graphics: Phaser.GameObjects.Graphics) => void,
): Phaser.GameObjects.Image {
  if (!scene.textures.exists(key)) {
    const graphics = scene.make.graphics({}, false);
    try {
      paint(graphics);
      graphics.generateTexture(key, width, height);
    } catch (error) {
      if (scene.textures.exists(key)) scene.textures.remove(key);
      throw error;
    } finally { graphics.destroy(); }
  }
  return scene.add.image(0, 0, key).setOrigin(0).setDepth(depth);
}
