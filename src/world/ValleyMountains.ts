import type { Obstacle, Point } from './ValleyLayout';

export type MountainVariant = 'ridge' | 'bastion' | 'scree' | 'ledge' | 'crag' | 'shoulder';
export interface MountainArea extends Obstacle { readonly variant: MountainVariant }

/** Authored overlapping landforms: unequal footprints, no repeated fence spacing or runtime randomness. */
export const VALLEY_MOUNTAINS: readonly MountainArea[] = [
  { x: 35, y: 48, width: 210, height: 180, variant: 'crag' },
  { x: 330, y: 20, width: 420, height: 150, variant: 'ridge' },
  { x: 650, y: 46, width: 330, height: 180, variant: 'bastion' },
  { x: 930, y: 12, width: 300, height: 140, variant: 'scree' },
  { x: 1190, y: 46, width: 300, height: 178, variant: 'ledge' },
  { x: 1480, y: 65, width: 420, height: 220, variant: 'shoulder' },
  { x: -80, y: 255, width: 330, height: 245, variant: 'bastion' },
  { x: -90, y: 480, width: 314, height: 220, variant: 'crag' },
  { x: -80, y: 650, width: 328, height: 190, variant: 'ledge' },
  { x: -90, y: 849, width: 296, height: 225, variant: 'crag' },
  { x: 125, y: 1012, width: 330, height: 170, variant: 'scree' },
  { x: 400, y: 1020, width: 390, height: 190, variant: 'shoulder' },
  { x: 715, y: 1020, width: 330, height: 155, variant: 'ridge' },
  { x: 1000, y: 1012, width: 360, height: 210, variant: 'ledge' },
  { x: 1310, y: 990, width: 360, height: 250, variant: 'bastion' },
  { x: 1490, y: 280, width: 220, height: 220, variant: 'crag' },
  { x: 1490, y: 370, width: 210, height: 120, variant: 'scree' },
  { x: 1480, y: 690, width: 240, height: 160, variant: 'shoulder' },
  { x: 1580, y: 880, width: 460, height: 320, variant: 'bastion' },
];

/** Leave the transparent outer fringe walkable; the broad inner rock areas are solid. */
export const MOUNTAIN_BODIES: readonly Obstacle[] = VALLEY_MOUNTAINS.map((area) => ({ x: area.x, y: area.y + area.height * .04, width: area.width * .9, height: area.height * .84 }));
export const mountainContains = (point: Point): boolean => MOUNTAIN_BODIES.some((body) => Math.abs(point.x - body.x) < body.width / 2 && Math.abs(point.y - body.y) < body.height / 2);
