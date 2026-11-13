import Phaser from 'phaser';
import { BattleSession, missionPrograms, type MissionId } from '../combat/BattleSession';
import type { ActionFrame, BattleState, Combatant, ProgramSources } from '../combat/types';
import { Playback } from '../combat/Playback';
import { gameEvents } from '../game/events';

const TILE = 72;
const GRID_START_X = 110;
const GRID_START_Y = 130;

export class BattleScene extends Phaser.Scene {
  private session = new BattleSession(1);
  private grid!: Phaser.GameObjects.Graphics;
  private actors!: Phaser.GameObjects.Container;
  private effects!: Phaser.GameObjects.Container;
  private visuals = new Map<Combatant['id'], { root: Phaser.GameObjects.Container; marker: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text }>();
  private currentFrame?: ActionFrame;
  private playback = new Playback<ActionFrame>(
    (frame, duration) => this.animateFrame(frame, duration),
    (state) => {
      gameEvents.emit('battle-playback', state);
      if (state === 'paused' && this.currentFrame) this.render(this.currentFrame.after);
    },
  );
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
  private readonly onPause = () => this.playback.state === 'paused' ? this.playback.resume() : this.playback.pause();
  private readonly onSpeed = (speed: number) => this.playback.setSpeed(speed);
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
    this.effects = this.add.container().setDepth(20);
    this.heading = this.add.text(GRID_START_X, 52, '', { fontFamily: 'Georgia, serif', fontSize: '30px', color: '#fff0bd' });
    this.subtitle = this.add.text(GRID_START_X, 88, '', { fontSize: '16px', color: '#b8d8cf' });
    gameEvents.on('battle-step', this.onStep);
    gameEvents.on('battle-run-program', this.onRunProgram);
    gameEvents.on('battle-restart', this.onRestart);
    gameEvents.on('battle-next-mission', this.onNextMission);
    gameEvents.on('battle-exit', this.onExit);
    gameEvents.on('battle-viewport', this.onViewport);
    gameEvents.on('battle-pause', this.onPause);
    gameEvents.on('battle-speed', this.onSpeed);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeListeners());
    this.startMission(1);
  }

  private startMission(mission: MissionId): void {
    this.playback.stop(); this.currentFrame = undefined; gameEvents.emit('battle-trace-clear');
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
    if (this.playback.state === 'paused' && !full) { this.playback.step(); return; }
    if (this.playback.state !== 'idle') return;
    gameEvents.emit('battle-trace-clear');
    const feedback = this.session.execute(sources, full);
    const finalState = this.session.snapshot;
    gameEvents.emit('battle-next-available', false);
    this.playback.play([...this.session.frames], () => {
      this.render(finalState);
      gameEvents.emit('battle-updated', finalState, feedback);
      gameEvents.emit('battle-next-available', finalState.outcome === 'victory' && this.mission < 3);
    });
  }

  private restart(): void {
    this.playback.stop(); this.currentFrame = undefined; gameEvents.emit('battle-trace-clear');
    this.session.reset();
    this.render(this.session.snapshot);
    gameEvents.emit('battle-updated', this.session.snapshot, 'Arena zurückgesetzt. Programme bleiben erhalten.');
    gameEvents.emit('battle-next-available', false);
  }

  private exit(): void {
    this.playback.stop(); this.currentFrame = undefined; gameEvents.emit('battle-trace-clear');
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
    this.tweens.killAll();
    this.effects.removeAll(true);
    const ids = [state.player.id, state.enemy.id, ...(state.companion ? [state.companion.id] : [])];
    for (const [id, visual] of this.visuals) if (!ids.includes(id)) { visual.root.destroy(); this.visuals.delete(id); }
    this.drawActor(state.player, 0x63b76b, '#e8ffe4');
    if (state.companion) this.drawActor(state.companion, 0xf29b4b, '#fff0d8');
    this.drawActor(state.enemy, 0xc95e58, '#ffe8db');
  }

  private drawActor(actor: Combatant, color: number, textColor: string): void {
    const x = GRID_START_X + actor.x * TILE + TILE / 2;
    const y = GRID_START_Y + actor.y * TILE + TILE / 2;
    let visual = this.visuals.get(actor.id);
    if (!visual || !visual.root.scene) {
      const marker = this.add.circle(0, 0, 24, color).setStrokeStyle(2, 0xffffff);
      if (actor.id !== 'konstrukt') marker.setInteractive({ useHandCursor: true }).on('pointerdown', () => gameEvents.emit('arkan-selected', actor.id));
      const label = this.add.text(0, -42, '', { fontFamily: 'Georgia, serif', fontSize: '13px', align: 'center', color: textColor, stroke: '#142c35', strokeThickness: 3 }).setOrigin(0.5);
      const root = this.add.container(x, y, [marker, label]); this.actors.add(root);
      visual = { root, marker, label }; this.visuals.set(actor.id, visual);
    }
    visual.root.setPosition(x, y).setScale(1).setAlpha(actor.hp > 0 ? 1 : .3);
    visual.marker.setAlpha(1).setStrokeStyle(2, 0xffffff);
    visual.label.setText(`${actor.name}\n${actor.hp}/${actor.maxHp}`);
  }

  private animateFrame(frame: ActionFrame, duration: number): void {
    this.currentFrame = frame;
    this.render(frame.before);
    gameEvents.emit('battle-frame', frame);
    const units = (state: BattleState) => [state.player, state.companion, state.enemy].filter((actor): actor is Combatant => Boolean(actor));
    const before = units(frame.before).find((actor) => actor.id === frame.actor)!;
    const after = units(frame.after).find((actor) => actor.id === frame.actor)!;
    const visual = this.visuals.get(frame.actor)!;
    visual.marker.setStrokeStyle(5, 0xffdf6d);
    const moved = before.x !== after.x || before.y !== after.y;
    let explanation = '';
    if (moved) {
      this.tweens.add({ targets: visual.root, x: GRID_START_X + after.x * TILE + TILE / 2, y: GRID_START_Y + after.y * TILE + TILE / 2, duration: duration * .6, ease: 'Sine.easeInOut' });
      explanation = 'geht ein Feld vorwärts';
    } else if (frame.action === 'ATTACK') {
      const target = units(frame.after).find((actor) => actor.id !== frame.actor && actor.hp < (units(frame.before).find((old) => old.id === actor.id)?.hp ?? actor.hp));
      if (target) {
        const victim = this.visuals.get(target.id)!;
        victim.label.setText(`${target.name}\n${target.hp}/${target.maxHp}`);
        this.tweens.add({ targets: visual.root, x: visual.root.x + Math.sign(victim.root.x - visual.root.x) * 15, y: visual.root.y + Math.sign(victim.root.y - visual.root.y) * 15, duration: duration * .16, yoyo: true });
        this.tweens.add({ targets: victim.marker, alpha: .25, duration: duration * .12, repeat: 2, yoyo: true });
        const text = this.add.text(victim.root.x, victim.root.y - 20, '−1', { fontSize: '24px', color: '#ffe3a6', stroke: '#142c35', strokeThickness: 4 }).setOrigin(.5);
        this.effects.add(text); this.tweens.add({ targets: text, y: text.y - 40, alpha: 0, duration: duration * .7 });
        explanation = `trifft ${target.name} für 1 Schaden`;
      } else explanation = 'kann nicht angreifen: Gegner außer Reichweite';
    } else {
      const reason = frame.after.log.at(-1);
      explanation = reason?.includes('blockiert') ? reason : 'hält die Position: Gegner bereits benachbart';
      this.tweens.add({ targets: visual.root, x: visual.root.x + 5, duration: duration * .1, yoyo: true, repeat: 1 });
    }
    gameEvents.emit('battle-updated', frame.after, `${before.name}: ${explanation}.`);
  }

  private removeListeners(): void {
    this.playback.stop(); this.tweens.killAll(); this.visuals.clear();
    gameEvents.off('battle-step', this.onStep);
    gameEvents.off('battle-run-program', this.onRunProgram);
    gameEvents.off('battle-restart', this.onRestart);
    gameEvents.off('battle-next-mission', this.onNextMission);
    gameEvents.off('battle-exit', this.onExit);
    gameEvents.off('battle-viewport', this.onViewport);
    gameEvents.off('battle-pause', this.onPause);
    gameEvents.off('battle-speed', this.onSpeed);
  }
}
