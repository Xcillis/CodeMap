import type { BattleState, CombatAction, Combatant } from './types';

const GRID_SIZE = 7;

export class BattleEngine {
  private state: BattleState;

  constructor() {
    this.state = this.initialState();
  }

  get snapshot(): Readonly<BattleState> {
    return structuredClone(this.state);
  }

  reset(): void {
    this.state = this.initialState();
  }

  runStep(playerAction: CombatAction, enemyActive = false): Readonly<BattleState> {
    if (this.state.outcome !== 'ongoing') return this.snapshot;

    this.state.tick += 1;
    this.act(this.state.player, this.state.enemy, playerAction);
    if (enemyActive && this.state.outcome === 'ongoing') {
      const enemyAction = this.areAdjacent(this.state.enemy, this.state.player) ? 'ATTACK' : 'MOVE_TOWARD';
      this.act(this.state.enemy, this.state.player, enemyAction);
    }
    return this.snapshot;
  }

  private initialState(): BattleState {
    return {
      tick: 0,
      outcome: 'ongoing',
      player: { id: 'moosling', name: 'Moosling', hp: 5, maxHp: 5, x: 1, y: 3, guarding: false },
      enemy: { id: 'konstrukt', name: 'Übungskonstrukt', hp: 3, maxHp: 3, x: 5, y: 3, guarding: false },
      log: ['Trainingsarena bereit. Das Konstrukt beobachtet deinen Aktionsplan.'],
    };
  }

  private act(actor: Combatant, target: Combatant, action: CombatAction): void {
    actor.guarding = false;
    switch (action) {
      case 'ATTACK':
        this.attack(actor, target);
        break;
      case 'MOVE_TOWARD':
        this.moveToward(actor, target);
        break;
    }
  }

  private attack(actor: Combatant, target: Combatant): void {
    if (!this.areAdjacent(actor, target)) {
      this.addLog(`${actor.name} ist noch außer Reichweite.`);
      return;
    }
    const damage = target.guarding ? 0 : 1;
    target.hp = Math.max(0, target.hp - damage);
    this.addLog(damage === 0 ? `${target.name} blockt den Angriff.` : `${actor.name} trifft ${target.name} für ${damage} Schaden.`);
    if (target.hp === 0) {
      this.state.outcome = target.id === 'konstrukt' ? 'victory' : 'defeat';
      this.addLog(this.state.outcome === 'victory' ? 'Sieg! Die Trainingsquest ist bestanden.' : 'Niederlage. Du kannst sofort neu starten.');
    }
  }

  private moveToward(actor: Combatant, target: Combatant): void {
    if (this.areAdjacent(actor, target)) {
      this.addLog(`${actor.name} hält die Position.`);
      return;
    }
    const horizontalDistance = target.x - actor.x;
    const verticalDistance = target.y - actor.y;
    if (Math.abs(horizontalDistance) >= Math.abs(verticalDistance) && horizontalDistance !== 0) {
      actor.x += Math.sign(horizontalDistance);
    } else if (verticalDistance !== 0) {
      actor.y += Math.sign(verticalDistance);
    }
    actor.x = Math.min(GRID_SIZE - 1, Math.max(0, actor.x));
    actor.y = Math.min(GRID_SIZE - 1, Math.max(0, actor.y));
    this.addLog(`${actor.name} bewegt sich vor.`);
  }

  private areAdjacent(first: Combatant, second: Combatant): boolean {
    return Math.abs(first.x - second.x) + Math.abs(first.y - second.y) === 1;
  }

  private addLog(entry: string): void {
    this.state.log = [...this.state.log.slice(-5), entry];
  }
}
