import type { WorldQuest, DecisionTrial } from '../gameplay/WorldQuests';
import type { SkillId } from '../gameplay/ArkanaCatalog';
import type { ActionFrame, BattleState, ProgramSources } from './types';
import { BattleEngine } from './BattleEngine';
import { ProgramRunner } from './ProgramRunner';
import { compileActionPlan, nodesToSource, programCost } from './DecisionProgram';
import { nodesCapabilityError } from './CommandCatalog';
import { enemyAdjacent } from './DecisionProgress';
import { AdaptiveDecisionProgress } from './AdaptiveDecisionProgress';

/** A full encounter per start situation, using one unchanged program and fresh per-case evidence. */
export class AdaptiveCombatSession {
  private engine!: BattleEngine;
  private runner?: ProgramRunner;
  private signature = '';
  private index = 0;
  private passed = 0;
  private nextTrial = false;
  private failure?: string;
  private actionFrames: ActionFrame[] = [];
  private readonly progress = new AdaptiveDecisionProgress();
  private readonly trials: readonly DecisionTrial[];
  constructor(private readonly lesson: Extract<WorldQuest, { kind: 'combat' }>, private readonly skills: readonly SkillId[]) {
    this.trials = lesson.adaptiveTrials?.length ? lesson.adaptiveTrials : [{ title: lesson.title, start: lesson.start, enemy: lesson.enemy }];
    this.reset();
  }
  get snapshot(): BattleState { return this.present(this.engine.snapshot); }
  get frames(): readonly ActionFrame[] { return this.actionFrames; }
  reset(): void {
    this.index = 0; this.passed = 0; this.nextTrial = false; this.failure = undefined;
    this.signature = ''; this.runner = undefined; this.actionFrames = []; this.resetTrial();
  }
  execute(sources: ProgramSources, full = false): string {
    this.actionFrames = [];
    const parsed = compileActionPlan(sources.glutling ?? '', 'glutling');
    if (parsed.error || !parsed.nodes) return parsed.error ?? 'Ungültiges Programm.';
    const error = nodesCapabilityError(parsed.nodes, 'glutling', 0, this.skills.filter((skill) => this.lesson.allowed.includes(skill)));
    if (error) return error;
    const signature = nodesToSource(parsed.nodes, 'glutling');
    if (full || signature !== this.signature) { this.reset(); this.runner = new ProgramRunner(parsed.nodes); this.signature = signature; }
    if (!programCost(parsed.nodes)) return 'Dein Programm ist leer. Ziehe eine Anweisung unter den Startblock.';
    if (this.snapshot.outcome !== 'ongoing') return this.result();
    do {
      if (this.nextTrial) { this.index++; this.nextTrial = false; this.resetTrial(); this.runner = new ProgramRunner(parsed.nodes); }
      const step = this.runner?.next(enemyAdjacent(this.snapshot));
      if (!step) { this.failure = 'Hier ist keine weitere Aktion verbunden. Ergänze beide Teile des falls/sonst-Blocks und wiederhole die Entscheidung oft genug.'; break; }
      this.engine.runTick({ glutling: step }, true, (frame) => {
        const before = this.present(frame.before);
        const trace = frame.actor === 'glutling' ? this.runner?.lastTrace : undefined;
        if (frame.actor === 'glutling') this.progress.record(frame.action, frame.before, frame.after, trace);
        if (frame.after.outcome === 'victory') {
          if (this.progress.satisfied) { this.passed++; this.nextTrial = this.passed < this.trials.length; }
          else this.failure = 'Wächter ausgeschaltet, Lernziel noch offen: Prüfe dieselbe Bedingung innerhalb derselben Schleife bei verschiedenen Durchläufen neu. Beide Antworten müssen passende Aktionen auslösen.';
        }
        this.actionFrames.push({ ...frame, before, after: this.snapshot, trace: trace ? structuredClone({ ...trace, line: parsed.sourceMap?.[trace.path] }) : undefined });
      });
      if (this.snapshot.outcome === 'ongoing' && !this.nextTrial && this.runner?.done) {
        this.failure = 'Programm beendet, der Wächter ist noch aktiv. Ergänze beide Teile der Entscheidung und wähle genügend Wiederholungen.';
        const last = this.actionFrames.at(-1); if (last) last.after = this.snapshot;
      }
    } while (full && this.snapshot.outcome === 'ongoing');
    return this.result();
  }
  private resetTrial(): void {
    const trial = this.trials[this.index];
    this.engine = new BattleEngine({ glutling: trial.start, konstrukt: trial.enemy });
    this.engine.reset(false, this.lesson.enemyHp, ['glutling']); this.progress.clear();
  }
  private present(raw: Readonly<BattleState>): BattleState {
    const state: BattleState = structuredClone(raw);
    state.outcome = this.failure ? 'incomplete' : this.passed === this.trials.length ? 'victory' : raw.outcome === 'victory' ? 'ongoing' : raw.outcome;
    state.lessonTrial = { current: this.index + 1, total: this.trials.length, title: this.trials[this.index].title, passed: this.passed,
      message: this.failure ?? (state.outcome === 'defeat' ? 'Glutling hat keine Lebenspunkte mehr. Starte neu und prüfe die Entscheidung in jedem Durchlauf.' : this.nextTrial ? 'Wächter ausgeschaltet und Schleifenentscheidung nachgewiesen. Die nächste Situation beginnt mit demselben Programm und vollen LP.' : state.outcome === 'victory' ? 'Beide Wächter mit wiederholt geprüfter Bedingung ausgeschaltet.' : 'Der Wächter handelt nach Glutling. Entscheide in jedem Durchlauf neu.') };
    return state;
  }
  private result(): string {
    const state = this.snapshot;
    if (state.outcome === 'victory') return 'Questziel erreicht! Du hast in beiden Situationen innerhalb der Schleife neu entschieden.';
    return `Situation ${this.index + 1}/${this.trials.length} · ${this.passed} geschafft. ${state.lessonTrial?.message}`;
  }
}
