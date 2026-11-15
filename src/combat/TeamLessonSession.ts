import { BattleSession } from './BattleSession';
import type { WorldQuest } from '../gameplay/WorldQuests';
import { lessonActors } from '../gameplay/WorldQuests';
import type { SkillId } from '../gameplay/ArkanaCatalog';
import type { ActionFrame, ArkanId, BattleState, ProgramSources } from './types';
import { AbilityProgress } from './AbilityProgress';

/** Team quest evidence is separate from battle mechanics and counts each object's real contribution. */
export class TeamLessonSession {
  private readonly battle: BattleSession;
  private readonly contributors = new Set<ArkanId>();
  private actionFrames: ActionFrame[] = [];
  private readonly actors: readonly ArkanId[];
  private readonly abilities = new AbilityProgress();
  constructor(private readonly lesson: Extract<WorldQuest, { kind: 'combat' }>, skills: Partial<Record<ArkanId, readonly SkillId[]>>) {
    this.actors = lessonActors(lesson);
    const spawns = { [this.actors[0]]: lesson.start, ...(this.actors[1] ? { [this.actors[1]]: lesson.companion ?? { x: 1, y: 2 } } : {}), konstrukt: lesson.enemy };
    const allowed = Object.fromEntries(this.actors.map((actor) => [actor, (skills[actor] ?? []).filter((skill) => lesson.allowed.includes(skill))]));
    this.battle = new BattleSession(3, this.actors, allowed, { spawns, enemyHp: lesson.enemyHp, enemyActive: lesson.enemyActive ?? false, enemyAttackPower: lesson.enemyAttackPower, initialHp: lesson.initialHp });
  }
  get snapshot(): BattleState { return this.present(this.battle.snapshot); }
  get frames(): readonly ActionFrame[] { return this.actionFrames; }
  reset(): void { this.contributors.clear(); this.abilities.clear(); this.actionFrames = []; this.battle.reset(); }
  execute(sources: ProgramSources, full = false): string {
    const feedback = this.battle.execute(sources, full); this.actionFrames = [];
    if (this.battle.snapshot.tick === 0 || this.battle.frames[0]?.before.tick === 1) { this.contributors.clear(); this.abilities.clear(); }
    for (const frame of this.battle.frames) {
      const before = this.present(frame.before);
      if (frame.actor !== 'konstrukt' && frame.after.enemy.hp < frame.before.enemy.hp) this.contributors.add(frame.actor);
      this.abilities.record(frame, this.lesson.healingTarget);
      this.actionFrames.push({ ...frame, before, after: this.present(frame.after) });
    }
    const state = this.snapshot;
    // Preserve parser/capability feedback even when the previous attempt ended without both contributors.
    if (!this.actionFrames.length) return state.outcome === 'incomplete' && feedback.startsWith('Sieg!') ? this.missingContribution() : feedback;
    if (state.outcome === 'victory') return this.lesson.abilityGoals?.length ? 'Questziel erreicht! Deine Fähigkeiten haben ihre verlangten Wirkungen gezeigt.' : 'Questziel erreicht! Beide Arkana haben mit ihren eigenen Programmen wirksam getroffen.';
    if (state.outcome === 'incomplete') return this.missingContribution();
    const contributions = this.actors.map((actor) => `${actor === 'moosling' ? 'Moosling' : 'Glutling'}: ${this.contributors.has(actor) ? 'Treffer beigetragen' : 'Treffer noch offen'}`).join(' · ');
    return `${feedback} ${this.lesson.abilityGoals?.length ? this.missingContribution() : contributions}`;
  }
  private present(raw: Readonly<BattleState>): BattleState {
    const state: BattleState = structuredClone(raw);
    const satisfied = this.lesson.abilityGoals?.length ? this.abilities.missing(this.lesson.abilityGoals).length === 0 : this.actors.every((actor) => this.contributors.has(actor));
    if (state.outcome === 'victory' && !satisfied) state.outcome = 'incomplete';
    return state;
  }
  private missingContribution(): string {
    if (this.lesson.abilityGoals?.length) {
      const names = { burn: 'Brandschaden', root: 'Bewegung durch Ranken verhindert', heal: 'Lebenspunkte geheilt', guard: 'Schaden mit Rindenwacht abgefangen' };
      const missing = this.abilities.missing(this.lesson.abilityGoals);
      return missing.length ? `Fähigkeitsziele noch offen: ${missing.map((goal) => names[goal]).join(' · ')}.` : 'Alle Fähigkeitswirkungen gezeigt. Besiege jetzt das Konstrukt.';
    }
    return 'Konstrukt ausgeschaltet, Teamziel noch offen: Beide Arkana müssen mit ihrem eigenen Programm mindestens einmal wirksam treffen. Ergänze beide Programme und starte neu.';
  }
}
