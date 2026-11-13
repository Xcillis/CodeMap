import type { ArkanId } from '../combat/types';
import type { MissionId } from '../combat/BattleSession';
import { ARKANA_SPECIES, instanceId, isArkanId, startingSkills, type OwnedArkana, type SkillId } from './ArkanaCatalog';
import { LESSON_IDS, getLesson, isLessonId, type LessonId, type CampaignAction, type CampaignDialog } from './WorldQuests';

export interface CampaignState {
  version: 2;
  introduced: boolean;
  owned: OwnedArkana[];
  team: string[];
  discovered: LessonId[];
  completed: LessonId[];
  introductions: LessonId[];
  legacyProgress: { completed: MissionId[]; discovered: MissionId[] };
}
type Skills = Partial<Record<ArkanId, readonly SkillId[]>>;
export type WorldEncounter = { team: ArkanId[]; skills: Skills } & (
  | { kind: 'lesson'; lesson: LessonId }
  | { kind: 'training'; mission: MissionId }
);
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const legacyIds = (value: unknown): MissionId[] => Array.isArray(value) ? ([1, 2, 3] as const).filter((id) => value.includes(id)) : [];
const lessonIds = (value: unknown): LessonId[] => Array.isArray(value) ? LESSON_IDS.filter((id) => value.includes(id)) : [];

/** New quest IDs never reinterpret old victories or overwrite numeric editor slots. */
export function normalizeCampaign(value: unknown, legacyIntroduction = false): CampaignState {
  const raw = record(value);
  const legacy = raw.version === 2 ? record(raw.legacyProgress) : raw;
  const completed: LessonId[] = [];
  const saved = raw.version === 2 ? lessonIds(raw.completed) : [];
  for (const id of LESSON_IDS) { if (!saved.includes(id)) break; completed.push(id); }
  const introductions = [...new Set([...(raw.version === 2 ? lessonIds(raw.introductions) : []), ...completed])];
  const owned: OwnedArkana[] = [];
  if (Array.isArray(raw.owned)) for (const entry of raw.owned) {
    const candidate = record(entry);
    if (!isArkanId(candidate.speciesId) || owned.some((item) => item.speciesId === candidate.speciesId)) continue;
    const supported = ARKANA_SPECIES[candidate.speciesId].supported;
    const learned = Array.isArray(candidate.learned) ? candidate.learned.filter((skill): skill is SkillId => supported.some((allowed) => skill === allowed)) : [];
    owned.push({ id: instanceId(candidate.speciesId), speciesId: candidate.speciesId, learned: [...new Set([...startingSkills(), ...learned, ...introductions.flatMap((id) => getLesson(id).introduces)])] });
  }
  const legacyProgress = { completed: legacyIds(legacy.completed), discovered: legacyIds(legacy.discovered) };
  const team = Array.isArray(raw.team) ? [...new Set(raw.team)].filter((id): id is string => typeof id === 'string' && owned.some((item) => item.id === id)).slice(0, legacyProgress.completed.includes(2) ? 2 : 1) : [];
  return { version: 2, introduced: raw.introduced === true || (raw.introduced === undefined && legacyIntroduction), owned, team,
    discovered: [...new Set([...(raw.version === 2 ? lessonIds(raw.discovered) : []), ...completed])], completed, introductions, legacyProgress };
}

