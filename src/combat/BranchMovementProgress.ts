import type { CombatAction, EncounterState, ExecutionTrace } from './types';
import { evaluateCondition } from './Conditions';

export class BranchMovementProgress {
  private readonly answers = new Map<string, Set<boolean>>();
  clear(): void { this.answers.clear(); }
  record(action: CombatAction, before: EncounterState, after: EncounterState, trace?: ExecutionTrace): void {
    if (before.player.x === after.player.x && before.player.y === after.player.y) return;
    const answer = evaluateCondition(before, 'pathRightClear');
    if (action !== (answer ? 'MOVE_RIGHT' : 'MOVE_UP')) return;
    for (const choice of trace?.conditions ?? []) {
      if (choice.condition !== 'pathRightClear' || choice.value !== answer) continue;
      const values = this.answers.get(choice.path) ?? new Set<boolean>(); values.add(answer); this.answers.set(choice.path, values);
    }
  }
  get satisfied(): boolean { return [...this.answers.values()].some((values) => values.has(true) && values.has(false)); }
}
