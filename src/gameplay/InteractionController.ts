export interface InteractionTarget {
  id: string;
  label: string;
  x: number;
  y: number;
  range: number;
}

export class InteractionController {
  constructor(private targets: readonly InteractionTarget[]) {}
  setTargets(targets: readonly InteractionTarget[]): void { this.targets = targets; }
  moveTarget(id: string, x: number, y: number): void {
    const target = this.targets.find((item) => item.id === id);
    if (target) { target.x = x; target.y = y; }
  }

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
