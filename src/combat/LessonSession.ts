import { lessonActors, type WorldQuest } from '../gameplay/WorldQuests';
import type { SkillId } from '../gameplay/ArkanaCatalog';
import { BattleEngine } from './BattleEngine';
import { PuzzleEngine } from './PuzzleEngine';
import { compileActionPlan, nodesToSource, programCost } from './DecisionProgram';
import { nodesCapabilityError } from './CommandCatalog';
import { ProgramRunner } from './ProgramRunner';
import { RepeatProgress } from './RepeatProgress';
import { DecisionProgress, enemyAdjacent } from './DecisionProgress';
import { AdaptiveCombatSession } from './AdaptiveCombatSession';
import { TeamLessonSession } from './TeamLessonSession';
import type { ActionFrame, ArkanId, EncounterState, ProgramSources } from './types';

/** Shared quest entry point; solo rules and delegated active/team encounters use the same parser and runner. */
export class LessonSession {
  private readonly adaptive?: AdaptiveCombatSession;
  private readonly cooperative?: TeamLessonSession;
  private readonly skills: readonly SkillId[];
  private readonly actor: ArkanId;
  private engine: BattleEngine | PuzzleEngine;
  private runner?: ProgramRunner;
  private signature = '';
  private actionFrames: ActionFrame<EncounterState>[] = [];
  private readonly repeatProgress = new RepeatProgress();
  private readonly decisions = new DecisionProgress();
  private trialIndex = 0;
  private passedTrials = 0;
  private nextTrial = false;
  private decisionFailure?: string;
  readonly actors: readonly ArkanId[];
  constructor(readonly lesson: WorldQuest, skills: readonly SkillId[] | Partial<Record<ArkanId, readonly SkillId[]>>) {
    this.actors = lessonActors(lesson); this.actor = this.actors[0];
    const skillMap: Partial<Record<ArkanId, readonly SkillId[]>> = Array.isArray(skills) ? Object.fromEntries(this.actors.map((actor) => [actor, skills])) : skills as Partial<Record<ArkanId, readonly SkillId[]>>;
    this.skills = skillMap[this.actor] ?? [];
    this.engine = lesson.kind === 'puzzle' ? new PuzzleEngine(lesson) : new BattleEngine({ [this.actor]: lesson.start, konstrukt: lesson.enemy });
    if (lesson.kind === 'combat' && lesson.adaptiveTrials?.length) this.adaptive = new AdaptiveCombatSession(lesson, this.skills);
    if (lesson.kind === 'combat' && this.actors.length === 2) this.cooperative = new TeamLessonSession(lesson, skillMap);
    this.reset();
  }
  get frames(): readonly ActionFrame<EncounterState>[] { return this.cooperative?.frames ?? this.adaptive?.frames ?? this.actionFrames; }
  get snapshot(): EncounterState {
    if (this.cooperative) return this.cooperative.snapshot;
    if (this.adaptive) return this.adaptive.snapshot;
    const state: EncounterState = this.engine.snapshot;
    if (state.outcome === 'victory' && this.lesson.kind === 'puzzle' && !this.repeatProgress.satisfies(this.lesson.repeatGoal)) state.outcome = 'incomplete';
    const trials = this.lesson.kind === 'combat' ? this.lesson.decisionTrials : undefined;
    if (trials?.length) {
      state.outcome = this.decisionFailure ? 'incomplete' : this.passedTrials === trials.length ? 'victory' : 'ongoing';
      state.lessonTrial = { current: this.trialIndex + 1, total: trials.length, title: trials[this.trialIndex].title, passed: this.passedTrials,
        message: this.decisionFailure ?? (this.nextTrial ? 'Passend entschieden. Der nächste Schritt startet die nächste Situation mit demselben Programm.' : this.passedTrials === trials.length ? 'In beiden Situationen passend entschieden.' : 'Welche erste Aktion passt zur Entfernung?') };
    }
    return state;
  }
  reset(): void {
    if (this.cooperative) { this.cooperative.reset(); return; }
    if (this.adaptive) { this.adaptive.reset(); return; }
    this.trialIndex = 0; this.passedTrials = 0; this.nextTrial = false; this.decisionFailure = undefined; this.decisions.clear();
    if (this.engine instanceof PuzzleEngine) this.engine.reset();
    else this.resetCombat();
    this.runner = undefined; this.signature = ''; this.actionFrames = []; this.repeatProgress.clear();
  }
  execute(sources: ProgramSources, full = false): string {
    if (this.cooperative) return this.cooperative.execute(sources, full);
    if (this.adaptive) return this.adaptive.execute(sources, full);
    this.actionFrames = [];
    const parsed = compileActionPlan(sources[this.actor] ?? '', this.actor);
    if (parsed.error || !parsed.nodes) return parsed.error ?? 'Ungültiges Programm.';
    const allowed = this.skills.filter((skill) => this.lesson.allowed.includes(skill));
    const error = nodesCapabilityError(parsed.nodes, this.actor, 0, allowed);
    if (error) return error;
    const signature = nodesToSource(parsed.nodes, this.actor);
    if (full || signature !== this.signature) { this.reset(); this.runner = new ProgramRunner(parsed.nodes); this.signature = signature; }
    if (!programCost(parsed.nodes)) return 'Dein Programm ist leer. Ziehe eine Anweisung unter den Startblock.';
    if (this.snapshot.outcome !== 'ongoing') return this.result();
    do {
      if (this.nextTrial) { this.trialIndex++; this.nextTrial = false; this.resetCombat(); this.runner = new ProgramRunner(parsed.nodes); }
      const before = this.snapshot;
      const step = this.runner?.next(enemyAdjacent(before));
      if (!step || step.kind !== 'action') {
        if (before.lessonTrial) this.decisionFailure = 'Für diese Antwort ist kein Befehl verbunden. Ergänze den dann- und den sonst-Teil deines falls/sonst-Blocks.';
        break;
      }
      if (this.engine instanceof PuzzleEngine) this.engine.step(step.action); else this.engine.runStep(step.action);
      const raw = this.engine.snapshot;
      const trace = this.runner?.lastTrace;
      if (before.lessonTrial) {
        this.decisionFailure = this.decisions.record(step.action, before, raw, trace);
        if (!this.decisionFailure) {
          this.passedTrials++;
          this.nextTrial = this.passedTrials < before.lessonTrial.total;
          if (!this.nextTrial && !this.decisions.satisfied) this.decisionFailure = 'Nutze denselben falls/sonst-Block für beide Situationen, damit seine Bedingung einmal ja und einmal nein ergibt.';
        }
      }
      this.repeatProgress.record(step.action, before.player.x !== raw.player.x || before.player.y !== raw.player.y, trace);
      this.actionFrames.push({ actor: this.actor, action: step.action, before, after: this.snapshot, trace: trace ? structuredClone({ ...trace, line: parsed.sourceMap?.[trace.path] }) : undefined });
    } while (full && this.snapshot.outcome === 'ongoing' && (this.nextTrial || !this.runner?.done));
    return this.result();
  }
  private resetCombat(): void {
    if (this.lesson.kind !== 'combat') return;
    const trial = this.lesson.decisionTrials?.[this.trialIndex];
    this.engine = new BattleEngine({ [this.actor]: trial?.start ?? this.lesson.start, konstrukt: trial?.enemy ?? this.lesson.enemy });
    this.engine.reset(false, this.lesson.enemyHp, [this.actor]);
  }
  private result(): string {
    const state = this.snapshot;
    if (state.outcome === 'victory') return 'Questziel erreicht! Kehre zur Spielwelt zurück, um den nächsten Schritt zu erfahren.';
    if (state.lessonTrial) return `Situation ${state.lessonTrial.current}/${state.lessonTrial.total} · ${state.lessonTrial.passed} geschafft. ${state.lessonTrial.message}`;
    if (state.outcome === 'incomplete') return this.lesson.kind === 'puzzle' && this.lesson.repeatGoal === 'movement-sequence'
      ? 'Rune erreicht. Die Musterübung ist noch offen: Wiederhole rechts und oben gemeinsam in derselben Schleife mindestens zweimal erfolgreich. Einzelbefehle, getrennte Schleifen und blockierte Schritte zählen nicht als gemeinsames Muster.'
      : 'Rune erreicht. Die Schleifenübung ist noch offen: Wiederhole eine Bewegung mindestens zweimal mit einer Schleife.';
    if (this.runner?.done) return 'Programm beendet. Das Ziel ist noch nicht erreicht. Ergänze oder verändere deine Anweisungen.';
    return `Schritt ${state.tick}: Beobachte die aktive Anweisung und führe den nächsten Schritt aus.`;
  }
}
