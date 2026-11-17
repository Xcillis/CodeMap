import type { ActionFrame, ArkanId, BattleState, CombatAction, Combatant, GridPosition, ProgramStep } from './types';
import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';
import { actionMethod } from './ActionCatalog';
import { facingOf, isTurn, movementDelta, turnFacing } from './Movement';
import { ABILITIES, allies, castAbility, cooldownStep, expireControl, isAbility } from './Abilities';
import { fireStrike, surfaceBlocks } from './StateReactions';
import type { CombatEffect } from './types';

const GRID_SIZE = 7;
export interface BattleOptions { enemyAttackPower?: number; initialHp?: Partial<Record<ArkanId, number>>; enemyActive?: boolean; surfaces?: import('./types').Surface[]; initialBurning?: readonly (ArkanId | 'konstrukt')[] }

export class BattleEngine {
  private state: BattleState;
  private effects: CombatEffect[] = [];

  constructor(private readonly spawns?: Partial<Record<ArkanId | 'konstrukt', GridPosition>>, private readonly options: BattleOptions = {}) {
    this.state = this.initialState();
  }

  get snapshot(): Readonly<BattleState> {
    return structuredClone(this.state);
  }

  reset(withCompanion = false, enemyHp = 3, team?: readonly ArkanId[]): void {
    this.state = this.initialState(withCompanion, enemyHp, team);
  }

  runStep(playerAction: CombatAction, enemyActive = false, onAction?: (frame: ActionFrame) => void): Readonly<BattleState> {
    return this.runTick({ [this.state.player.id]: { kind: 'action', action: playerAction } }, enemyActive, onAction);
  }

  runTick(programs: Partial<Record<ArkanId, ProgramStep | ((adjacent: boolean) => ProgramStep | undefined)>>, enemyActive = false, onAction?: (frame: ActionFrame) => void): Readonly<BattleState> {
    if (this.state.outcome !== 'ongoing') return this.snapshot;
    let acted = false;
    const frames: ActionFrame[] = []; const emit = (frame: ActionFrame) => frames.push(frame);
    for (const actor of allies(this.state)) {
      if (!actor || actor.hp === 0 || this.state.outcome !== 'ongoing') continue;
      const entry = programs[actor.id as ArkanId];
      const step = typeof entry === 'function' ? entry(this.areAdjacent(actor, this.state.enemy)) : entry;
      if (!step) {
        this.addLog(`${actor.name}: Programm beendet, wartet.`);
        continue;
      }
      if (!acted) { this.state.tick += 1; cooldownStep(this.state); }
      acted = true;
      const adjacent = this.areAdjacent(actor, this.state.enemy);
      const action = step.kind === 'action' ? step.action : adjacent ? step.whenTrue : step.whenFalse;
      const before = this.snapshot;
      this.effects = [];
      this.addLog(`${actor.id}.${actionMethod(action, actor.id as ArkanId)}()${step.kind === 'condition' ? ` – enemyAdjacent = ${adjacent}` : ''}`);
      if (!this.skipFrozen(actor)) this.act(actor, this.state.enemy, action);
      this.refreshIntent(enemyActive);
      emit({ actor: actor.id, action, before, after: this.snapshot, ...(this.effects.length ? { effects: this.effects } : {}) });
    }
    if (acted && enemyActive && this.state.outcome === 'ongoing') {
      const target = this.enemyTarget();
      const enemyAction = this.areAdjacent(this.state.enemy, target) ? 'ATTACK' : 'MOVE_TOWARD';
      const before = this.snapshot;
      this.effects = []; if (!this.skipFrozen(this.state.enemy)) this.act(this.state.enemy, target, enemyAction);
      this.refreshIntent(enemyActive);
      emit({ actor: 'konstrukt', action: enemyAction, before, after: this.snapshot, ...(this.effects.length ? { effects: this.effects } : {}) });
    }
    if (acted && this.state.outcome === 'ongoing') this.periodicEffects(emit);
    if (acted) { expireControl(this.state); this.refreshIntent(enemyActive); }
    if (frames.length) frames[frames.length - 1].after = this.snapshot;
    for (const frame of frames) onAction?.(frame);
    return this.snapshot;
  }

