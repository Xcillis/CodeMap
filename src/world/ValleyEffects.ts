import type Phaser from 'phaser';
import { VALLEY_ART_KEYS, WATER_TILES } from '../art/ValleyArt';
import { groundDepth } from '../art/ArtCatalog';
import { WORLD_SIZE } from '../gameplay/WorldRegions';
import { VALLEY_BRIDGE, VALLEY_POND, riverX } from './ValleyLayout';
import { RIVER_WATER_POLYGON } from './ValleyScenery';
import { ValleyAtmosphere } from './ValleyAtmosphere';

type AmbientState = ReturnType<ValleyAtmosphere['advance']>;
export function bindValleyAtmosphere(scene: Phaser.Scene, paint: (state: AmbientState) => void, cleanup: () => void = () => {}, reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches): void {
  const clock = new ValleyAtmosphere(reducedMotion); const update = (_time: number, delta: number) => paint(clock.advance(delta));
  let disposed = false;
  const dispose = () => {
    if (disposed) return; disposed = true;
    scene.events.off('update', update); scene.events.off('shutdown', dispose); scene.events.off('destroy', dispose); cleanup();
  };
  scene.events.on('update', update); scene.events.once('shutdown', dispose); scene.events.once('destroy', dispose); paint(clock.advance(0));
}

/** Only four small tile surfaces are animated. Masks and banks are built once per scene. */
export function addValleyWater(scene: Phaser.Scene): boolean {
  if (!WATER_TILES.every((key) => scene.textures.exists(key))) return false;
  const surfaces: { base: Phaser.GameObjects.TileSprite; blend: Phaser.GameObjects.TileSprite; speed: number; mask: Phaser.Display.Masks.GeometryMask; shape: Phaser.GameObjects.Graphics }[] = [];
  const addSurface = (x: number, y: number, width: number, height: number, speed: number, draw: (shape: Phaser.GameObjects.Graphics) => void) => {
    const shape = scene.make.graphics({}, false); draw(shape); const mask = shape.createGeometryMask();
    const base = scene.add.tileSprite(x, y, width, height, WATER_TILES[0]).setOrigin(0).setDepth(.14).setTileScale(.65).setMask(mask);
    const blend = scene.add.tileSprite(x, y, width, height, WATER_TILES[1]).setOrigin(0).setDepth(.15).setTileScale(.65).setMask(mask);
    surfaces.push({ base, blend, speed, mask, shape });
  };
  addSurface(70, 0, 500, WORLD_SIZE.height, 1, (shape) => shape.fillStyle(0xffffff).fillPoints([...RIVER_WATER_POLYGON], true));
  const pond = VALLEY_POND;
  addSurface(pond.x - pond.width / 2, pond.y - pond.height / 2, pond.width, pond.height, .22, (shape) => shape.fillStyle(0xffffff).fillEllipse(pond.x, pond.y, pond.width - 4, pond.height - 4));
  const foam: { image: Phaser.GameObjects.Ellipse; y: number; offset: number }[] = [];
  const cascades = scene.textures.exists(VALLEY_ART_KEYS.foam) ? [235, 428].map((y) => scene.add.image(riverX(y), y + 3, VALLEY_ART_KEYS.foam, 'foam-0').setDisplaySize(64, 64).setAlpha(.8).setDepth(.2)) : [];
  for (let i = 0; i < 13; i++) {
    const y = 110 + i * 70;
    if (Math.abs(y - VALLEY_BRIDGE.y) < VALLEY_BRIDGE.height / 2 + 25) continue;
    const image = scene.add.ellipse(riverX(y), y, i % 2 ? 15 : 22, 3, 0xecffe5, .3).setDepth(.19);
    foam.push({ image, y, offset: i * .17 });
  }
  let frame = -1; let foamFrame = -1;
  bindValleyAtmosphere(scene, (state) => {
    for (const surface of surfaces) {
      if (frame !== state.frame) { surface.base.setTexture(WATER_TILES[state.frame]); surface.blend.setTexture(WATER_TILES[state.nextFrame]); }
      surface.blend.setAlpha(state.blend);
      for (const tile of [surface.base, surface.blend]) { tile.tilePositionY = -(state.flow * surface.speed % 256); tile.tilePositionX = state.flow * surface.speed * .12 % 256; }
    }
    frame = state.frame;
    if (foamFrame !== state.foamFrame) { for (const cascade of cascades) cascade.setFrame(`foam-${state.foamFrame}`); foamFrame = state.foamFrame; }
    for (const ripple of foam) {
      const phase = (state.flow * .035 + ripple.offset) % 1; const y = ripple.y + phase * 14;
      ripple.image.setPosition(riverX(y), y).setAlpha(Math.sin(phase * Math.PI) * .32);
    }
  }, () => {
    for (const surface of surfaces) { surface.base.clearMask(); surface.blend.clearMask(); surface.mask.destroy(); surface.shape.destroy(); }
  });
  return true;
}

/** Positions measured against the generated academy frame; the existing building collider stays separate. */
export function addAcademyLights(scene: Phaser.Scene, building: Phaser.GameObjects.Image): void {
  if (!scene.textures.exists(VALLEY_ART_KEYS.glow)) return;
  const left = building.x - building.displayWidth / 2; const top = building.y - building.displayHeight;
  const lights = [[.5, .335, .23, .32], [.205, .69, .18, .26], [.79, .69, .18, .26]].map(([x, y, width, height]) =>
    scene.add.image(left + x * building.displayWidth, top + y * building.displayHeight, VALLEY_ART_KEYS.glow)
      .setDisplaySize(width * building.displayWidth, height * building.displayHeight).setBlendMode('ADD').setDepth(groundDepth(building.y) + .1));
  bindValleyAtmosphere(scene, (state) => lights.forEach((light, index) => light.setAlpha(state.light * (index === 0 ? 1 : .85))));
}

export function addValleySunlight(scene: Phaser.Scene): void {
  if (!scene.textures.exists(VALLEY_ART_KEYS.glow)) return;
  for (let i = 0; i < 3; i++) scene.add.image(370 + i * 115, 300 + i * 65, VALLEY_ART_KEYS.glow)
    .setDisplaySize(120, 700).setRotation(-.65).setBlendMode('ADD').setAlpha(.11).setDepth(.24);
}
