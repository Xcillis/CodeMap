import type { ActionFrame, ArkanId, BattleState, CombatAction, Combatant, GridPosition, ProgramStep } from './types';
import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';
import { ACTIONS, directionDelta } from './ActionCatalog';

const GRID_SIZE = 7;

export class BattleEngine {
  private state: BattleState;

  constructor(private readonly spawns?: Partial<Record<ArkanId | 'konstrukt', GridPosition>>) {
    this.state = this.initialState();
  }

  get snapshot(): Readonly<BattleState> {
    return structuredClone(this.state);
  }

  reset(withCompanion = false, enemyHp = 3, team?: readonly ArkanId[]): void {
    this.state = this.initialState(withCompanion, enemyHp, team);
  }

  runStep(playerAction: CombatAction, enemyActive = false): Readonly<BattleState> {
    return this.runTick({ [this.state.player.id]: { kind: 'action', action: playerAction } }, enemyActive);
  }

  runTick(programs: Partial<Record<ArkanId, ProgramStep | ((adjacent: boolean) => ProgramStep | undefined)>>, enemyActive = false, onAction?: (frame: ActionFrame) => void): Readonly<BattleState> {
    if (this.state.outcome !== 'ongoing') return this.snapshot;
    let acted = false;
    for (const actor of [this.state.player, this.state.companion]) {
      if (!actor || actor.hp === 0 || this.state.outcome !== 'ongoing') continue;
      const entry = programs[actor.id as ArkanId];
      const step = typeof entry === 'function' ? entry(this.areAdjacent(actor, this.state.enemy)) : entry;
      if (!step) {
        this.addLog(`${actor.name}: Programm beendet, wartet.`);
        continue;
      }
      if (!acted) this.state.tick += 1;
      acted = true;
      const adjacent = this.areAdjacent(actor, this.state.enemy);
      const action = step.kind === 'action' ? step.action : adjacent ? step.whenTrue : step.whenFalse;
      const before = this.snapshot;
      this.addLog(`${actor.id}.${ACTIONS[action].method}()${step.kind === 'condition' ? ` – enemyAdjacent = ${adjacent}` : ''}`);
      this.act(actor, this.state.enemy, action);
      onAction?.({ actor: actor.id, action, before, after: this.snapshot });
    }
    if (acted && enemyActive && this.state.outcome === 'ongoing') {
      const enemyAction = this.areAdjacent(this.state.enemy, this.state.player) ? 'ATTACK' : 'MOVE_TOWARD';
      const before = this.snapshot;
      this.act(this.state.enemy, this.state.player, enemyAction);
      onAction?.({ actor: 'konstrukt', action: enemyAction, before, after: this.snapshot });
    }
    return this.snapshot;
  }

  private initialState(withCompanion = false, enemyHp = 3, team?: readonly ArkanId[]): BattleState {
    const roster: readonly ArkanId[] = team ?? (withCompanion ? ['moosling', 'glutling'] : ['moosling']);
    if (!roster.length || roster.length > 2 || new Set(roster).size !== roster.length) throw new Error('Wähle ein Team aus ein oder zwei unterschiedlichen Arkanen.');
    const ally = (id: ArkanId, y: number): Combatant => {
      const species = ARKANA_SPECIES[id];
      return { id, name: species.name, hp: species.maxHp, maxHp: species.maxHp, attackPower: species.attack, x: 1, y, guarding: false };
    };
    const state: BattleState = {
      tick: 0,
      outcome: 'ongoing',
      player: ally(roster[0], 3),
      companion: roster[1] ? ally(roster[1], 2) : undefined,
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
    const delta = directionDelta(action);
    if (delta) { this.moveTo(actor, actor.x + delta.x, actor.y + delta.y); return; }
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
    const damage = target.guarding ? 0 : Math.min(target.hp, actor.attackPower ?? 1);
    target.hp = Math.max(0, target.hp - damage);
    this.addLog(damage === 0 ? `${target.name} blockt den Angriff.` : `${actor.name} trifft ${target.name} für ${damage} Schaden.`);
    if (target.hp === 0) {
      this.state.outcome = target.id === 'konstrukt' ? 'victory' : 'defeat';
      this.addLog(this.state.outcome === 'victory' ? 'Sieg! Das Konstrukt ist ausgeschaltet.' : 'Niederlage. Du kannst sofort neu starten.');
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
    this.moveTo(actor, nextX, nextY);
  }

  private moveTo(actor: Combatant, nextX: number, nextY: number): void {
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
