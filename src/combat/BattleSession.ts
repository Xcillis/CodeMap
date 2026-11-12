import { BattleEngine } from './BattleEngine';
import { blocksToSource, compileActionPlan, CONDITION_PROGRAM, DEFAULT_PROGRAM, FORMATION_PROGRAM } from './DecisionProgram';
import type { ArkanId, ProgramSources, ProgramStep } from './types';
import { programCapabilityError } from './CommandCatalog';

export type MissionId = 1 | 2 | 3;

export function missionPrograms(mission: MissionId): ProgramSources {
  if (mission === 1) return { moosling: DEFAULT_PROGRAM };
  if (mission === 2) return { moosling: CONDITION_PROGRAM };
  return { moosling: FORMATION_PROGRAM, glutling: FORMATION_PROGRAM.replace(/moosling/g, 'glutling') };
}

/** Owns execution independently of Phaser and editor selection. */
export class BattleSession {
  private readonly engine = new BattleEngine();
  private plans: Partial<Record<ArkanId, ProgramStep[]>> = {};
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
    for (const actor of this.actors) {
      const parsed = compileActionPlan(sources[actor] ?? '', actor);
      if (!parsed.steps || !parsed.blocks) return `${actor}: ${parsed.error}`;
      const capabilityError = programCapabilityError(parsed.blocks, actor, this.mission);
      if (capabilityError) return capabilityError;
      plans[actor] = parsed.steps;
      canonical.push(blocksToSource(parsed.blocks, actor));
    }
    const signature = JSON.stringify(canonical);
    const changed = signature !== this.signature;
    if (full || changed) this.reset();
    this.signature = signature;
    this.plans = plans;
    this.length = Math.max(...this.actors.map((actor) => plans[actor]?.length ?? 0));
    if (this.snapshot.outcome !== 'ongoing') return this.result();
    if (this.cursor >= this.length) return 'Aktionspläne beendet. Bearbeite ein Programm oder starte neu.';
    do {
      const steps: Partial<Record<ArkanId, ProgramStep>> = {};
      for (const actor of this.actors) steps[actor] = this.plans[actor]?.[this.cursor];
      this.engine.runTick(steps, this.mission === 2);
      this.cursor += 1;
    } while (full && this.cursor < this.length && this.snapshot.outcome === 'ongoing');
    return this.result();
  }

  private result(): string {
    if (this.snapshot.outcome === 'victory') return 'Sieg! Die Programme haben das Ziel erreicht.';
    if (this.snapshot.outcome === 'defeat') return 'Niederlage. Bearbeite die Programme und führe sie erneut aus.';
    return `Schritt ${this.cursor}/${this.length}${this.cursor === this.length ? ' – Aktionspläne beendet.' : ''}`;
  }
}
