import Phaser from 'phaser';
import { WORLD_SIZE } from '../gameplay/WorldRegions';
import {
  RIVER_POINTS, RIVER_WIDTH, VALLEY_BOULDERS, VALLEY_BORDERS, VALLEY_BRIDGE, VALLEY_PATHS,
  VALLEY_POND, VALLEY_TREES, riverX, valleyBlocked, type Obstacle, type Point, type ValleyTree,
} from './ValleyLayout';

const palette = { grass: 0x7caa4c, light: 0xa9c95b, shade: 0x517d3e, sand: 0xd8bd82, edge: 0x9b925b, water: 0x3098aa };
function polygon(g: Phaser.GameObjects.Graphics, color: number, coords: readonly number[]): void {
  g.fillStyle(color).fillPoints(Array.from({ length: coords.length / 2 }, (_, index) => ({ x: coords[index * 2], y: coords[index * 2 + 1] })), true);
}
function randomSource(seed: number): () => number {
  let value = seed;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

function drawRock(g: Phaser.GameObjects.Graphics, body: Obstacle, moss = true): void {
  const { x, y } = body; const w = body.width / 2; const h = body.height / 2;
  g.fillStyle(0x34443c, .22).fillEllipse(x + 5, y + h - 1, body.width + 12, 14);
  polygon(g, 0x626f6b, [x - w, y + h * .65, x - w * .8, y - h * .55, x - w * .15, y - h, x + w * .6, y - h * .85, x + w, y + h * .2, x + w * .65, y + h, x - w * .5, y + h]);
  polygon(g, 0xa6aa91, [x - w * .8, y - h * .55, x - w * .15, y - h, x + w * .6, y - h * .85, x + w * .2, y - h * .05, x - w * .45, y + h * .05]);
  polygon(g, 0x879181, [x + w * .2, y - h * .05, x + w * .6, y - h * .85, x + w, y + h * .2, x + w * .65, y + h, x + w * .45, y + h * .1]);
  polygon(g, 0x4d605a, [x - w * .45, y + h * .05, x + w * .2, y - h * .05, x + w * .45, y + h * .1, x + w * .65, y + h, x - w * .5, y + h]);
  g.lineStyle(2, 0xc7c6a2, .5).beginPath().moveTo(x - w * .8, y - h * .55).lineTo(x - w * .45, y + h * .05).lineTo(x - w * .5, y + h * .8).strokePath();
  if (moss) {
    polygon(g, 0x759b48, [x - w * .75, y - h * .55, x - w * .15, y - h, x + w * .56, y - h * .83, x + w * .05, y - h * .48, x - w * .35, y - h * .3]);
    g.fillStyle(0xc0cf68).fillEllipse(x - w * .1, y - h * .7, w * .7, h * .2);
  }
}

function drawBorders(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(1); const random = randomSource(75);
  for (const body of VALLEY_BORDERS) {
    const vertical = body.height > body.width;
    g.fillStyle(0x4e6754).fillRect(body.x - body.width / 2, body.y - body.height / 2, body.width, body.height);
    const length = vertical ? body.height : body.width;
    for (let offset = 22; offset < length; offset += 46) {
      const x = vertical ? body.x + (random() - .5) * 10 : body.x - body.width / 2 + offset;
      const y = vertical ? body.y - body.height / 2 + offset : body.y + (random() - .5) * 8;
      drawRock(g, { x, y, width: vertical ? body.width - 4 : 64, height: vertical ? 64 : body.height - 3 });
    }
  }
}

function drawTree(scene: Phaser.Scene, tree: ValleyTree, index: number): void {
  const { x, y, size } = tree; const g = scene.add.graphics().setDepth(2); const canopy = scene.add.graphics().setDepth(6);
  g.fillStyle(0x284b35, .25).fillEllipse(x + 10, y + 13, 76 * size, 25 * size);
  g.fillStyle(0x694a2e).fillRect(x - 6 * size, y - 35 * size, 13 * size, 57 * size);
  polygon(g, 0x976b3b, [x, y - 30 * size, x + 3 * size, y + 15 * size, x + 14 * size, y + 23 * size, x + 3 * size, y + 20 * size, x - 9 * size, y + 21 * size, x - 3 * size, y + 10 * size]);
  const leaf = tree.kind === 'pine' ? [0x204f3b, 0x337849, 0x57994e] : [0x3e763b, 0x69a343, 0x99bb4d];
  if (tree.kind === 'pine') {
    for (let tier = 0; tier < 4; tier++) {
      const half = (35 - tier * 6) * size; const base = y - (12 + tier * 20) * size;
      polygon(canopy, leaf[tier ? 1 : 0], [x - half, base, x + half, base, x, base - 49 * size]);
      polygon(canopy, leaf[2], [x - half, base, x, base - 49 * size, x - 5 * size, base - 6 * size]);
    }
  } else {
    const random = randomSource(index + 44);
    for (let layer = 0; layer < 3; layer++) {
      canopy.fillStyle(leaf[layer]);
      for (let lobe = 0; lobe < 8; lobe++) {
        const angle = lobe * Math.PI / 4; const radius = (22 - layer * 4) * size;
        canopy.fillCircle(x + Math.cos(angle) * radius - layer * 4, y - (42 + layer * 10) * size + Math.sin(angle) * radius * .65, (23 + random() * 7 - layer * 3) * size);
      }
    }
  }
}

function drawPaths(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(.2);
  for (const route of VALLEY_PATHS) {
    const points = new Phaser.Curves.Spline(route.map((point) => new Phaser.Math.Vector2(point.x, point.y))).getPoints(100);
    g.lineStyle(54, palette.edge, .7).strokePoints(points, false);
    g.lineStyle(46, palette.sand).strokePoints(points, false);
    g.lineStyle(26, 0xe9d29b, .65).strokePoints(points, false);
    for (let i = 4; i < points.length - 4; i += 5) {
      const point = points[i]; g.fillStyle(0xb7a371, .4).fillEllipse(point.x + 8, point.y + 4, 5, 2);
    }
  }
  g.fillStyle(0xc6b57e, .8).fillEllipse(440, 390, 130, 95).fillEllipse(1280, 650, 130, 92);
  g.lineStyle(3, 0x8b8157, .6).strokeEllipse(440, 390, 130, 95);
}

function drawWater(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(.3);
  g.lineStyle(RIVER_WIDTH + 18, 0x71866c).strokePoints([...RIVER_POINTS], false);
  g.lineStyle(RIVER_WIDTH + 8, 0xb8b990).strokePoints([...RIVER_POINTS], false);
  g.lineStyle(RIVER_WIDTH, palette.water).strokePoints([...RIVER_POINTS], false);
  g.lineStyle(RIVER_WIDTH * .58, 0x55b9bb, .8).strokePoints([...RIVER_POINTS], false);
  const pond = VALLEY_POND;
  g.fillStyle(0x748164).fillEllipse(pond.x, pond.y + 3, pond.width + 23, pond.height + 23);
  g.fillStyle(0xb8b990).fillEllipse(pond.x, pond.y, pond.width + 10, pond.height + 10);
  g.fillStyle(palette.water).fillEllipse(pond.x, pond.y, pond.width, pond.height);
  g.fillStyle(0x58b4ac, .8).fillEllipse(pond.x - 12, pond.y - 8, pond.width * .8, pond.height * .76);
  for (let i = 1; i < RIVER_POINTS.length - 2; i += 10) {
    const { x, y } = RIVER_POINTS[i]; const side = i % 3 ? -1 : 1;
    drawRock(g, { x: x + side * (RIVER_WIDTH / 2 + 8), y, width: 13 + i % 9, height: 12 }, false);
    g.lineStyle(2, 0xd4f2db, .55).beginPath().moveTo(x - 10, y + 4).lineTo(x + 6, y + 4).strokePath();
  }
  for (const y of [235, 428]) {
    const x = riverX(y);
    g.fillStyle(0xe0f2d7, .8).fillEllipse(x, y + 14, 51, 12);
    for (let stripe = 0; stripe < 6; stripe++) g.lineStyle(stripe % 2 ? 2 : 4, 0xc5f0e3, .75).beginPath().moveTo(x - 22 + stripe * 8, y - 15).lineTo(x - 16 + stripe * 6, y + 13).strokePath();
  }
  for (let i = 0; i < 9; i++) {
    const angle = i * 2.4; const x = pond.x + Math.cos(angle) * 70; const y = pond.y + Math.sin(angle) * 34;
    g.fillStyle(0x88b75a).fillEllipse(x, y, 15, 8); g.lineStyle(1, 0xc4d375).beginPath().moveTo(x, y).lineTo(x + 6, y - 2).strokePath();
  }
  for (let i = 0; i < 7; i++) {
    const y = 160 + i * 118; const ripple = scene.add.ellipse(riverX(y), y, 18, 3).setStrokeStyle(1, 0xd3f1dc, .65).setDepth(.35);
    scene.tweens.add({ targets: ripple, y: y + 14, alpha: .15, duration: 1900 + i * 95, delay: i * 180, yoyo: true, repeat: -1 });
  }
}

function drawBridge(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(.5); const bridge = VALLEY_BRIDGE;
  const left = bridge.x - bridge.width / 2; const top = bridge.y - bridge.height / 2;
  g.fillStyle(0x203a35, .3).fillRect(left + 6, top + 10, bridge.width, bridge.height);
  g.fillStyle(0x705435).fillRect(left, top, bridge.width, bridge.height);
  for (let x = left + 2; x < left + bridge.width; x += 13) {
    g.fillStyle((x - left) % 2 ? 0xb28a50 : 0xc09b5e).fillRect(x, top + 5, 11, bridge.height - 10);
    g.lineStyle(1, 0xddb973, .6).beginPath().moveTo(x + 4, top + 10).lineTo(x + 4, top + bridge.height - 9).strokePath();
  }
  for (const side of [-1, 1]) {
    const y = bridge.y + side * (bridge.height / 2 - 2);
    g.lineStyle(5, 0x65482d).beginPath().moveTo(left, y).lineTo(left + bridge.width, y).strokePath();
    g.lineStyle(2, 0xe1bb79).beginPath().moveTo(left, y - 2).lineTo(left + bridge.width, y - 2).strokePath();
    for (const x of [left + 3, bridge.x, left + bridge.width - 3]) {
      g.fillStyle(0x765536).fillRect(x - 4, y - 7, 8, 16); g.fillStyle(0xd1ad70).fillEllipse(x, y - 7, 11, 5);
    }
  }
}

function addMeadowDetail(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(.1); const random = randomSource(20261114);
  const pathSegments = VALLEY_PATHS.flatMap((points) => points.slice(1).map((end, i) => ({ start: points[i], end })));
  const nearPath = (point: Point) => pathSegments.some(({ start, end }) => {
    const dx = end.x - start.x; const dy = end.y - start.y;
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy) < 36;
  });
  for (let i = 0; i < 950; i++) {
    const point = { x: 70 + random() * 1310, y: 85 + random() * 860 };
    if (valleyBlocked(point, false, 28) || nearPath(point)) continue;
    const { x, y } = point;
    g.lineStyle(1, i % 2 ? 0x658f43 : 0xa9c662, .7).beginPath().moveTo(x - 3, y).lineTo(x - 4, y - 5).moveTo(x, y + 1).lineTo(x + 1, y - 7).strokePath();
    if (i % 4 === 0) {
      const color = [0xf2cf56, 0xe6e9ba, 0xb494d0][i % 3];
      for (let flower = 0; flower < 5; flower++) {
        const px = x + random() * 20 - 10; const py = y + random() * 12 - 6;
        g.fillStyle(color).fillCircle(px, py, 2); g.fillStyle(0xc7a146).fillCircle(px, py, .7);
      }
    }
  }
}