export class Campaign {
  private state: CampaignState;
  private active?: WorldEncounter;
  constructor(saved?: unknown, legacyIntroduction = false) { this.state = normalizeCampaign(saved, legacyIntroduction); }
  get snapshot(): CampaignState { return structuredClone(this.state); }
  get teamLimit(): number { return this.state.legacyProgress.completed.includes(2) ? 2 : 1; }
  get activeTeam(): OwnedArkana[] { return this.state.team.map((id) => this.state.owned.find((item) => item.id === id)!).filter(Boolean).map((item) => structuredClone(item)); }
  get objective(): string {
    if (!this.state.introduced) return 'Sprich mit Arkanist Eldren an der Akademie.';
    if (!this.has('glutling')) return 'Finde Glutling am westlichen Akademieweg und nimm es in deine Sammlung auf.';
    const next = LESSON_IDS.find((id) => !this.state.completed.includes(id));
    if (next && (this.activeTeam.length !== 1 || this.activeTeam[0].speciesId !== 'glutling')) return 'Wähle Glutling als einziges aktives Arkana für die ersten Lernquests.';
    if (next) return `${getLesson(next).title}: Untersuche ${getLesson(next).target}.`;
    return this.has('moosling') ? 'Die ersten Grundlagen sind abgeschlossen. Wiederhole eine Quest oder experimentiere in der freien Trainingsarena.' : 'Die Grundlagen sind geschafft! Finde Moosling am östlichen Weg oder besuche die freie Trainingsarena.';
  }
  has(species: ArkanId): boolean { return this.state.owned.some((item) => item.speciesId === species); }
  toggleTeam(id: string): string {
    if (this.active) return 'Das Team kann während einer Begegnung nicht verändert werden.';
    const found = this.state.owned.find((item) => item.id === id);
    if (!found) return 'Dieses Arkana wurde noch nicht gefunden.';
    if (this.state.team.includes(id)) this.state.team = this.state.team.filter((item) => item !== id);
    else if (this.teamLimit === 1) this.state.team = [id];
    else if (this.state.team.length < this.teamLimit) this.state.team.push(id);
    else return 'Dein Team ist voll. Nimm zuerst ein Arkana aus dem Team.';
    return `${ARKANA_SPECIES[found.speciesId].name}: Team aktualisiert.`;
  }
  private lessonPrerequisiteError(id: LessonId): string | undefined {
    if (!this.state.introduced) return 'Sprich zuerst mit Arkanist Eldren.';
    const index = LESSON_IDS.indexOf(id);
    if (index > 0 && !this.state.completed.includes(LESSON_IDS[index - 1])) return 'Schließe zuerst die vorherige Lernquest ab.';
    if (!this.state.discovered.includes(id)) return 'Entdecke diesen Questort in der Spielwelt oder sprich mit Eldren.';
    if (!this.has('glutling')) return 'Finde zuerst Glutling am westlichen Akademieweg. Sprich es dort an und wähle „In Sammlung aufnehmen“.';
  }
  missionError(id: LessonId): string | undefined {
    const error = this.lessonPrerequisiteError(id); if (error) return error;
    const team = this.activeTeam;
    if (team.length !== 1 || team[0].speciesId !== 'glutling') return 'Wähle Glutling als einziges aktives Arkana unter Charakter → Aktuelles Team.';
  }
  lessonOffer(id: LessonId): Pick<CampaignDialog, 'action' | 'actionLabel'> {
    if (this.active || this.lessonPrerequisiteError(id)) return {};
    if (this.missionError(id)) return { action: `prepare-lesson:${id}`, actionLabel: 'Glutling wählen & Quest starten' };
    return { action: `lesson:${id}`, actionLabel: this.state.completed.includes(id) ? 'Quest wiederholen' : 'Einführung annehmen' };
  }
  prepareMission(id: LessonId): WorldEncounter | string {
    if (this.active) return 'Eine Begegnung läuft bereits.';
    const error = this.lessonPrerequisiteError(id); if (error) return error;
    this.state.team = [instanceId('glutling')];
    return this.beginMission(id);
  }
  beginMission(id: LessonId): WorldEncounter | string {
    if (this.active) return 'Eine Begegnung läuft bereits.';
    const error = this.missionError(id); if (error) return error;
    const lesson = getLesson(id);
    if (!this.state.introductions.includes(id)) this.state.introductions.push(id);
    for (const owned of this.state.owned) owned.learned = [...new Set([...owned.learned, ...lesson.introduces])];
    const learned = this.state.owned.find((item) => item.speciesId === 'glutling')!.learned;
    this.active = { kind: 'lesson', lesson: id, team: ['glutling'], skills: { glutling: learned.filter((skill) => lesson.allowed.includes(skill)) } };
    return structuredClone(this.active);
  }
  beginTraining(mission: MissionId, team: readonly ArkanId[]): WorldEncounter | string {
    if (this.active) return 'Eine Begegnung läuft bereits.';
    if (![1, 2, 3].includes(mission)) return 'Unbekannte Trainingsaufgabe.';
    if (team.length !== (mission === 3 ? 2 : 1) || new Set(team).size !== team.length) return mission === 3 ? 'Wähle zwei unterschiedliche gesammelte Arkana für das Duo-Training.' : 'Wähle ein gesammeltes Arkana für das Solo-Training.';
    if (team.some((id) => !this.has(id))) return 'Du kannst nur gesammelte Arkana zum Training mitnehmen.';
    this.active = { kind: 'training', mission, team: [...team], skills: Object.fromEntries(team.map((id) => [id, [...ARKANA_SPECIES[id].supported]])) };
    return structuredClone(this.active);
  }
  completeMission(id: LessonId): string | undefined {
    if (this.active?.kind !== 'lesson' || this.active.lesson !== id || this.state.completed.includes(id)) return;
    this.state.completed.push(id); return getLesson(id).reward;
  }
  leaveMission(): void { this.active = undefined; }
  apply(action: CampaignAction): string {
    if (this.active) return 'Beende zuerst die aktuelle Begegnung.';
    if (action === 'meet-eldren') { this.state.introduced = true; return 'Eldren zeigt dir Glutlings Fundort am westlichen Akademieweg.'; }
    if (action === 'recruit-moosling' || action === 'recruit-glutling') {
      const species = action === 'recruit-moosling' ? 'moosling' : 'glutling';
      if (species === 'moosling' && !this.state.completed.includes('q03-wiederkehr')) return 'Hilf zuerst Glutling bei den drei Grundlagenquests. Danach vertraut dir Moosling.';
      if (this.has(species)) return `${ARKANA_SPECIES[species].name} ist bereits in deiner Sammlung.`;
      const owned: OwnedArkana = { id: instanceId(species), speciesId: species, learned: [...new Set([...startingSkills(), ...this.state.introductions.flatMap((id) => getLesson(id).introduces)])] };
      this.state.owned.push(owned);
      if (this.state.team.length < this.teamLimit) this.state.team.push(owned.id);
      return `${ARKANA_SPECIES[species].name} hat sich dir angeschlossen. ${this.objective}`;
    }
    return '';
  }
  interact(target: string): CampaignDialog {
    if (target === 'training') return { speaker: 'FREIE TRAININGSARENA', text: 'Hier sind alle implementierten Befehle zum Experimentieren verfügbar. Das Training schaltet keine Weltquest und keine Lernfähigkeit frei. Wähle ein Solo- oder Duo-Training mit gesammelten Arkana.', action: 'open-training', actionLabel: 'Training vorbereiten' };
    if (target === 'arkanist-eldren') {
      if (!this.state.introduced) return { speaker: 'ARKANIST ELDREN', text: 'Willkommen! Am westlichen Akademieweg wartet Glutling. Finde es. Danach hilfst du ihm, eine goldene Rune zu erreichen: Du gibst ihm Befehle für seine Bewegungen. Ich zeige dir Schritt für Schritt, wie das geht.', action: 'meet-eldren', actionLabel: 'Glutling suchen' };
      if (!this.has('glutling')) return { speaker: 'ARKANIST ELDREN', text: this.objective };
      return this.questDialog(LESSON_IDS.find((id) => !this.state.completed.includes(id)) ?? LESSON_IDS[0]);
    }
    if (isArkanId(target)) {
      const species = ARKANA_SPECIES[target];
      if (this.has(target)) return { speaker: species.name.toUpperCase(), text: 'Dieses Arkana ist bereits Teil deiner Sammlung.' };
      if (target === 'moosling' && !this.state.completed.includes('q03-wiederkehr')) return { speaker: 'MOOSSPUR', text: 'Ein scheues Naturwesen beobachtet dich. Hilf zuerst Glutling bei den drei Grundlagenquests.' };
      return { speaker: species.name.toUpperCase(), text: `Du hast ${species.name} gefunden! ${species.strength} ${species.weakness} Nimm es auf und lerne seine Befehle Schritt für Schritt.`, action: target === 'moosling' ? 'recruit-moosling' : 'recruit-glutling', actionLabel: 'In Sammlung aufnehmen' };
    }
    const id = target.startsWith('lesson:') ? target.slice(7) : undefined;
    return isLessonId(id) ? this.questDialog(id) : { speaker: 'AETHERIA', text: this.objective };
  }
  private questDialog(id: LessonId): CampaignDialog {
    if (!this.state.discovered.includes(id)) this.state.discovered.push(id);
    const quest = getLesson(id); const error = this.missionError(id);
    const offer = this.lessonOffer(id);
    const index = LESSON_IDS.indexOf(id);
    const ready = index === 0 || this.state.completed.includes(LESSON_IDS[index - 1]);
    const needsTeam = offer.action?.startsWith('prepare-lesson:');
    const explanation = needsTeam ? 'Für diese Aufgabe spielt Glutling allein. Mit „Glutling wählen & Quest starten“ wird es dein einziges aktives Arkana und die Aufgabe beginnt. Deine anderen Arkana bleiben in der Sammlung.' : error;
    return { speaker: quest.title.toUpperCase(), text: `${ready && this.state.introduced && this.has('glutling') ? quest.introduction : 'Hier wartet eine Lernaufgabe auf dich.'}${explanation ? `\n\n${explanation}` : ''}`,
      actionLabel: !this.state.introduced ? 'Zur Spielwelt: Eldren aufsuchen' : !this.has('glutling') ? 'Zur Spielwelt: Glutling suchen' : 'Zur Spielwelt', ...offer };
  }
}
