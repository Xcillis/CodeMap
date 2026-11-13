import { enemyAdjacent } from './DecisionProgress';
import type { CombatAction, EncounterState, ExecutionTrace } from './types';

/** Evidence from effective actions, grouped by one loop invocation and one inner condition. */
export class AdaptiveDecisionProgress {
  private readonly choices = new Map<string, { yes: Set<number>; no: Set<number> }>();
  clear(): void { this.choices.clear(); }
  record(action: CombatAction, before: EncounterState, after: EncounterState, trace?: ExecutionTrace): void {
    if (!before.enemy || !after.enemy || !trace) return;
    const adjacent = enemyAdjacent(before);
    const distance = (state: EncounterState) => state.enemy ? Math.abs(state.player.x - state.enemy.x) + Math.abs(state.player.y - state.enemy.y) : Infinity;
    const effective = adjacent ? action === 'ATTACK' && after.enemy.hp < before.enemy.hp
      : action !== 'ATTACK' && distance(after) === distance(before) - 1;
    if (!effective) return;
    for (const [index, loop] of trace.loops.entries()) {
      for (const choice of trace.conditions) {
        if (choice.value !== adjacent || !choice.path.startsWith(`${loop.path}.body.`)) continue;
        const parents = trace.loops.slice(0, index).map((parent) => [parent.path, parent.iteration]);
        const key = JSON.stringify([parents, loop.path, choice.path]);
        const values = this.choices.get(key) ?? { yes: new Set<number>(), no: new Set<number>() };
        (choice.value ? values.yes : values.no).add(loop.iteration); this.choices.set(key, values);
      }
    }
  }
  get satisfied(): boolean {
    return [...this.choices.values()].some(({ yes, no }) => [...yes].some((iteration) => [...no].some((other) => iteration !== other)));
  }
}
