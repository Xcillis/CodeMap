import { BattleEngine } from './BattleEngine';
import { nodesToSource, programCost, compileActionPlan, CONDITION_PROGRAM, DEFAULT_PROGRAM, FORMATION_PROGRAM } from './DecisionProgram';
import type { ArkanId, ProgramSources, ProgramStep } from './types';
import { nodesCapabilityError } from './CommandCatalog';
import { ProgramRunner } from './ProgramRunner';

export type MissionId = 1 | 2 | 3;

export function missionPrograms(mission: MissionId): ProgramSources {
  if (mission === 1) return { moosling: DEFAULT_PROGRAM };
  if (mission === 2) return { moosling: CONDITION_PROGRAM };
  return { moosling: FORMATION_PROGRAM, glutling: FORMATION_PROGRAM.replace(/moosling/g, 'glutling') };
}

/** Owns execution independently of Phaser and editor selection. */
export class BattleSession {
  private readonly engine = new BattleEngine();
  private plans: Partial<Record<ArkanId, ProgramRunner>> = {};
  private signature = '';
  private cursor = 0;
  private length = 0;

  constructor(readonly mission: MissionId) { this.reset(); }

  get snapshot() { return this.engine.snapshot; }
  get actors(): ArkanId[] { return this.mission === 3 ? ['moosling', 'glutling'] : ['moosling']; }

  reset(): void {
    this.engine.reset(this.mission === 3, this.mission === 3 ? 5 : 3);
    this.cursor = 0;
    this.signature = '';
  }

  execute(sources: ProgramSources, full = false): string {
    const plans: typeof this.plans = {};
    const canonical: string[] = [];
    let length = 0;
    for (const actor of this.actors) {
      const parsed = compileActionPlan(sources[actor] ?? '', actor);
      if (parsed.error || !parsed.nodes) return `${actor}: ${parsed.error}`;
      const capabilityError = nodesCapabilityError(parsed.nodes, actor, this.mission);
      if (capabilityError) return capabilityError;
      plans[actor] = new ProgramRunner(parsed.nodes);
      length = Math.max(length, programCost(parsed.nodes));
      canonical.push(nodesToSource(parsed.nodes, actor));
    }
    const signature = JSON.stringify(canonical);
    const changed = signature !== this.signature;
    if (full || changed) this.reset();
    this.signature = signature;
    if (full || changed) this.plans = plans;
    this.length = length;
    if (this.length === 0) return 'Die Programme sind leer. Ziehe einen Befehl in den Programmbereich.';
    if (this.snapshot.outcome !== 'ongoing') return this.result();
    if (this.cursor >= this.length || this.actors.every((actor) => this.plans[actor]?.done)) return 'Aktionspläne beendet. Bearbeite ein Programm oder starte neu.';
    do {
      const steps: Partial<Record<ArkanId, (adjacent: boolean) => ProgramStep | undefined>> = {};
      for (const actor of this.actors) steps[actor] = (adjacent) => this.plans[actor]?.next(adjacent);
      this.engine.runTick(steps, this.mission === 2);
      this.cursor = this.snapshot.tick;
    } while (full && this.cursor < this.length && this.snapshot.outcome === 'ongoing' && this.actors.some((actor) => !this.plans[actor]?.done));
    return this.result();
  }

  private result(): string {
    if (this.snapshot.outcome === 'victory') return 'Sieg! Die Programme haben das Ziel erreicht.';
    if (this.snapshot.outcome === 'defeat') return 'Niederlage. Bearbeite die Programme und führe sie erneut aus.';
    return `Schritt ${this.cursor}/${this.length}${this.cursor === this.length || this.actors.every((actor) => this.plans[actor]?.done) ? ' – Aktionspläne beendet.' : ''}`;
  }
}
