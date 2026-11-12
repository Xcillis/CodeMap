import Phaser from 'phaser';

export interface DialogPayload {
  speaker: string;
  text: string;
  action?: 'start-battle';
}

export const gameEvents = new Phaser.Events.EventEmitter();
