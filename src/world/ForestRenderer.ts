import type Phaser from 'phaser';
import { groundDepth } from '../art/ArtCatalog';
import { FOREST_ART, FOREST_ART_KEYS, forestImage } from '../art/ForestArt';
import { staticLandscape } from './StaticLandscape';
import { FOREST_CLEARINGS, FOREST_PROPS, FOREST_SIZE, FOREST_TREES } from './ForestLayout';
import { drawForestPaths } from './ForestPaths';

/** Static ground is cached in <=512px chunks; trees share atlases and use normal camera culling. */
export function drawForest(scene: Phaser.Scene): void {
  for (let y = 0; y < FOREST_SIZE.height; y += 512) for (let x = 0; x < FOREST_SIZE.width; x += 512) {
    const width = Math.min(512, FOREST_SIZE.width - x); const height = Math.min(512, FOREST_SIZE.height - y);
    if (scene.textures.exists(FOREST_ART_KEYS.tile)) scene.add.tileSprite(x, y, width, height, FOREST_ART_KEYS.tile).setOrigin(0).setTilePosition(x, y).setDepth(0);
    else scene.add.rectangle(x, y, width, height, 0x36563b).setOrigin(0);
    staticLandscape(scene, `forest-ground-v2-${x}-${y}`, width, height, .1, (g) => {
      g.translateCanvas(-x, -y);
      for (const area of FOREST_CLEARINGS) {
        if (Math.abs(area.x - x - width / 2) > width / 2 + area.radius * 1.3 || Math.abs(area.y - y - height / 2) > height / 2 + area.radius) continue;
        for (let ring = 12; ring > 0; ring--) g.fillStyle(0xc1ca54, .025).fillEllipse(area.x, area.y, area.radius * ring / 5, area.radius * ring / 7);
      }
      for (const area of FOREST_CLEARINGS) {
        g.fillStyle(0xffe39a, .05).fillTriangle(area.x - 240, area.y - 400, area.x + 60, area.y + 60, area.x + 180, area.y + 40);
        g.fillStyle(0xffefb0, .04).fillTriangle(area.x - 240, area.y - 400, area.x + 80, area.y + 30, area.x + 140, area.y + 20);
      }
      for (const tree of FOREST_TREES) if (tree.x >= x - 70 && tree.x < x + width + 70 && tree.y >= y - 30 && tree.y < y + height + 30) g.fillStyle(0x102c23, .25).fillEllipse(tree.x + 16, tree.y, 90, 28);
      drawForestPaths(g, x, y, width, height);
    }).setPosition(x, y);
  }
  for (const tree of FOREST_TREES) {
    const frame = FOREST_ART.trees.frames[tree.variant]; const width = tree.height * frame.width / frame.height;
    const image = forestImage(scene, 'trees', tree.variant, tree.x, tree.y, width, tree.height);
    if (image) image.setDepth(groundDepth(tree.y));
    else scene.add.ellipse(tree.x, tree.y - 55, 80, 110, 0x20543e).setDepth(groundDepth(tree.y));
  }
  for (const prop of FOREST_PROPS) forestImage(scene, 'props', prop.variant, prop.x, prop.y, prop.width)?.setDepth(groundDepth(prop.y));
  for (const area of FOREST_CLEARINGS) scene.add.text(area.x, area.y - 125, area.name, { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f2e6ad', stroke: '#20382c', strokeThickness: 4 }).setOrigin(.5).setDepth(10000);
  for (const sign of [{ x: 780, y: 1330, text: '↑ Neria · Sonnenlichtung\n→ Tala · Forscherhain' }, { x: 1820, y: 1660, text: '← Lyra · Waldsaum\nTala · Mooshain →' }]) scene.add.text(sign.x, sign.y, sign.text, { fontSize: '14px', color: '#f0dd9d', backgroundColor: '#263f31', padding: { x: 8, y: 6 } }).setOrigin(.5).setDepth(10000);
  scene.add.text(260, 1540, 'AETHERWALD\nBedingungen & Verzweigungen', { fontSize: '18px', color: '#f2e6ad', stroke: '#20382c', strokeThickness: 4 }).setDepth(10000);
}
