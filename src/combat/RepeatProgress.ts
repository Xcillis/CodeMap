import type { RepeatGoal } from '../gameplay/WorldQuests';
import type { CombatAction, ExecutionTrace } from './types';

interface Iteration { moves: { path: string; action: CombatAction }[]; blocked: boolean; effective: number }

/** Counts observed movement, keeping separate invocations of nested loops apart. */
export class RepeatProgress {
  private readonly loops = new Map<string, Map<number, Iteration>>();
  private readonly nested = new Map<string, Map<number, Set<number>>>();
  clear(): void { this.loops.clear(); this.nested.clear(); }
  record(action: CombatAction, moved: boolean, trace?: ExecutionTrace, effective = moved): void {
    if (!trace) return;
    for (const [index, loop] of trace.loops.entries()) {
      const parents = trace.loops.slice(0, index).map((parent) => `${parent.path}:${parent.iteration}`).join('/');
      const key = `${parents}/${loop.path}`;
      const iterations = this.loops.get(key) ?? new Map<number, Iteration>();
      const iteration = iterations.get(loop.iteration) ?? { moves: [], blocked: false, effective: 0 };
      if (effective) iteration.effective++;
      if (moved) iteration.moves.push({ path: trace.path, action });
      else iteration.blocked = true;
      iterations.set(loop.iteration, iteration); this.loops.set(key, iterations);
    }
    if (effective) for (let index = 1; index < trace.loops.length; index++) {
      const outer = trace.loops[index - 1]; const inner = trace.loops[index];
      if (outer.total < 2 || inner.total < 2) continue;
      const parents = trace.loops.slice(0, index - 1).map((parent) => `${parent.path}:${parent.iteration}`).join('/');
      const key = `${parents}/${outer.path}/${inner.path}`;
      const invocations = this.nested.get(key) ?? new Map<number, Set<number>>();
      const iterations = invocations.get(outer.iteration) ?? new Set<number>(); iterations.add(inner.iteration);
      invocations.set(outer.iteration, iterations); this.nested.set(key, invocations);
    }
  }
  satisfies(goal: RepeatGoal): boolean {
    if (goal === 'none') return true;
    if (goal === 'nested') return [...this.nested.values()].some((outer) => [...outer.values()].filter((inner) => inner.size >= 2).length >= 2);
    for (const iterations of this.loops.values()) {
      if (goal === 'movement' && [...iterations.values()].filter((iteration) => iteration.moves.length > 0).length >= 2) return true;
      if (goal === 'effective' && [...iterations.values()].filter((iteration) => iteration.effective > 0).length >= 2) return true;
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
