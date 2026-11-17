import type { ActionFrame, EncounterState } from './types';
import type { ProgramRunner } from './ProgramRunner';

/** Require observed loop work and an actual exit, not just a while node in the draft. */
export class WhileProgress {
  private readonly movement = new Set<string>();
  private readonly postExit = new Set<string>();
  private readonly defeats = new Set<string>();
  clear(): void { this.movement.clear(); this.postExit.clear(); this.defeats.clear(); }
  record(frame: ActionFrame<EncounterState>, runner?: ProgramRunner): void {
    for (const loop of frame.trace?.loops ?? []) if (loop.kind === 'while') {
      if (frame.before.player.x !== frame.after.player.x || frame.before.player.y !== frame.after.player.y) this.movement.add(loop.path);
      if (frame.before.enemy && frame.after.enemy && frame.before.enemy.hp > 0 && frame.after.enemy.hp === 0) this.defeats.add(loop.path);
    }
    for (const check of runner?.whileChecks ?? []) if (!check.value && !frame.trace?.path.startsWith(`${check.path}.body.`)) this.postExit.add(check.path);
  }
  satisfies(goal: 'path' | 'combat' | undefined, runner?: ProgramRunner, allowZero = false): boolean {
    if (!goal) return true;
    return (runner?.whileChecks ?? []).some((check) => goal === 'combat'
      ? check.condition === 'enemyAlive' && check.iteration >= 2 && this.defeats.has(check.path)
      : check.condition === 'pathAheadClear' && !check.value && this.postExit.has(check.path) && (this.movement.has(check.path) || (allowZero && check.iteration === 1)));
  }
}
