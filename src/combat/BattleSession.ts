import { BattleEngine } from './BattleEngine';
import { nodesToSource, programCost, compileActionPlan, CONDITION_PROGRAM, DEFAULT_PROGRAM, FORMATION_PROGRAM } from './DecisionProgram';
import type { ActionFrame, ArkanId, GridPosition, ProgramSources, ProgramStep } from './types';
import { nodesCapabilityError } from './CommandCatalog';
import { ProgramRunner } from './ProgramRunner';
import type { SkillId } from '../gameplay/ArkanaCatalog';

export type MissionId = 1 | 2 | 3;
export interface BattleConfiguration { spawns?: Partial<Record<ArkanId | 'konstrukt', GridPosition>>; enemyHp?: number; enemyActive?: boolean }

export function missionPrograms(mission: MissionId, team?: readonly ArkanId[]): ProgramSources {
  if (team) {
    const source = mission === 1 ? DEFAULT_PROGRAM : mission === 2 ? CONDITION_PROGRAM : FORMATION_PROGRAM;
    return Object.fromEntries(team.map((actor) => [actor, source.replace(/moosling/g, actor)]));
  }
  if (mission === 1) return { moosling: DEFAULT_PROGRAM };
  if (mission === 2) return { moosling: CONDITION_PROGRAM };
  return { moosling: FORMATION_PROGRAM, glutling: FORMATION_PROGRAM.replace(/moosling/g, 'glutling') };
}

/** Owns execution independently of Phaser and editor selection. */
export class BattleSession {
  private readonly engine: BattleEngine;
  private plans: Partial<Record<ArkanId, ProgramRunner>> = {};
  private signature = '';
  private cursor = 0;
  private length = 0;
  private actionFrames: ActionFrame[] = [];
  get frames(): readonly ActionFrame[] { return this.actionFrames; }
  get done(): boolean { return this.snapshot.outcome !== 'ongoing' || this.length === 0 || this.actors.every((actor) => this.plans[actor]?.done); }

  constructor(readonly mission: MissionId, private readonly team?: readonly ArkanId[], private readonly skills?: Partial<Record<ArkanId, readonly SkillId[]>>, private readonly configuration?: BattleConfiguration) {
    this.engine = new BattleEngine(configuration?.spawns); this.reset();
  }

  get snapshot() { return this.engine.snapshot; }
  get actors(): ArkanId[] { return this.team ? [...this.team] : this.mission === 3 ? ['moosling', 'glutling'] : ['moosling']; }

  reset(): void {
    this.engine.reset(this.mission === 3, this.configuration?.enemyHp ?? (this.mission === 3 ? 5 : 3), this.team);
    this.cursor = 0;
    this.signature = '';
    this.actionFrames = [];
  }

  execute(sources: ProgramSources, full = false): string {
    this.actionFrames = [];
    const plans: typeof this.plans = {};
    const canonical: string[] = [];
    let length = 0;
    const lines: Partial<Record<ArkanId, Record<string, number>>> = {};
    for (const actor of this.actors) {
      const parsed = compileActionPlan(sources[actor] ?? '', actor);
      if (parsed.error || !parsed.nodes) return `${actor}: ${parsed.error}`;
      const capabilityError = nodesCapabilityError(parsed.nodes, actor, this.mission, this.skills ? this.skills[actor] ?? [] : undefined);
      if (capabilityError) return capabilityError;
      plans[actor] = new ProgramRunner(parsed.nodes);
      lines[actor] = parsed.sourceMap;
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
      this.engine.runTick(steps, this.configuration?.enemyActive ?? (this.mission === 2), (frame) => {
        const trace = frame.actor !== 'konstrukt' ? this.plans[frame.actor]?.lastTrace : undefined;
        this.actionFrames.push({ ...frame, trace: trace ? structuredClone({ ...trace, line: lines[frame.actor as ArkanId]?.[trace.path] }) : undefined });
      });
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
