import type { ExecutionTrace, GridPosition, PuzzleState } from './types';

interface RowVisit { rows: Set<number>; cells: Set<string>; iterations: Set<number> }
/** Each outer iteration must light one whole row through the SAME inner loop, not unrelated movement. */
export class RuneRowProgress {
  private readonly invocations = new Map<string, Map<number, RowVisit>>();
  constructor(private readonly required: readonly GridPosition[]) {}
  clear(): void { this.invocations.clear(); }
  record(before: PuzzleState, after: PuzzleState, trace?: ExecutionTrace): void {
    if (!trace) return;
    const lit = after.runes?.filter((rune) => rune.activated && !before.runes?.some((old) => old.x === rune.x && old.y === rune.y && old.activated)) ?? [];
    for (const rune of lit) for (let index = 1; index < trace.loops.length; index++) {
      const outer = trace.loops[index - 1]; const inner = trace.loops[index]; if (outer.total < 2 || inner.total < 2) continue;
      const parents = trace.loops.slice(0, index - 1).map((loop) => `${loop.path}:${loop.iteration}`).join('/');
      const key = `${parents}/${outer.path}/${inner.path}`;
      const visits = this.invocations.get(key) ?? new Map<number, RowVisit>();
      const visit = visits.get(outer.iteration) ?? { rows: new Set<number>(), cells: new Set<string>(), iterations: new Set<number>() };
      visit.rows.add(rune.y); visit.cells.add(`${rune.x},${rune.y}`); visit.iterations.add(inner.iteration);
      visits.set(outer.iteration, visit); this.invocations.set(key, visits);
    }
  }
  get satisfied(): boolean {
    const rows = [...new Set(this.required.map((rune) => rune.y))]; if (rows.length < 2) return false;
    return [...this.invocations.values()].some((visits) => rows.every((row) => [...visits.values()].some((visit) => visit.rows.size === 1 && visit.rows.has(row) && visit.iterations.size >= 2
      && this.required.filter((rune) => rune.y === row).every((rune) => visit.cells.has(`${rune.x},${rune.y}`)))));
  }
}
