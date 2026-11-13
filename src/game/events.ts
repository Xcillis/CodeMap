import Phaser from 'phaser';
import type { CampaignDialog } from '../gameplay/WorldQuests';

export type DialogPayload = CampaignDialog;

export const gameEvents = new Phaser.Events.EventEmitter();
