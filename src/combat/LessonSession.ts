import type { WorldQuest } from '../gameplay/WorldQuests';
import type { SkillId } from '../gameplay/ArkanaCatalog';
import { BattleEngine } from './BattleEngine';
import { PuzzleEngine } from './PuzzleEngine';
import { compileActionPlan, nodesToSource, programCost } from './DecisionProgram';
import { nodesCapabilityError } from './CommandCatalog';
import { ProgramRunner } from './ProgramRunner';
import type { ActionFrame, ArkanId, EncounterState, ProgramSources } from './types';

/** Executes one introductory program, with the same parser and runner as free training. */
export class LessonSession {
  private readonly engine: BattleEngine | PuzzleEngine;
  private runner?: ProgramRunner;
  private signature = '';
  private actionFrames: ActionFrame<EncounterState>[] = [];
  private readonly loopIterations = new Map<string, Set<number>>();
  readonly actors: ArkanId[] = ['glutling'];
  constructor(readonly lesson: WorldQuest, private readonly skills: readonly SkillId[]) {
    this.engine = lesson.kind === 'puzzle' ? new PuzzleEngine(lesson) : new BattleEngine({ glutling: lesson.start, konstrukt: lesson.enemy });
    this.reset();
  }
  get frames(): readonly ActionFrame<EncounterState>[] { return this.actionFrames; }
  get snapshot(): EncounterState {
    const state: EncounterState = this.engine.snapshot;
    if (state.outcome === 'victory' && this.lesson.kind === 'puzzle' && this.lesson.requireRepeat && ![...this.loopIterations.values()].some((iterations) => iterations.size >= 2)) state.outcome = 'incomplete';
    return state;
  }
  reset(): void {
    if (this.engine instanceof PuzzleEngine) this.engine.reset();
    else this.engine.reset(false, this.lesson.kind === 'combat' ? this.lesson.enemyHp : 3, ['glutling']);
    this.runner = undefined; this.signature = ''; this.actionFrames = []; this.loopIterations.clear();
  }
  execute(sources: ProgramSources, full = false): string {
    this.actionFrames = [];
    const parsed = compileActionPlan(sources.glutling ?? '', 'glutling');
    if (parsed.error || !parsed.nodes) return parsed.error ?? 'Ungültiges Programm.';
    const allowed = this.skills.filter((skill) => this.lesson.allowed.includes(skill));
    const error = nodesCapabilityError(parsed.nodes, 'glutling', 0, allowed);
    if (error) return error;
    const signature = nodesToSource(parsed.nodes, 'glutling');
    if (full || signature !== this.signature) { this.reset(); this.runner = new ProgramRunner(parsed.nodes); this.signature = signature; }
    if (!programCost(parsed.nodes)) return 'Dein Programm ist leer. Ziehe eine Anweisung unter den Startblock.';
    if (this.snapshot.outcome !== 'ongoing') return this.result();
    do {
      const step = this.runner?.next(false);
      if (!step || step.kind !== 'action') break;
      const before = this.snapshot;
      if (this.engine instanceof PuzzleEngine) this.engine.step(step.action); else this.engine.runStep(step.action);
      const raw = this.engine.snapshot;
      const trace = this.runner?.lastTrace;
      if (before.player.x !== raw.player.x || before.player.y !== raw.player.y) for (const loop of trace?.loops ?? []) {
        const iterations = this.loopIterations.get(loop.path) ?? new Set<number>(); iterations.add(loop.iteration); this.loopIterations.set(loop.path, iterations);
      }
      this.actionFrames.push({ actor: 'glutling', action: step.action, before, after: this.snapshot, trace: trace ? structuredClone({ ...trace, line: parsed.sourceMap?.[trace.path] }) : undefined });
    } while (full && this.snapshot.outcome === 'ongoing' && !this.runner?.done);
    return this.result();
  }
  private result(): string {
    const state = this.snapshot;
    if (state.outcome === 'victory') return 'Questziel erreicht! Kehre zur Spielwelt zurück, um den nächsten Schritt zu erfahren.';
    if (state.outcome === 'incomplete') return 'Rune erreicht. Die Schleifenübung ist noch offen: Wiederhole eine Bewegung mindestens zweimal mit einer Schleife.';
    if (this.runner?.done) return 'Programm beendet. Das Ziel ist noch nicht erreicht. Ergänze oder verändere deine Anweisungen.';
    return `Schritt ${state.tick}: Beobachte die aktive Anweisung und führe den nächsten Schritt aus.`;
  }
}
