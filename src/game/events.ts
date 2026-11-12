import Phaser from 'phaser';

export interface DialogPayload {
  speaker: string;
  text: string;
}

export const gameEvents = new Phaser.Events.EventEmitter();
