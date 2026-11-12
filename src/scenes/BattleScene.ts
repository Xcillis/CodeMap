import Phaser from 'phaser';
import { BattleEngine } from '../combat/BattleEngine';
import { CONDITION_PROGRAM, DEFAULT_PROGRAM, compileActionPlan } from '../combat/DecisionProgram';
import type { BattleState, CombatAction, Combatant, ProgramStep } from '../combat/types';
import { gameEvents } from '../game/events';

const TILE = 72;
const GRID_START_X = 110;
const GRID_START_Y = 130;

export class BattleScene extends Phaser.Scene {
  private readonly battle = new BattleEngine();
  private grid!: Phaser.GameObjects.Graphics;
  private actors!: Phaser.GameObjects.Container;
  private heading!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private activeSource = '';
  private actionPlan: ProgramStep[] = [];
  private nextActionIndex = 0;
  private mission: 1 | 2 = 1;
  private readonly onStep = (source: string) => this.step(source);
  private readonly onRunProgram = (source: string) => this.runProgram(source);
  private readonly onRestart = () => this.restart();
  private readonly onNextMission = () => this.startMission(2);
  private readonly onExit = () => this.exit();

  constructor() {
    super('battle');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#142c35');
    this.grid = this.add.graphics();
    this.actors = this.add.container();
    this.heading = this.add.text(GRID_START_X, 52, '', { fontFamily: 'Georgia, serif', fontSize: '30px', color: '#fff0bd' });
    this.subtitle = this.add.text(GRID_START_X, 88, '', { fontSize: '16px', color: '#b8d8cf' });
    gameEvents.on('battle-step', this.onStep);
    gameEvents.on('battle-run-program', this.onRunProgram);
    gameEvents.on('battle-restart', this.onRestart);
    gameEvents.on('battle-next-mission', this.onNextMission);
    gameEvents.on('battle-exit', this.onExit);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeListeners());
    this.startMission(1);
  }

  private startMission(mission: 1 | 2): void {
    this.mission = mission;
    this.battle.reset();
    this.activeSource = '';
    this.actionPlan = [];
    this.nextActionIndex = 0;
    this.heading.setText(mission === 1 ? 'Trainingsarena: Die erste Schleife' : 'Trainingsarena: Nähe prüfen');
    this.subtitle.setText(mission === 1
      ? 'Moosling folgt deinem Aktionsplan. Das Konstrukt bleibt passiv.'
      : 'Das Konstrukt bewegt sich. Reagiere mit einer Bedingung auf seine Nähe.');
    this.render(this.battle.snapshot);
    gameEvents.emit('battle-opened', mission === 1 ? DEFAULT_PROGRAM : CONDITION_PROGRAM, mission);
    gameEvents.emit('battle-updated', this.battle.snapshot, mission === 1
      ? 'Führe die Schleife Schritt für Schritt aus und beobachte die Wiederholung.'
      : 'Das Konstrukt bewegt sich nun. Prüfe bei jedem Schritt, ob es neben Moosling steht.');
    gameEvents.emit('battle-next-available', false);
  }

  private step(source: string): void {
    if (!this.preparePlan(source)) return;
    const step = this.actionPlan[this.nextActionIndex];
    if (!step) {
      gameEvents.emit('battle-updated', this.battle.snapshot, 'Aktionsplan beendet. Ergänze den Plan oder starte neu.');
      return;
    }
    this.nextActionIndex += 1;
    const action = this.resolveStep(step);
    const state = this.battle.runStep(action, this.mission === 2);
    this.render(state);
    const readableAction = action === 'MOVE_TOWARD' ? 'moveToward()' : 'attack()';
    gameEvents.emit('battle-updated', state, state.outcome === 'victory' ? this.victoryMessage() : `Schritt ${this.nextActionIndex}/${this.actionPlan.length}: ${readableAction}`);
  }

  private runProgram(source: string): void {
    if (!this.preparePlan(source, true)) return;
    this.battle.reset();
    const totalSteps = this.actionPlan.length;
    while (this.nextActionIndex < this.actionPlan.length && this.battle.snapshot.outcome === 'ongoing') {
      this.battle.runStep(this.resolveStep(this.actionPlan[this.nextActionIndex]), this.mission === 2);
      this.nextActionIndex += 1;
    }
    const state = this.battle.snapshot;
    this.render(state);
    gameEvents.emit('battle-updated', state, state.outcome === 'victory' ? this.victoryMessage() : `Programm ausgeführt: ${totalSteps} Schritte ausgeführt.`);
  }

  private restart(): void {
    this.battle.reset();
    this.activeSource = '';
    this.actionPlan = [];
    this.nextActionIndex = 0;
    this.render(this.battle.snapshot);
    gameEvents.emit('battle-updated', this.battle.snapshot, 'Arena zurückgesetzt.');
  }

  private preparePlan(source: string, restartPlan = false): boolean {
    if (source === this.activeSource && !restartPlan) return true;
    const compiled = compileActionPlan(source);
    if (!compiled.steps) {
      gameEvents.emit('battle-updated', this.battle.snapshot, compiled.error);
      return false;
    }
    this.activeSource = source;
    this.actionPlan = compiled.steps;
    this.nextActionIndex = 0;
    return true;
  }

  private resolveStep(step: ProgramStep): CombatAction {
    if (step.kind === 'action') return step.action;
    const { player, enemy } = this.battle.snapshot;
    const adjacent = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y) === 1;
    return adjacent ? step.whenTrue : step.whenFalse;
  }

  private victoryMessage(): string {
    if (this.mission === 1) {
      gameEvents.emit('battle-next-available', true);
      return 'Sieg! Die nächste Mission führt Bedingungen ein.';
    }
    return 'Sieg! Moosling hat bei jedem Schritt passend auf die Nähe reagiert.';
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
    gameEvents.off('battle-run-program', this.onRunProgram);
    gameEvents.off('battle-restart', this.onRestart);
    gameEvents.off('battle-next-mission', this.onNextMission);
    gameEvents.off('battle-exit', this.onExit);
  }
}
