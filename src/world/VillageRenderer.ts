import type Phaser from 'phaser';
import { ART_KEYS, groundDepth } from '../art/ArtCatalog';
import { environmentImage } from '../art/ArtSprites';
import { villageImage } from '../art/VillageArt';
import { INTERIORS, VILLAGE_BUILDINGS, VILLAGE_RESIDENTS, type InteriorId, type WorldLocation } from '../gameplay/VillagePlaces';
import { REGION_SIZES } from '../gameplay/WorldRegions';
import { staticLandscape } from './StaticLandscape';
import { forestPathSurface } from './ForestPaths';
import { ROOM_FURNITURE, VILLAGE_PATHS, VILLAGE_PROPS, VILLAGE_TREES } from './VillageLayout';

const roads = VILLAGE_PATHS.map((path, index) => forestPathSurface(path, 5100 + index));
const textStyle = { fontFamily: 'Georgia, serif', fontSize: '17px', color: '#fff0bd', stroke: '#2b3e2c', strokeThickness: 4 };

export function drawVillage(scene: Phaser.Scene): void {
  const size = REGION_SIZES.village;
  scene.cameras.main.setBackgroundColor('#7a9c4b');
  for (let y = 0; y < size.height; y += 512) for (let x = 0; x < size.width; x += 512) {
    const width = Math.min(512, size.width - x); const height = Math.min(512, size.height - y);
    if (scene.textures.exists(ART_KEYS.groundTile)) scene.add.tileSprite(x, y, width, height, ART_KEYS.groundTile).setOrigin(0).setTilePosition(x, y);
    staticLandscape(scene, `village-ground-v1-${x}-${y}`, width, height, .1, (g) => {
      g.translateCanvas(-x, -y);
      g.fillStyle(0xa6b85f, .15).fillEllipse(1600, 1080, 1100, 850);
      for (const [layer, color] of [0x8e7b53, 0xc3ad77, 0xd6c18b].entries()) for (const road of roads) g.fillStyle(color).fillPoints(road.edges[layer], true);
      g.fillStyle(0x9f987b).fillRoundedRect(1400, 950, 420, 310, 70);
      for (let row = 0; row < 11; row++) for (let col = 0; col < 16; col++) {
        const px = 1420 + col * 24 + (row % 2) * 8; const py = 970 + row * 24;
        g.fillStyle((row + col) % 3 ? 0xb9b39a : 0xc8c0a5).fillRoundedRect(px, py, 21, 19, 4);
      }
      for (const road of roads) for (const pebble of road.pebbles) if (pebble.x >= x && pebble.x <= x + width && pebble.y >= y && pebble.y <= y + height) g.fillStyle(0x89754e, .5).fillEllipse(pebble.x, pebble.y, pebble.width, pebble.height);
    }).setPosition(x, y);
  }
  for (const tree of VILLAGE_TREES) environmentImage(scene, 'oak', tree.x, tree.y, 170)?.setDepth(groundDepth(tree.y));
  for (const house of VILLAGE_BUILDINGS) {
    const art = villageImage(scene, 'buildings', house.frame, house.x, house.y, house.width, house.height);
    if (art) art.setDepth(groundDepth(house.y - 5));
    else scene.add.rectangle(house.x, house.y - 100, house.width * .8, 180, 0x967956).setDepth(groundDepth(house.y));
    scene.add.text(house.x, house.y + 27, `${house.name}\n${house.interior ? 'Tür · Betretbar' : 'Privathaus'}`, { ...textStyle, fontSize: '14px', align: 'center' }).setOrigin(.5, 0).setDepth(10000);
    if (house.interior) scene.add.rectangle(house.x, house.y + 10, 30, 7, 0xf0d26a, .7).setDepth(.4);
  }
  for (const prop of VILLAGE_PROPS) villageImage(scene, 'props', prop.frame, prop.x, prop.y, prop.width, prop.height)?.setDepth(groundDepth(prop.y));
  scene.add.text(400, 1500, 'AUENQUELL\n← Aetherwald · Marktplatz →', textStyle).setDepth(10000);
  scene.add.text(1600, 1350, 'Marktplatz\n↑ Bibliothek · ← Gasthaus · Werkstatt →', { ...textStyle, fontSize: '16px', align: 'center' }).setOrigin(.5).setDepth(10000);
}

export function drawInterior(scene: Phaser.Scene, id: InteriorId): void {
  const room = INTERIORS[id]; scene.cameras.main.setBackgroundColor('#172b29');
  staticLandscape(scene, `village-room-v1-${id}`, room.size.width, room.size.height, 0, (g) => {
    g.fillStyle(0x3f3029).fillRect(50, 65, 860, 620);
    g.fillStyle(0xb79f75).fillRect(80, 80, 800, 65);
    g.fillStyle(room.floor).fillRect(80, 145, 800, 505);
    for (let row = 0; row < 21; row++) for (let col = 0; col < 8; col++) {
      const x = 82 + col * 100; const y = 147 + row * 24;
      g.lineStyle(1, 0x53402e, .6).strokeRect(x, y, 98, 22);
      g.lineStyle(1, 0xc3a474, .35).beginPath().moveTo(x + 8, y + 9).lineTo(x + 82, y + 11).strokePath();
    }
    g.fillStyle(0x367b79).fillRoundedRect(400, 450, 160, 180, 12);
    g.lineStyle(3, 0xd4be7c).strokeRoundedRect(410, 460, 140, 160, 8);
    for (const x of [230, 700]) { g.fillStyle(0x684c32).fillRect(x - 30, 88, 60, 50); g.fillStyle(0xf2cd78).fillRect(x - 24, 94, 48, 38); g.lineStyle(3, 0x82613b).beginPath().moveTo(x, 94).lineTo(x, 132).strokePath(); }
    g.fillStyle(0xb99a60).fillRect(440, 636, 80, 16);
  });
  for (const item of ROOM_FURNITURE[id]) villageImage(scene, 'interior', item.frame, item.x, item.y, item.width, item.height)?.setDepth(groundDepth(item.y));
  scene.add.text(480, 32, room.name, { ...textStyle, fontSize: '22px' }).setOrigin(.5).setDepth(10000);
  scene.add.text(480, 636, '↓ Ausgang · Auenquell', { ...textStyle, fontSize: '14px' }).setOrigin(.5).setDepth(10000);
}

export function drawVillageResidents(scene: Phaser.Scene, place: WorldLocation): void {
  for (const person of VILLAGE_RESIDENTS.filter((resident) => resident.interior === place.interior)) {
    const image = villageImage(scene, 'people', person.frame, person.x, person.y + 16, 36, 68);
    if (image) image.setDepth(groundDepth(person.y + 16));
    else scene.add.circle(person.x, person.y, 16, 0xcba468).setDepth(groundDepth(person.y));
    scene.add.text(person.x, person.y - 66, person.name, textStyle).setOrigin(.5).setDepth(10000);
  }
}
