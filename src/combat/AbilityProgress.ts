import type { AbilityEvidence, ActionFrame, ArkanId } from './types';

/** Record real effects, never merely the presence of ability blocks or casts without a useful target. */
export class AbilityProgress {
  private readonly seen = new Set<AbilityEvidence>();
  clear(): void { this.seen.clear(); }
  record(frame: ActionFrame, healingTarget?: ArkanId): void {
    for (const effect of frame.effects ?? []) {
      if (effect.amount <= 0 || effect.kind === 'damage' || (effect.kind === 'heal' && healingTarget && effect.target !== healingTarget)) continue;
      this.seen.add(effect.kind);
    }
  }
  missing(goals: readonly AbilityEvidence[]): AbilityEvidence[] { return goals.filter((goal) => !this.seen.has(goal)); }
}
