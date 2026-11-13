import type { RepeatGoal } from '../gameplay/WorldQuests';
import type { CombatAction, ExecutionTrace } from './types';

interface Iteration { moves: { path: string; action: CombatAction }[]; blocked: boolean }

/** Counts observed movement, keeping separate invocations of nested loops apart. */
export class RepeatProgress {
  private readonly loops = new Map<string, Map<number, Iteration>>();
  clear(): void { this.loops.clear(); }
  record(action: CombatAction, moved: boolean, trace?: ExecutionTrace): void {
    if (!trace) return;
    for (const [index, loop] of trace.loops.entries()) {
      const parents = trace.loops.slice(0, index).map((parent) => `${parent.path}:${parent.iteration}`).join('/');
      const key = `${parents}/${loop.path}`;
      const iterations = this.loops.get(key) ?? new Map<number, Iteration>();
      const iteration = iterations.get(loop.iteration) ?? { moves: [], blocked: false };
      if (moved) iteration.moves.push({ path: trace.path, action });
      else iteration.blocked = true;
      iterations.set(loop.iteration, iteration); this.loops.set(key, iterations);
    }
  }
  satisfies(goal: RepeatGoal): boolean {
    if (goal === 'none') return true;
    for (const iterations of this.loops.values()) {
      if (goal === 'movement' && [...iterations.values()].filter((iteration) => iteration.moves.length > 0).length >= 2) return true;
      if (goal !== 'movement-sequence') continue;
      const sequences = new Map<string, number>();
      for (const iteration of iterations.values()) {
        if (iteration.blocked || new Set(iteration.moves.map((move) => move.path)).size < 2 || new Set(iteration.moves.map((move) => move.action)).size < 2) continue;
        const signature = JSON.stringify(iteration.moves);
        const count = (sequences.get(signature) ?? 0) + 1; sequences.set(signature, count);
        if (count >= 2) return true;
      }
    }
    return false;
  }
}
