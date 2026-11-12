import Phaser from 'phaser';
import { touchInput } from '../input/TouchInput';

const SPEED = 220;

export class PlayerController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private readonly interactKeys: Phaser.Input.Keyboard.Key[];

  constructor(private readonly scene: Phaser.Scene, private readonly sprite: Phaser.GameObjects.Arc) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Eine Tastatur-Eingabequelle wird benötigt.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)];
  }

  update(canMove: boolean): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!canMove) {
      body.setVelocity(0, 0);
      return this.interactionPressed();
    }

    const horizontal = Number(this.isDown('right')) - Number(this.isDown('left'));
    const vertical = Number(this.isDown('down')) - Number(this.isDown('up'));
    const direction = new Phaser.Math.Vector2(horizontal, vertical).normalize().scale(SPEED);
    body.setVelocity(direction.x, direction.y);
    return this.interactionPressed();
  }

  private isDown(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    return this.cursors[direction].isDown || this.wasd[direction].isDown || touchInput.isHeld(direction);
  }

  private interactionPressed(): boolean {
    return this.interactKeys.some((key) => Phaser.Input.Keyboard.JustDown(key)) || touchInput.consumeInteraction();
  }
}