  private initialState(withCompanion = false, enemyHp = 3, team?: readonly ArkanId[]): BattleState {
    const roster: readonly ArkanId[] = team ?? (withCompanion ? ['moosling', 'glutling'] : ['moosling']);
    if (!roster.length || roster.length > 3 || new Set(roster).size !== roster.length) throw new Error('Wähle ein Team aus ein bis drei unterschiedlichen Arkanen.');
    const ally = (id: ArkanId, y: number): Combatant => {
      const species = ARKANA_SPECIES[id];
      return { id, name: species.name, hp: Math.max(1, Math.min(species.maxHp, this.options.initialHp?.[id] ?? species.maxHp)), maxHp: species.maxHp, attackPower: species.attack, x: 1, y, guarding: false, facing: 'east' };
    };
    const state: BattleState = {
      tick: 0,
      outcome: 'ongoing',
      player: ally(roster[0], 3),
      companion: roster[1] ? ally(roster[1], 2) : undefined,
      enemy: { id: 'konstrukt', name: 'Übungskonstrukt', hp: enemyHp, maxHp: enemyHp, x: 5, y: 3, guarding: false, facing: 'west', ...(this.options.enemyAttackPower ? { attackPower: this.options.enemyAttackPower } : {}) },
      log: ['Trainingsarena bereit. Das Konstrukt beobachtet deinen Aktionsplan.'],
    };
    if (roster.length > 2) state.additionalAllies = roster.slice(2).map((id, index) => ally(id, 4 + index));
    if (this.options.surfaces) state.surfaces = structuredClone(this.options.surfaces);
    for (const unit of [...allies(state), state.enemy]) if (this.options.initialBurning?.includes(unit.id)) unit.burning = { remaining: 3, source: roster[0] };
    for (const actor of [...allies(state), state.enemy]) {
      if (actor && this.spawns?.[actor.id]) Object.assign(actor, this.spawns[actor.id]);
    }
    if (this.options.enemyActive) state.enemyIntent = { target: state.player.id as ArkanId, damage: state.enemy.attackPower ?? 1 };
    return state;
  }

  private act(actor: Combatant, target: Combatant, action: CombatAction): void {
    actor.guarding = Boolean(actor.protection);
    if (isAbility(action)) {
      if (actor.id === 'konstrukt' || !ARKANA_SPECIES[actor.id].supported.includes(ABILITIES[action].skill)) { this.addLog('Diese Art beherrscht diese Fähigkeit nicht.'); return; }
      this.effects = castAbility(this.state, actor, action, (text) => this.addLog(text)); this.checkOutcome(); return;
    }
    if (isTurn(action)) { actor.facing = turnFacing(facingOf(actor), action); return; }
    const delta = movementDelta(action, facingOf(actor));
    if (delta) { this.moveTo(actor, actor.x + delta.x, actor.y + delta.y); return; }
    switch (action) {
      case 'ATTACK':
        this.attack(actor, target);
        break;
      case 'MOVE_TOWARD':
        this.moveToward(actor, target);
        break;
      case 'WAIT': this.addLog(`${actor.name} wartet einen Schritt.`); break;
    }
  }

  private attack(actor: Combatant, target: Combatant): void {
    if (!this.areAdjacent(actor, target)) {
      this.addLog(`${actor.name} ist noch außer Reichweite.`);
      return;
    }
    const cover = target.coveredBy && allies(this.state).find((unit) => unit.id === target.coveredBy!.source && unit.hp > 0 && Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y) <= 3);
    if (actor.id === 'konstrukt' && cover) {
      const text = `${cover.name} übernimmt den Treffer für ${target.name}.`;
      this.effects.push({ kind: 'cover', source: cover.id as ArkanId, target: target.id, amount: Math.min(actor.attackPower ?? 1, cover.hp), text });
      this.addLog(text); target = cover;
    }
    const reaction = actor.id !== 'konstrukt' && ARKANA_SPECIES[actor.id].basicAttack.element === 'fire' ? fireStrike(target, actor.attackPower ?? 1) : { power: actor.attackPower ?? 1, consumed: false };
    const power = reaction.power;
    if (reaction.consumed) {
      const text = `Brand ausgenutzt: ${actor.name} verstärkt den direkten Feuerangriff auf 3 Schaden und verbraucht den Brand.`;
      this.addLog(text); this.effects.push({ kind: 'combo', source: actor.id as ArkanId, target: target.id, amount: power, text });
    }
    const damage = Math.min(target.hp, target.protection || target.armor ? Math.max(0, power - 2) : target.guarding ? 0 : power);
    const shield = target.armor ?? target.protection;
    if (shield && power > damage) this.effects.push({ kind: 'guard', source: shield.source, target: target.id, amount: Math.min(2, power), text: `${target.name}: ${target.armor ? 'Steinpanzer' : 'Rindenwacht'} fängt ${Math.min(2, power)} Schaden ab.` });
    target.hp = Math.max(0, target.hp - damage);
    this.addLog(damage === 0 ? `${target.name} blockt den Angriff.` : `${actor.name} trifft ${target.name} für ${damage} Schaden.`);
    this.checkOutcome();
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
    if (actor.rooted) {
      const text = `${actor.name}: Ranken verhindern die Bewegung.`; this.addLog(text);
      this.effects.push({ kind: 'root', source: actor.rooted.source, target: actor.id, amount: 1, text }); return;
    }
    const occupant = [...allies(this.state), this.state.enemy].find((unit) => unit && unit.id !== actor.id && unit.x === nextX && unit.y === nextY);
    if (surfaceBlocks(this.state.surfaces, { x: nextX, y: nextY })) { this.addLog('Bewegung blockiert: Wasser ist noch nicht vereist.'); return; }
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

