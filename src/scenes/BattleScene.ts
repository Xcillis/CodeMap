import Phaser from 'phaser';
import { BattleEngine } from '../combat/BattleEngine';
import { DEFAULT_PROGRAM, chooseAction } from '../combat/DecisionProgram';
import type { BattleState, Combatant } from '../combat/types';
import { gameEvents } from '../game/events';

const TILE = 72;
const GRID_START_X = 110;
const GRID_START_Y = 130;

export class BattleScene extends Phaser.Scene {
  private readonly battle = new BattleEngine();
  private grid!: Phaser.GameObjects.Graphics;
  private actors!: Phaser.GameObjects.Container;
  private readonly onStep = (source: string) => this.step(source);
  private readonly onRestart = () => this.restart();
  private readonly onExit = () => this.exit();

  constructor() {
    super('battle');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#142c35');
    this.grid = this.add.graphics();
    this.actors = this.add.container();
    this.add.text(GRID_START_X, 52, 'Trainingsarena: Der erste Arkan', { fontFamily: 'Georgia, serif', fontSize: '30px', color: '#fff0bd' });
    this.add.text(GRID_START_X, 88, 'Moosling gegen ein Übungskonstrukt', { fontSize: '16px', color: '#b8d8cf' });
    gameEvents.on('battle-step', this.onStep);
    gameEvents.on('battle-restart', this.onRestart);
    gameEvents.on('battle-exit', this.onExit);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeListeners());
    this.render(this.battle.snapshot);
    gameEvents.emit('battle-opened', DEFAULT_PROGRAM);
    gameEvents.emit('battle-updated', this.battle.snapshot, 'Setze zuerst MOVE_TOWARD ein, bis Moosling neben dem Konstrukt steht.');
  }

  private step(source: string): void {
    const program = chooseAction(source, this.battle.snapshot);
    if (!program.action) {
      gameEvents.emit('battle-updated', this.battle.snapshot, program.error);
      return;
    }
    const state = this.battle.runRound(program.action);
    this.render(state);
    const feedback = state.outcome === 'victory' ? 'Sieg! Die Bedingung hat Moosling zum richtigen Zeitpunkt angreifen lassen.' : state.outcome === 'defeat' ? 'Niederlage – starte direkt neu.' : `Ausgeführt: ${program.action}`;
    gameEvents.emit('battle-updated', state, feedback);
  }

  private restart(): void {
    this.battle.reset();
    this.render(this.battle.snapshot);
    gameEvents.emit('battle-updated', this.battle.snapshot, 'Arena zurückgesetzt.');
  }

  private exit(): void {
    gameEvents.emit('battle-closed');
    this.scene.stop();
    this.scene.resume('world');
  }

  private render(state: Readonly<BattleState>): void {
    this.grid.clear();
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const tileColor = (x + y) % 2 === 0 ? 0x35585a : 0x2b4b4e;
        this.grid.fillStyle(tileColor).fillRect(GRID_START_X + x * TILE, GRID_START_Y + y * TILE, TILE - 3, TILE - 3);
      }
    }
    this.actors.removeAll(true);
    this.drawActor(state.player, 0x63b76b, '#e8ffe4');
    this.drawActor(state.enemy, 0xc95e58, '#ffe8db');
  }

  private drawActor(actor: Combatant, color: number, textColor: string): void {
    const x = GRID_START_X + actor.x * TILE + TILE / 2;
    const y = GRID_START_Y + actor.y * TILE + TILE / 2;
    const marker = this.add.circle(x, y, 24, color).setStrokeStyle(actor.guarding ? 5 : 2, actor.guarding ? 0xf8e47c : 0xffffff);
    const label = this.add.text(x, y - 42, `${actor.name}\n${actor.hp}/${actor.maxHp}`, { fontFamily: 'Georgia, serif', fontSize: '13px', align: 'center', color: textColor, stroke: '#142c35', strokeThickness: 3 }).setOrigin(0.5);
    this.actors.add([marker, label]);
  }

  private removeListeners(): void {
    gameEvents.off('battle-step', this.onStep);
    gameEvents.off('battle-restart', this.onRestart);
    gameEvents.off('battle-exit', this.onExit);
  }
}
