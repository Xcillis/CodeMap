import type { ArkanId } from '../combat/types';
import type { MissionId } from '../combat/BattleSession';
import { ARKANA_SPECIES, instanceId, isArkanId, startingSkills, type OwnedArkana, type SkillId } from './ArkanaCatalog';
import { LESSON_IDS, getLesson, isLessonId, lessonActors, type LessonId, type CampaignAction, type CampaignDialog, type QuestCompletion } from './WorldQuests';
import { availableArkanaEncounters, encounterUnlocked } from './ArkanaEncounters';
import { QUEST_GIVERS, QUEST_ROUTES, forestAccessible, giverLessons, isQuestGiverId, normalizeCompletions, requirementsMet, type QuestGiverId } from './QuestNetwork';
import { REGIONS, isRegionId, type RegionId } from './WorldRegions';

export interface CampaignState {
  version: 2;
  worldVersion: 1;
  region: RegionId;
  legacyForestAccess: boolean;
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
const teamCapacity = (completed: readonly LessonId[], introductions: readonly LessonId[], legacy: readonly MissionId[]): number =>
  legacy.includes(2) || (completed.includes('q07-moosling') && introductions.includes('q08-team')) ? 2 : 1;

/** New quest IDs never reinterpret old victories or overwrite numeric editor slots. */
export function normalizeCampaign(value: unknown, legacyIntroduction = false): CampaignState {
  const raw = record(value);
  const legacy = raw.version === 2 ? record(raw.legacyProgress) : raw;
  const saved = raw.version === 2 ? lessonIds(raw.completed) : [];
  const legacyForestAccess = raw.legacyForestAccess === true || (raw.worldVersion !== 1 && saved.includes('q05-aufmerksam') && saved.includes('q02-basisangriff') && saved.includes('q01-glutspur'));
  const completed = normalizeCompletions(saved, legacyForestAccess);
  const requestedRegion = isRegionId(raw.region) ? raw.region : legacyForestAccess ? 'forest' : 'valley';
  const region = requestedRegion === 'forest' && !forestAccessible(completed, legacyForestAccess) ? 'valley' : requestedRegion;
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
  const team = Array.isArray(raw.team) ? [...new Set(raw.team)].filter((id): id is string => typeof id === 'string' && owned.some((item) => item.id === id)).slice(0, teamCapacity(completed, introductions, legacyProgress.completed)) : [];
  return { version: 2, worldVersion: 1, region, legacyForestAccess, introduced: raw.introduced === true || (raw.introduced === undefined && legacyIntroduction), owned, team,
    discovered: [...new Set([...(raw.version === 2 ? lessonIds(raw.discovered) : []), ...completed])], completed, introductions, legacyProgress };
}

export class Campaign {
  private state: CampaignState;
  private active?: WorldEncounter;
  constructor(saved?: unknown, legacyIntroduction = false) { this.state = normalizeCampaign(saved, legacyIntroduction); }
  get snapshot(): CampaignState { return structuredClone(this.state); }
  get region(): RegionId { return this.state.region; }
  get forestUnlocked(): boolean { return forestAccessible(this.state.completed, this.state.legacyForestAccess); }
  get availableEncounters() { return availableArkanaEncounters(this.state); }
  get teamLimit(): number { return teamCapacity(this.state.completed, this.state.introductions, this.state.legacyProgress.completed); }
  get activeTeam(): OwnedArkana[] { return this.state.team.map((id) => this.state.owned.find((item) => item.id === id)!).filter(Boolean).map((item) => structuredClone(item)); }
  get objective(): string {
    if (!this.state.introduced) return 'Sprich mit Arkanist Eldren an der Akademie.';
    if (!this.has('glutling')) return 'Finde Glutling am westlichen Akademieweg und nimm es in deine Sammlung auf.';
    if (this.region === 'valley') {
      if (!this.state.completed.includes('q01-glutspur')) return 'Bewegungstutorial: Sprich mit Eldren an der Talakademie.';
      if (!this.state.completed.includes('q02-basisangriff')) return 'Angriffstutorial: Kehre zu Eldren an der Talakademie zurück.';
      if (this.forestUnlocked) return 'Der Ostpass zum Aetherwald ist frei. Reise zum Wald oder wähle weitere Talaufgaben bei Eldren, Brann und Mira.';
      if (requirementsMet('q12-steinrutsch', this.state.completed)) return 'Mira am Ostpass bietet die Runenwinde zum Freiräumen des Steinrutschs an. Andere Talaufgaben bleiben frei wählbar.';
      return 'Wähle eine Schleifen-Aufgabenreihe: Runenrätsel bei Eldren, Kampf bei Brann oder verschachtelte Schleifen bei Mira am Ostpass.';
    }
    if (!this.state.completed.includes('q05-aufmerksam')) return 'Waldeinführung: Sprich zuerst mit Waldhüterin Lyra über Bedingungen und Entscheidungen.';
    return this.has('moosling') ? 'Wähle Waldaufgaben bei Lyra, Neria oder Tala in beliebiger Reihenfolge. Der Rückweg ins Tal bleibt offen.' : 'Wähle Waldaufgaben bei Lyra oder Neria. Im südöstlichen Hain kannst du außerdem Moosling finden und bei Tala kennenlernen.';
  }
  questReady(id: LessonId): boolean { const route = QUEST_ROUTES[id]; return route.region === this.region && (route.region === 'valley' || this.forestUnlocked) && requirementsMet(id, this.state.completed); }
  visitGiver(id: QuestGiverId): boolean {
    if (this.active || QUEST_GIVERS[id].region !== this.region || !this.state.introduced || !this.has('glutling')) return false;
    this.state.discovered = [...new Set([...this.state.discovered, ...giverLessons(id)])]; return true;
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
    const route = QUEST_ROUTES[id];
    if (route.region === 'forest' && !this.forestUnlocked) return 'Der Steinrutsch versperrt den Wald. Löse Miras Gebietsaufgabe „Die Runenwinde am Steinrutsch“.';
    if (!requirementsMet(id, this.state.completed)) {
      const all = route.all.filter((prior) => !this.state.completed.includes(prior)).map((prior) => getLesson(prior).title);
      return `Voraussetzung: ${all.join(', ')}${route.any && !route.any.some((prior) => this.state.completed.includes(prior)) ? `${all.length ? '; zusätzlich ' : ''}eine dieser Aufgaben: ${route.any.map((prior) => getLesson(prior).title).join(' oder ')}` : ''}.`;
    }
    if (route.region !== this.region) return `Reise zuerst in das Gebiet ${REGIONS[route.region].name}.`;
    if (!this.state.discovered.includes(id)) return `Entdecke diese Aufgabe bei ${QUEST_GIVERS[route.giver].name} in der Spielwelt.`;
    if (!this.has('glutling')) return 'Finde zuerst Glutling am westlichen Akademieweg. Sprich es dort an und wähle „In Sammlung aufnehmen“.';
    if (lessonActors(getLesson(id)).includes('moosling') && !this.has('moosling')) return 'Finde zuerst Moosling im südöstlichen Hain. Sprich es dort an und wähle „In Sammlung aufnehmen“.';
  }
  missionError(id: LessonId): string | undefined {
    const error = this.lessonPrerequisiteError(id); if (error) return error;
    const team = this.activeTeam; const actors = lessonActors(getLesson(id));
    if (team.length !== actors.length || actors.some((actor, index) => team[index]?.speciesId !== actor)) return actors.length === 1
      ? `Wähle ${ARKANA_SPECIES[actors[0]].name} als einziges aktives Arkana unter Charakter → Aktuelles Team.`
      : 'Diese Aufgabe benötigt Moosling zuerst und Glutling danach. Mit „Team wählen & Quest starten“ nimmst du die Einführung zum zweiten Teamplatz an und setzt beide aktiv.';
  }
  lessonOffer(id: LessonId): Pick<CampaignDialog, 'action' | 'actionLabel'> {
    if (this.active || this.lessonPrerequisiteError(id)) return {};
    if (this.missionError(id)) return { action: `prepare-lesson:${id}`, actionLabel: `${this.preparationName(id)} wählen & Quest starten` };
    return { action: `lesson:${id}`, actionLabel: this.state.completed.includes(id) ? 'Quest wiederholen' : 'Einführung annehmen' };
  }
  prepareMission(id: LessonId): WorldEncounter | string {
    if (this.active) return 'Eine Begegnung läuft bereits.';
    const error = this.lessonPrerequisiteError(id); if (error) return error;
    if (id === 'q08-team' && !this.state.introductions.includes(id)) this.state.introductions.push(id);
    this.state.team = lessonActors(getLesson(id)).map(instanceId);
    return this.beginMission(id);
  }
  beginMission(id: LessonId): WorldEncounter | string {
    if (this.active) return 'Eine Begegnung läuft bereits.';
    const error = this.missionError(id); if (error) return error;
    const lesson = getLesson(id);
    if (!this.state.introductions.includes(id)) this.state.introductions.push(id);
    for (const owned of this.state.owned) owned.learned = [...new Set([...owned.learned, ...lesson.introduces])];
    const actors = lessonActors(lesson);
    const skills = Object.fromEntries(actors.map((actor) => [actor, this.state.owned.find((item) => item.speciesId === actor)!.learned.filter((skill) => lesson.allowed.includes(skill))]));
    this.active = { kind: 'lesson', lesson: id, team: [...actors], skills };
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
  finishMission(id: LessonId): QuestCompletion | undefined {
    if (this.active?.kind !== 'lesson' || this.active.lesson !== id) return;
    const repeated = this.state.completed.includes(id);
    this.completeMission(id);
    const quest = getLesson(id);
    return { lesson: id, title: quest.title, text: quest.reward, nextObjective: this.objective, repeated };
  }
  leaveMission(): void { this.active = undefined; }
  apply(action: CampaignAction): string {
    if (this.active) return 'Beende zuerst die aktuelle Begegnung.';
    if (action === 'travel-forest' || action === 'travel-valley') {
      if (action === 'travel-forest' && !this.forestUnlocked) return 'Der Steinrutsch blockiert den Ostpass. Sprich mit Mira und löse ihre Gebietsaufgabe.';
      this.state.region = action === 'travel-forest' ? 'forest' : 'valley'; return `Du reist nach ${REGIONS[this.region].name}.`;
    }
    if (action === 'meet-eldren') { this.state.introduced = true; return 'Eldren zeigt dir Glutlings Fundort am westlichen Akademieweg.'; }
    if (action === 'recruit-moosling' || action === 'recruit-glutling') {
      const species = action === 'recruit-moosling' ? 'moosling' : 'glutling';
      if (this.has(species)) return `${ARKANA_SPECIES[species].name} ist bereits in deiner Sammlung.`;
      if (!this.state.introduced) return 'Sprich zuerst mit Arkanist Eldren. Er hilft dir, dein erstes Arkana zu finden.';
      if (!encounterUnlocked(this.state, species)) return 'Moosling wartet im südöstlichen Waldhain nach Lyras Einführung. Reise zuerst in den Wald und lerne dort die Bedingungen kennen.';
      const owned: OwnedArkana = { id: instanceId(species), speciesId: species, learned: [...new Set([...startingSkills(), ...this.state.introductions.flatMap((id) => getLesson(id).introduces)])] };
      this.state.owned.push(owned);
      if (this.state.team.length < this.teamLimit) this.state.team.push(owned.id);
      return `${ARKANA_SPECIES[species].name} hat sich dir angeschlossen. ${this.objective}`;
    }
    return '';
  }
  interact(target: string): CampaignDialog {
    if (target === 'travel') return this.region === 'forest'
      ? { speaker: 'RÜCKWEG INS TAL', text: 'Du kannst jederzeit zurückkehren und offene Talaufgaben lösen. Deine Programme und dein Fortschritt bleiben erhalten.', action: 'travel-valley', actionLabel: 'Ins Tal reisen' }
      : this.forestUnlocked ? { speaker: 'OSTPASS', text: 'Der Pass ist frei. Im Wald wartet zuerst Lyra mit der Einführung in Bedingungen. Talaufgaben bleiben weiterhin spielbar.', action: 'travel-forest', actionLabel: 'In den Wald reisen' }
      : { speaker: 'STEINRUTSCH', text: 'Die Felsen blockieren den einzigen Waldzugang. Mira am Ostpass hilft dir mit der Runenwinde.' };
    if (target === 'landslide') return this.questDialog('q12-steinrutsch');
    if (target === 'training') return { speaker: 'FREIE TRAININGSARENA', text: 'Hier sind alle implementierten Befehle zum Experimentieren verfügbar. Das Training schaltet keine Weltquest und keine Lernfähigkeit frei. Wähle ein Solo- oder Duo-Training mit gesammelten Arkana.', action: 'open-training', actionLabel: 'Training vorbereiten' };
    const giverId = target === 'arkanist-eldren' ? 'eldren' : target.startsWith('giver:') ? target.slice(6) : undefined;
    if (isQuestGiverId(giverId)) {
      const giver = QUEST_GIVERS[giverId];
      if (giver.region !== this.region) return { speaker: 'AETHERIA', text: `Diese Person findest du im Gebiet ${REGIONS[giver.region].name}.` };
      if (!this.state.introduced && giverId === 'eldren') return { speaker: giver.name.toUpperCase(), text: 'Willkommen im Tal! Finde Glutling am westlichen Akademieweg. Danach zeige ich dir Bewegung und Angriff. Anschließend kannst du die Aufgabenreihen im Tal frei wählen.', action: 'meet-eldren', actionLabel: 'Glutling suchen' };
      if (!this.state.introduced || !this.has('glutling')) return { speaker: giver.name.toUpperCase(), text: this.objective };
      return { speaker: giver.name.toUpperCase(), text: giver.description, action: `quests:${giverId}`, actionLabel: 'Aufgaben ansehen' };
    }
    if (isArkanId(target)) {
      const species = ARKANA_SPECIES[target];
      if (this.has(target)) return { speaker: species.name.toUpperCase(), text: 'Dieses Arkana ist bereits Teil deiner Sammlung.' };
      if (!this.state.introduced) return { speaker: 'AETHERIA', text: 'Sprich zuerst mit Arkanist Eldren. Danach kannst du Glutling als erstes Arkana aufnehmen.' };
      if (!encounterUnlocked(this.state, target)) return { speaker: 'AETHERIA', text: 'Dieses Arkana ist hier noch nicht verfügbar. Moosling findest du im Wald nach Lyras Einführung.' };
      return { speaker: species.name.toUpperCase(), text: `Du hast ${species.name} gefunden! ${species.strength} ${species.weakness} Nimm es auf und lerne seine Befehle Schritt für Schritt.`, action: target === 'moosling' ? 'recruit-moosling' : 'recruit-glutling', actionLabel: 'In Sammlung aufnehmen' };
    }
    const id = target.startsWith('lesson:') ? target.slice(7) : undefined;
    return isLessonId(id) ? this.questDialog(id) : { speaker: 'AETHERIA', text: this.objective };
  }
  private questDialog(id: LessonId): CampaignDialog {
    if (QUEST_ROUTES[id].region !== this.region) return { speaker: getLesson(id).title.toUpperCase(), text: this.lessonPrerequisiteError(id) ?? `Reise nach ${REGIONS[QUEST_ROUTES[id].region].name}.` };
    if (!this.state.discovered.includes(id)) this.state.discovered.push(id);
    const quest = getLesson(id); const error = this.missionError(id);
    const offer = this.lessonOffer(id);
    const ready = this.questReady(id);
    const needsTeam = offer.action?.startsWith('prepare-lesson:');
    const name = this.preparationName(id);
    const explanation = needsTeam ? lessonActors(quest).length === 1
      ? `Für diese Aufgabe spielt ${name} allein. Mit „${name} wählen & Quest starten“ wird es dein einziges aktives Arkana und die Aufgabe beginnt. Deine anderen Arkana bleiben in der Sammlung.`
      : 'Mit „Team wählen & Quest starten“ nimmst du die Einführung zum zweiten Teamplatz an. Moosling wird zuerst, Glutling danach aktiv gesetzt. Beide behalten ihre eigenen Programme.' : error;
    return { speaker: quest.title.toUpperCase(), text: `${ready && this.state.introduced && this.has('glutling') ? quest.introduction : 'Hier wartet eine Lernaufgabe auf dich.'}${explanation ? `\n\n${explanation}` : ''}`,
      actionLabel: !this.state.introduced ? 'Zur Spielwelt: Eldren aufsuchen' : !this.has('glutling') ? 'Zur Spielwelt: Glutling suchen' : ready && lessonActors(quest).includes('moosling') && !this.has('moosling') ? 'Zur Spielwelt: Moosling suchen' : 'Zur Spielwelt', ...offer };
  }
  private preparationName(id: LessonId): string { const actors = lessonActors(getLesson(id)); return actors.length === 1 ? ARKANA_SPECIES[actors[0]].name : 'Team'; }
}
