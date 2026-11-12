import Phaser from 'phaser';

export interface InteractionTarget {
  id: string;
  label: string;
  x: number;
  y: number;
  range: number;
}

export class InteractionController {
  constructor(private readonly targets: readonly InteractionTarget[]) {}

  nearestTo(x: number, y: number): InteractionTarget | undefined {
    return this.targets
      .map((target) => ({ target, distance: Phaser.Math.Distance.Between(x, y, target.x, target.y) }))
      .filter(({ target, distance }) => distance <= target.range)
      .sort((left, right) => left.distance - right.distance)[0]?.target;
  }
}
