import type { CombatAction, EncounterState, ExecutionTrace } from './types';

export function enemyAdjacent(state: EncounterState): boolean {
  return Boolean(state.enemy && Math.abs(state.player.x - state.enemy.x) + Math.abs(state.player.y - state.enemy.y) === 1);
}

/** Validates an observed choice, then remembers which branches of one condition worked. */
export class DecisionProgress {
  private readonly branches = new Map<string, Set<boolean>>();
  clear(): void { this.branches.clear(); }
  record(action: CombatAction, before: EncounterState, after: EncounterState, trace?: ExecutionTrace): string | undefined {
    const adjacent = enemyAdjacent(before);
    if (!before.enemy || !after.enemy) return 'Für diese Entscheidung fehlt das Konstrukt.';
    const choices = trace?.conditions.filter((condition) => condition.value === adjacent) ?? [];
    if (!choices.length) return 'Die erste Aktion muss von deinem falls/sonst-Block ausgewählt werden. Einzelne Befehle davor zählen nicht.';
    const distance = (state: EncounterState) => state.enemy ? Math.abs(state.player.x - state.enemy.x) + Math.abs(state.player.y - state.enemy.y) : Infinity;
    if (adjacent ? action !== 'ATTACK' || after.enemy.hp >= before.enemy.hp : action === 'ATTACK' || distance(after) !== distance(before) - 1) {
      return adjacent ? 'Das Konstrukt steht direkt daneben. Wähle im dann-Teil einen Angriff.' : 'Das Konstrukt ist zu weit für einen Angriff entfernt. Wähle im sonst-Teil einen Schritt näher heran.';
    }
    for (const choice of choices) {
      const values = this.branches.get(choice.path) ?? new Set<boolean>(); values.add(choice.value); this.branches.set(choice.path, values);
    }
  }
  get satisfied(): boolean { return [...this.branches.values()].some((values) => values.has(true) && values.has(false)); }
}
