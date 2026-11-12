import Phaser from 'phaser';
import { BattleSession, missionPrograms, type MissionId } from '../combat/BattleSession';
import type { BattleState, Combatant, ProgramSources } from '../combat/types';
import { gameEvents } from '../game/events';

const TILE = 72;
const GRID_START_X = 110;
const GRID_START_Y = 130;

export class BattleScene extends Phaser.Scene {
  private session = new BattleSession(1);
  private grid!: Phaser.GameObjects.Graphics;
  private actors!: Phaser.GameObjects.Container;
  private heading!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private mission: 1 | 2 | 3 = 1;
  private readonly onStep = (sources: ProgramSources) => this.execute(sources);
  private readonly onRunProgram = (sources: ProgramSources) => this.execute(sources, true);
  private readonly onRestart = () => this.restart();
  private readonly onNextMission = () => {
    if (this.session.snapshot.outcome === 'victory' && this.mission < 3) this.startMission(this.mission === 1 ? 2 : 3);
  };
  private readonly onExit = () => this.exit();
  private readonly onViewport = ({ width, height }: { width: number; height: number }) => {
    const camera = this.cameras.main;
    camera.setViewport(0, 0, width, height);
    camera.setZoom(Math.min(width / 800, height / 700, 1.4));
    camera.centerOn(400, 350);
  };

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
    gameEvents.on('battle-viewport', this.onViewport);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeListeners());
    this.startMission(1);
  }

  private startMission(mission: MissionId): void {
    this.mission = mission;
    this.session = new BattleSession(mission);
    this.heading.setText(mission === 1 ? 'Trainingsarena: Die erste Schleife' : mission === 2 ? 'Trainingsarena: Nähe prüfen' : 'Trainingsarena: Duo-Formation');
    this.subtitle.setText(mission === 1
      ? 'Moosling folgt deinem Aktionsplan. Das Konstrukt bleibt passiv.'
      : mission === 2 ? 'Das Konstrukt bewegt sich. Reagiere mit einer Bedingung auf seine Nähe.' : 'Moosling und Glutling folgen ihren eigenen Programmen.');
    this.render(this.session.snapshot);
    gameEvents.emit('battle-opened', missionPrograms(mission), mission);
    gameEvents.emit('battle-updated', this.session.snapshot, mission === 1
      ? 'Führe die Schleife Schritt für Schritt aus und beobachte die Wiederholung.'
      : mission === 2 ? 'Das Konstrukt bewegt sich nun. Prüfe bei jedem Schritt, ob es neben Moosling steht.' : 'Wähle einen Arkan zum Programmieren. Pro Tick handelt zuerst Moosling, dann Glutling.');
    gameEvents.emit('battle-next-available', false);
  }

  private execute(sources: ProgramSources, full = false): void {
    const feedback = this.session.execute(sources, full);
    const state = this.session.snapshot;
    this.render(state);
    gameEvents.emit('battle-updated', state, feedback);
    gameEvents.emit('battle-next-available', state.outcome === 'victory' && this.mission < 3);
  }

  private restart(): void {
    this.session.reset();
    this.render(this.session.snapshot);
    gameEvents.emit('battle-updated', this.session.snapshot, 'Arena zurückgesetzt. Programme bleiben erhalten.');
    gameEvents.emit('battle-next-available', false);
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
    if (state.companion) this.drawActor(state.companion, 0xf29b4b, '#fff0d8');
    this.drawActor(state.enemy, 0xc95e58, '#ffe8db');
  }

  private drawActor(actor: Combatant, color: number, textColor: string): void {
    const x = GRID_START_X + actor.x * TILE + TILE / 2;
    const y = GRID_START_Y + actor.y * TILE + TILE / 2;
    const marker = this.add.circle(x, y, 24, color).setStrokeStyle(actor.guarding ? 5 : 2, actor.guarding ? 0xf8e47c : 0xffffff);
    if (actor.id !== 'konstrukt') marker.setInteractive({ useHandCursor: true }).on('pointerdown', () => gameEvents.emit('arkan-selected', actor.id));
    const label = this.add.text(x, y - 42, `${actor.name}\n${actor.hp}/${actor.maxHp}`, { fontFamily: 'Georgia, serif', fontSize: '13px', align: 'center', color: textColor, stroke: '#142c35', strokeThickness: 3 }).setOrigin(0.5);
    this.actors.add([marker, label]);
  }

  private removeListeners(): void {
    gameEvents.off('battle-step', this.onStep);
    gameEvents.off('battle-run-program', this.onRunProgram);
    gameEvents.off('battle-restart', this.onRestart);
    gameEvents.off('battle-next-mission', this.onNextMission);
    gameEvents.off('battle-exit', this.onExit);
    gameEvents.off('battle-viewport', this.onViewport);
  }
}
