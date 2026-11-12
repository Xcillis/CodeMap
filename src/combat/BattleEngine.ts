import type { ArkanId, BattleState, CombatAction, Combatant, GridPosition, ProgramStep } from './types';

const GRID_SIZE = 7;

export class BattleEngine {
  private state: BattleState;

  constructor(private readonly spawns?: Partial<Record<ArkanId | 'konstrukt', GridPosition>>) {
    this.state = this.initialState();
  }

  get snapshot(): Readonly<BattleState> {
    return structuredClone(this.state);
  }

  reset(withCompanion = false, enemyHp = 3): void {
    this.state = this.initialState(withCompanion, enemyHp);
  }

  runStep(playerAction: CombatAction, enemyActive = false): Readonly<BattleState> {
    return this.runTick({ moosling: { kind: 'action', action: playerAction } }, enemyActive);
  }

  runTick(programs: Partial<Record<ArkanId, ProgramStep>>, enemyActive = false): Readonly<BattleState> {
    if (this.state.outcome !== 'ongoing') return this.snapshot;
    this.state.tick += 1;
    for (const actor of [this.state.player, this.state.companion]) {
      if (!actor || actor.hp === 0 || this.state.outcome !== 'ongoing') continue;
      const step = programs[actor.id as ArkanId];
      if (!step) {
        this.addLog(`${actor.name}: Programm beendet, wartet.`);
        continue;
      }
      const adjacent = this.areAdjacent(actor, this.state.enemy);
      const action = step.kind === 'action' ? step.action : adjacent ? step.whenTrue : step.whenFalse;
      this.addLog(`${actor.id}.${action === 'ATTACK' ? 'attack()' : 'moveForward()'}${step.kind === 'condition' ? ` – enemyAdjacent = ${adjacent}` : ''}`);
      this.act(actor, this.state.enemy, action);
    }
    if (enemyActive && this.state.outcome === 'ongoing') {
      const enemyAction = this.areAdjacent(this.state.enemy, this.state.player) ? 'ATTACK' : 'MOVE_TOWARD';
      this.act(this.state.enemy, this.state.player, enemyAction);
    }
    return this.snapshot;
  }

  private initialState(withCompanion = false, enemyHp = 3): BattleState {
    const state: BattleState = {
      tick: 0,
      outcome: 'ongoing',
      player: { id: 'moosling', name: 'Moosling', hp: 5, maxHp: 5, x: 1, y: 3, guarding: false },
      companion: withCompanion ? { id: 'glutling', name: 'Glutling', hp: 4, maxHp: 4, x: 1, y: 2, guarding: false } : undefined,
      enemy: { id: 'konstrukt', name: 'Übungskonstrukt', hp: enemyHp, maxHp: enemyHp, x: 5, y: 3, guarding: false },
      log: ['Trainingsarena bereit. Das Konstrukt beobachtet deinen Aktionsplan.'],
    };
    for (const actor of [state.player, state.companion, state.enemy]) {
      if (actor && this.spawns?.[actor.id]) Object.assign(actor, this.spawns[actor.id]);
    }
    return state;
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
    let nextX = actor.x;
    let nextY = actor.y;
    if (Math.abs(horizontalDistance) >= Math.abs(verticalDistance) && horizontalDistance !== 0) {
      nextX += Math.sign(horizontalDistance);
    } else if (verticalDistance !== 0) {
      nextY += Math.sign(verticalDistance);
    }
    const occupant = [this.state.player, this.state.companion, this.state.enemy].find((unit) => unit && unit.id !== actor.id && unit.x === nextX && unit.y === nextY);
    if (occupant || nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
      this.addLog(`${actor.name}: Bewegung blockiert${occupant ? ` – Feld von ${occupant.name} belegt` : ' – Kartenrand'}.`);
      return;
    }
    actor.x = nextX;
    actor.y = nextY;
    this.addLog(`${actor.name} bewegt sich vor.`);
  }

  private areAdjacent(first: Combatant, second: Combatant): boolean {
    return Math.abs(first.x - second.x) + Math.abs(first.y - second.y) === 1;
  }

  private addLog(entry: string): void {
    this.state.log = [...this.state.log.slice(-79), entry];
  }
}
