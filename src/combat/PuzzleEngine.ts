import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';
import { lessonActors, type WorldQuest } from '../gameplay/WorldQuests';
import { ACTIONS } from './ActionCatalog';
import { facingOf, isTurn, movementDelta, turnFacing } from './Movement';
import { freezeSurface, surfaceAhead, surfaceBlocks } from './StateReactions';
import type { CombatAction, PuzzleState } from './types';

/** Directed grid movement without an enemy or automatic pathfinding. */
export class PuzzleEngine {
  private state!: PuzzleState;
  effects: import('./types').CombatEffect[] = [];
  constructor(private readonly definition: Extract<WorldQuest, { kind: 'puzzle' }>) { this.reset(); }
  get snapshot(): PuzzleState { return structuredClone(this.state); }
  reset(): void {
    this.effects = [];
    const species = ARKANA_SPECIES[lessonActors(this.definition)[0]];
    this.state = { tick: 0, outcome: 'ongoing', player: { id: species.id, name: species.name, hp: species.maxHp, maxHp: species.maxHp, attackPower: species.attack, guarding: false, facing: 'east', ...this.definition.start },
      goal: { ...this.definition.goal }, walls: this.definition.walls.map((wall) => ({ ...wall })),
      ...(this.definition.surfaces ? { surfaces: structuredClone(this.definition.surfaces) } : {}),
      ...(this.definition.runes?.length ? { runes: this.definition.runes.map((rune) => ({ ...rune, activated: false })) } : {}),
      ...(this.definition.runeMode ? { runeMode: this.definition.runeMode } : {}),
      log: [`${species.name} wartet auf deine Anweisungen. Die goldene Rune ist das Ziel.`] };
  }
  step(action: CombatAction): void {
    this.effects = [];
    if (this.state.outcome !== 'ongoing') return;
    if (action === 'CHILL') {
      this.state.tick++;
      const surface = surfaceAhead(this.state.player, this.state.surfaces);
      if (surface && freezeSurface(surface)) {
        const text = 'Gefrieren: Flaches Wasser wird zu begehbarem Eis.';
        this.state.log.push(text); this.effects.push({ kind: 'ice', source: this.state.player.id as import('./types').ArkanId, target: this.state.player.id, tile: { x: surface.x, y: surface.y }, amount: 1, text });
      } else this.state.log.push('Gefrieren: Kein vereisbares flaches Wasser direkt voraus.');
      return;
    }
    if (isTurn(action)) {
      this.state.tick++; this.state.player.facing = turnFacing(facingOf(this.state.player), action);
      this.state.log.push(`${this.state.player.id}.${ACTIONS[action].method}()`); return;
    }
    const delta = movementDelta(action, facingOf(this.state.player));
    if (!delta) throw new Error('Dieses Rätsel erwartet einen gerichteten Bewegungsbefehl.');
    const next = { x: this.state.player.x + delta.x, y: this.state.player.y + delta.y };
    this.state.tick++;
    this.state.log.push(`${this.state.player.id}.${ACTIONS[action].method}()`);
    if (surfaceBlocks(this.state.surfaces, next) || next.x < 0 || next.x >= 7 || next.y < 0 || next.y >= 7 || this.state.walls.some((wall) => wall.x === next.x && wall.y === next.y)) {
      this.state.log.push(surfaceBlocks(this.state.surfaces, next) ? 'Bewegung blockiert: Dieses Wasser ist noch nicht vereist.' : 'Bewegung blockiert: Hier liegt ein Stein oder der Rand des Aufgabenraums.');
      return;
    }
    Object.assign(this.state.player, next);
    const rune = this.state.runes?.find((candidate) => candidate.x === next.x && candidate.y === next.y && !candidate.activated);
    if (rune) { rune.activated = true; this.state.log.push('Eine blaue Rune beginnt zu leuchten.'); }
    if (next.x === this.state.goal.x && next.y === this.state.goal.y) {
      const missing = this.state.runes?.filter((candidate) => !candidate.activated).length ?? 0;
      if (missing) this.state.log.push(this.state.runeMode === 'safeguards' ? `Noch ${missing} Sicherungsrunen fehlen. Aktiviere sie, bevor du zur Winde zurückkehrst.` : `Noch ${missing} blaue Runen fehlen. Bearbeite zuerst beide Reihen.`);
      else { this.state.outcome = 'victory'; this.state.log.push('Die goldene Rune ist erreicht.'); }
    }
  }
}