  private enemyTarget(): Combatant { return allies(this.state).find((unit) => unit.hp > 0 && unit.protection) ?? allies(this.state).find((unit) => unit.hp > 0) ?? this.state.player; }
  private refreshIntent(active: boolean): void {
    if (active && this.state.outcome === 'ongoing') this.state.enemyIntent = { target: this.enemyTarget().id as ArkanId, damage: this.state.enemy.attackPower ?? 1 };
    else delete this.state.enemyIntent;
  }
  private checkOutcome(): void {
    for (const unit of [...allies(this.state), this.state.enemy]) if (unit.hp <= 0) {
      delete unit.burning; delete unit.chilled; delete unit.frozen; delete unit.regeneration; delete unit.rooted; delete unit.protection; delete unit.armor; delete unit.coveredBy; unit.guarding = false;
    }
    for (const unit of allies(this.state)) if (unit.coveredBy && !allies(this.state).some((source) => source.id === unit.coveredBy!.source && source.hp > 0)) delete unit.coveredBy;
    if (this.state.enemy.hp <= 0) { this.state.outcome = 'victory'; this.addLog('Sieg! Das Konstrukt ist ausgeschaltet.'); }
    else if (allies(this.state).every((unit) => unit.hp <= 0)) { this.state.outcome = 'defeat'; this.addLog('Niederlage. Du kannst sofort neu starten.'); }
  }
  private periodicEffects(onAction?: (frame: ActionFrame) => void): void {
    for (const unit of [this.state.enemy, ...allies(this.state)]) for (const status of ['burning', 'regeneration'] as const) {
      if (this.state.outcome !== 'ongoing' || !unit[status] || unit.hp <= 0) continue;
      const effect = unit[status]!; const before = this.snapshot;
      const amount = status === 'burning' ? Math.min(1, unit.hp) : Math.min(1, unit.maxHp - unit.hp);
      unit.hp += status === 'burning' ? -amount : amount;
      const text = `${unit.name}: ${status === 'burning' ? 'Brand −' : 'Heilmoos +'}${amount} LP.`; this.addLog(text);
      if (--effect.remaining <= 0) delete unit[status]; this.checkOutcome();
      onAction?.({ actor: effect.source, action: status === 'burning' ? 'IGNITE' : 'HEALING_MOSS', periodic: true, before, after: this.snapshot,
        effects: [{ kind: status === 'burning' ? 'burn' : 'heal', source: effect.source, target: unit.id, amount, text }] });
    }
  }

  private skipFrozen(unit: Combatant): boolean {
    if (!unit.frozen) return false;
    const source = unit.frozen.source; delete unit.frozen; delete unit.chilled;
    const text = `${unit.name}: Eingefroren — die nächste reguläre Aktion fällt aus. Danach endet der Frostzustand.`;
    this.addLog(text); this.effects.push({ kind: 'freeze', source, target: unit.id, amount: 1, text }); return true;
  }

  private addLog(entry: string): void {
    this.state.log = [...this.state.log.slice(-79), entry];
  }
}
