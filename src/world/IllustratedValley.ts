import type Phaser from 'phaser';
import { ART_KEYS, groundDepth } from '../art/ArtCatalog';
import { environmentImage } from '../art/ArtSprites';
import type { EnvironmentFrame } from '../art/ArtCatalog';
import { VALLEY_ART_KEYS, valleyImage } from '../art/ValleyArt';
import { addValleySunlight, addValleyWater } from './ValleyEffects';
import { nearAcademyPath } from './ValleyScenery';
import { VALLEY_MOUNTAINS, mountainContains } from './ValleyMountains';
import { mountainImage } from '../art/MountainArt';
import { WORLD_SIZE } from '../gameplay/WorldRegions';
import { staticLandscape } from './StaticLandscape';
import { RIVER_WIDTH, VALLEY_BOULDERS, VALLEY_BRIDGE, VALLEY_POND, VALLEY_TREES, riverX, valleyBlocked } from './ValleyLayout';

export function drawIllustratedValley(scene: Phaser.Scene, paintGround: (graphics: Phaser.GameObjects.Graphics) => void): Phaser.GameObjects.Container {
  const prop = (frame: EnvironmentFrame, x: number, y: number, width: number, height?: number) => valleyImage(scene, frame, x, y, width, height) ?? environmentImage(scene, frame, x, y, width, height);
  const richGround = scene.textures.exists(VALLEY_ART_KEYS.groundTile);
  scene.add.tileSprite(0, 0, WORLD_SIZE.width, WORLD_SIZE.height, richGround ? VALLEY_ART_KEYS.groundTile : ART_KEYS.groundTile).setOrigin(0).setTileScale(1.4).setDepth(0);
  staticLandscape(scene, 'valley-approach-water-v3', WORLD_SIZE.width, WORLD_SIZE.height, .1, paintGround);
  addValleyWater(scene); addValleySunlight(scene);
  const bridge = VALLEY_BRIDGE;
  prop('bridge', bridge.x, bridge.y + bridge.height / 2, bridge.width, bridge.height)?.setDepth(.3);
  for (const tree of VALLEY_TREES) {
    const foot = tree.y + 22 * tree.size;
    if (mountainContains({ x: tree.x, y: foot })) continue;
    prop(tree.kind === 'pine' ? 'pine' : 'oak', tree.x, foot, (tree.kind === 'pine' ? 92 : 132) * tree.size)?.setDepth(groundDepth(foot));
  }
  for (const rock of VALLEY_BOULDERS) prop('boulder', rock.x, rock.y + rock.height / 2, rock.width * 1.08, rock.height * 1.35)?.setDepth(groundDepth(rock.y + rock.height / 2));
  for (const area of VALLEY_MOUNTAINS) {
    const foot = area.y + area.height / 2;
    (mountainImage(scene, area) ?? prop('boulder', area.x, foot, area.width, area.height))?.setDepth(groundDepth(foot));
  }
  for (let y = 135; y < 950; y += 145) for (let x = 100; x < 1350; x += 150) {
    const point = { x: x + (y % 31), y };
    if (!valleyBlocked(point, false, 25) && !nearAcademyPath(point)) prop('flowers', point.x, point.y, 28)?.setDepth(.2);
  }
  for (let y = 140; y < 980; y += 82) {
    if (Math.abs(y - bridge.y) < bridge.height / 2 + 35) continue;
    for (const side of [-1, 1]) {
      const x = riverX(y) + side * (RIVER_WIDTH / 2 + 12);
      valleyImage(scene, 'bankRock', x, y + 9, 23, 18)?.setDepth(.21);
      if (side === 1 && y % 3) valleyImage(scene, 'reeds', x + 7, y + 9, 22)?.setDepth(.22);
    }
  }
  for (const [x, y] of [[VALLEY_POND.x - 40, VALLEY_POND.y - 16], [VALLEY_POND.x + 43, VALLEY_POND.y + 22]]) valleyImage(scene, 'lilies', x, y, 38)?.setDepth(.23);
  for (let index = 0; index < 7; index++) {
    const angle = index * Math.PI * 2 / 7; const x = VALLEY_POND.x + Math.cos(angle) * 114; const y = VALLEY_POND.y + Math.sin(angle) * 76;
    valleyImage(scene, 'reeds', x, y, 23)?.setDepth(.22);
  }
  const pond = VALLEY_POND;
  for (const [x, y] of [[pond.x - 75, pond.y - 22], [pond.x + 60, pond.y + 44]]) valleyImage(scene, 'reeds', x, y, 30)?.setDepth(.22);
  valleyImage(scene, 'lilies', pond.x + 12, pond.y + 20, 78)?.setDepth(.2);
  for (const tree of VALLEY_TREES) {
    const point = { x: tree.x + 27, y: tree.y + 31 };
    if (!nearAcademyPath(point)) valleyImage(scene, 'fern', point.x, point.y, 29)?.setDepth(groundDepth(point.y));
  }
  const landslide = scene.add.container().setDepth(groundDepth(615));
  for (const [index, y] of [465, 520, 580].entries()) {
    const rubble = prop('rubble', 1460 + (index % 2 ? 9 : -6), y + 30, 108, 78);
    if (rubble) landslide.add(rubble);
  }
  return landslide;
}
