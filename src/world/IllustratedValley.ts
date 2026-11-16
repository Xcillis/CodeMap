import type Phaser from 'phaser';
import { ART_KEYS, groundDepth } from '../art/ArtCatalog';
import { environmentImage } from '../art/ArtSprites';
import { WORLD_SIZE } from '../gameplay/WorldRegions';
import { staticLandscape } from './StaticLandscape';
import { VALLEY_BOULDERS, VALLEY_BORDERS, VALLEY_BRIDGE, VALLEY_TREES, valleyBlocked } from './ValleyLayout';

export function drawIllustratedValley(scene: Phaser.Scene, paintGround: (graphics: Phaser.GameObjects.Graphics) => void): Phaser.GameObjects.Container {
  scene.add.tileSprite(0, 0, WORLD_SIZE.width, WORLD_SIZE.height, ART_KEYS.groundTile).setOrigin(0).setTileScale(1.4).setDepth(0);
  staticLandscape(scene, 'valley-water-art-v2', WORLD_SIZE.width, WORLD_SIZE.height, .1, paintGround);
  const bridge = VALLEY_BRIDGE;
  environmentImage(scene, 'bridge', bridge.x, bridge.y + bridge.height / 2, bridge.width, bridge.height)?.setDepth(.3);
  for (const tree of VALLEY_TREES) {
    const foot = tree.y + 22 * tree.size;
    environmentImage(scene, tree.kind === 'pine' ? 'pine' : 'oak', tree.x, foot, (tree.kind === 'pine' ? 92 : 132) * tree.size)?.setDepth(groundDepth(foot));
  }
  for (const rock of VALLEY_BOULDERS) environmentImage(scene, 'boulder', rock.x, rock.y + rock.height / 2, rock.width * 1.08, rock.height * 1.35)?.setDepth(groundDepth(rock.y + rock.height / 2));
  for (const border of VALLEY_BORDERS) {
    const vertical = border.height > border.width; const length = vertical ? border.height : border.width;
    for (let offset = 28; offset < length; offset += 58) {
      const x = vertical ? border.x : border.x - border.width / 2 + offset;
      const foot = vertical ? border.y - border.height / 2 + offset + 22 : border.y + border.height / 2;
      environmentImage(scene, 'boulder', x, foot, vertical ? border.width + 40 : 110, 85)?.setDepth(groundDepth(foot));
    }
  }
  for (let y = 135; y < 950; y += 145) for (let x = 100; x < 1350; x += 150) {
    const point = { x: x + (y % 31), y };
    if (!valleyBlocked(point, false, 25)) environmentImage(scene, 'flowers', point.x, point.y, 34)?.setDepth(.2);
  }
  const landslide = scene.add.container().setDepth(groundDepth(615));
  for (const [index, y] of [465, 520, 580].entries()) {
    const rubble = environmentImage(scene, 'rubble', 1460 + (index % 2 ? 9 : -6), y + 30, 108, 78);
    if (rubble) landslide.add(rubble);
  }
  return landslide;
}
