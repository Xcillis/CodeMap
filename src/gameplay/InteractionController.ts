export interface InteractionTarget {
  id: string;
  label: string;
  x: number;
  y: number;
  range: number;
}

export class InteractionController {
  constructor(private targets: readonly InteractionTarget[]) {}

  removeTarget(id: string): void {
    this.targets = this.targets.filter((target) => target.id !== id);
  }

  nearestTo(x: number, y: number): InteractionTarget | undefined {
    return this.targets
      .map((target) => ({ target, distance: Math.hypot(x - target.x, y - target.y) }))
      .filter(({ target, distance }) => distance <= target.range)
      .sort((left, right) => left.distance - right.distance)[0]?.target;
  }
}
