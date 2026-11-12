export type TouchDirection = 'up' | 'down' | 'left' | 'right';

export class TouchInput {
  private readonly heldDirections = new Set<TouchDirection>();
  private interactRequested = false;

  setDirection(direction: TouchDirection, pressed: boolean): void {
    if (pressed) {
      this.heldDirections.add(direction);
    } else {
      this.heldDirections.delete(direction);
    }
  }

  isHeld(direction: TouchDirection): boolean {
    return this.heldDirections.has(direction);
  }

  requestInteraction(): void {
    this.interactRequested = true;
  }

  consumeInteraction(): boolean {
    const requested = this.interactRequested;
    this.interactRequested = false;
    return requested;
  }
}

export const touchInput = new TouchInput();
