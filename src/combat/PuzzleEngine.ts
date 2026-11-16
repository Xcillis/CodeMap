import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';
import { lessonActors, type WorldQuest } from '../gameplay/WorldQuests';
import { ACTIONS, directionDelta } from './ActionCatalog';
import type { CombatAction, PuzzleState } from './types';

/** Directed grid movement without an enemy or automatic pathfinding. */
export class PuzzleEngine {
  private state!: PuzzleState;
  constructor(private readonly definition: Extract<WorldQuest, { kind: 'puzzle' }>) { this.reset(); }
  get snapshot(): PuzzleState { return structuredClone(this.state); }
  reset(): void {
    const species = ARKANA_SPECIES[lessonActors(this.definition)[0]];
    this.state = { tick: 0, outcome: 'ongoing', player: { id: species.id, name: species.name, hp: species.maxHp, maxHp: species.maxHp, attackPower: species.attack, guarding: false, ...this.definition.start },
      goal: { ...this.definition.goal }, walls: this.definition.walls.map((wall) => ({ ...wall })),
      ...(this.definition.runes?.length ? { runes: this.definition.runes.map((rune) => ({ ...rune, activated: false })) } : {}),
      log: [`${species.name} wartet auf deine Anweisungen. Die goldene Rune ist das Ziel.`] };
  }
  step(action: CombatAction): void {
    if (this.state.outcome !== 'ongoing') return;
    const delta = directionDelta(action);
    if (!delta) throw new Error('Dieses Rätsel erwartet einen gerichteten Bewegungsbefehl.');
    const next = { x: this.state.player.x + delta.x, y: this.state.player.y + delta.y };
    this.state.tick++;
    this.state.log.push(`${this.state.player.id}.${ACTIONS[action].method}()`);
    if (next.x < 0 || next.x >= 7 || next.y < 0 || next.y >= 7 || this.state.walls.some((wall) => wall.x === next.x && wall.y === next.y)) {
      this.state.log.push('Bewegung blockiert: Hier liegt ein Stein oder der Rand des Aufgabenraums.');
      return;
    }
    Object.assign(this.state.player, next);
    const rune = this.state.runes?.find((candidate) => candidate.x === next.x && candidate.y === next.y && !candidate.activated);
    if (rune) { rune.activated = true; this.state.log.push('Eine blaue Rune beginnt zu leuchten.'); }
    if (next.x === this.state.goal.x && next.y === this.state.goal.y) {
      const missing = this.state.runes?.filter((candidate) => !candidate.activated).length ?? 0;
      if (missing) this.state.log.push(`Noch ${missing} blaue Runen fehlen. Bearbeite zuerst beide Reihen.`);
      else { this.state.outcome = 'victory'; this.state.log.push('Die goldene Rune ist erreicht.'); }
    }
  }
}