/** Local, layered vector placeholders inspired by the supplied valley reference; no bitmap background. */
export function drawValley(scene: Phaser.Scene): { landslide: Phaser.GameObjects.Container } {
  const ground = scene.add.graphics(); const random = randomSource(21);
  ground.fillStyle(palette.grass).fillRect(0, 0, WORLD_SIZE.width, WORLD_SIZE.height);
  for (let i = 0; i < 180; i++) ground.fillStyle(i % 2 ? palette.light : palette.shade, .12).fillEllipse(random() * 1600, random() * 1040, 70 + random() * 210, 25 + random() * 90);
  drawPaths(scene); drawWater(scene); drawBridge(scene); addMeadowDetail(scene); drawBorders(scene);
  const rocks = scene.add.graphics().setDepth(1);
  for (const body of VALLEY_BOULDERS) drawRock(rocks, body);
  VALLEY_TREES.forEach((tree, index) => drawTree(scene, tree, index));
  const landslide = scene.add.container(0, 0).setDepth(4); const rubble = scene.add.graphics(); landslide.add(rubble);
  rubble.fillStyle(0x8e8060).fillEllipse(1460, 520, 98, 172);
  for (const [x, y, width, height] of [[1440, 449, 49, 36], [1480, 461, 45, 45], [1440, 490, 58, 49], [1480, 507, 47, 44], [1445, 536, 57, 51], [1480, 557, 47, 42], [1435, 582, 43, 38], [1472, 590, 48, 34]]) drawRock(rubble, { x, y, width, height }, false);
  scene.add.text(160, 100, 'TAL VON AETHERIA', { fontFamily: 'Georgia, serif', fontSize: '25px', color: '#fff3cc', stroke: '#354c34', strokeThickness: 5 }).setDepth(4);
  return { landslide };
}
