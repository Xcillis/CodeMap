import type { ArkanId } from '../combat/types';
import type { MissionId } from '../combat/BattleSession';
import { ARKANA_SPECIES, instanceId, isArkanId, startingSkills, type OwnedArkana, type SkillId } from './ArkanaCatalog';
import { WORLD_QUESTS, type CampaignAction, type CampaignDialog } from './WorldQuests';

export interface CampaignState {
  version: 1;
  introduced: boolean;
  owned: OwnedArkana[];
  team: string[];
  discovered: MissionId[];
  completed: MissionId[];
}
export interface WorldEncounter {
  mission: MissionId;
  team: ArkanId[];
  skills: Partial<Record<ArkanId, readonly SkillId[]>>;
}

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const missionIds = (value: unknown): MissionId[] => Array.isArray(value) ? [1, 2, 3].filter((id): id is MissionId => value.includes(id)) : [];

/** Normalizes persisted data without discarding independent editor drafts. */
export function normalizeCampaign(value: unknown, legacyIntroduction = false): CampaignState {
  const raw = record(value);
  const completed = missionIds(raw.completed);
  // Completion is a sequential story chain; corrupted later flags cannot bypass prerequisites.
  const sequential: MissionId[] = [];
  for (const id of [1, 2, 3] as const) { if (!completed.includes(id)) break; sequential.push(id); }
  const owned: OwnedArkana[] = [];
  if (Array.isArray(raw.owned)) for (const entry of raw.owned) {
    const candidate = record(entry);
    if (!isArkanId(candidate.speciesId) || owned.some((item) => item.speciesId === candidate.speciesId)) continue;
    const supported = ARKANA_SPECIES[candidate.speciesId].supported;
    const learned = Array.isArray(candidate.learned) ? candidate.learned.filter((skill): skill is SkillId => supported.some((allowed) => skill === allowed)) : [];
    owned.push({ id: instanceId(candidate.speciesId), speciesId: candidate.speciesId, learned: [...new Set([...startingSkills(sequential.includes(1)), ...learned])] });
  }
  const team = Array.isArray(raw.team) ? [...new Set(raw.team)].filter((id): id is string => typeof id === 'string' && owned.some((item) => item.id === id)).slice(0, sequential.includes(2) ? 2 : 1) : [];
  return { version: 1, introduced: raw.introduced === true || (raw.introduced === undefined && legacyIntroduction), owned, team,
    discovered: [...new Set([...missionIds(raw.discovered), ...sequential])], completed: sequential };
}

/** Owns collection, team validation and world quest progression, without Phaser or DOM. */
export class Campaign {
  private state: CampaignState;
  private activeMission?: MissionId;
  constructor(saved?: unknown, legacyIntroduction = false) { this.state = normalizeCampaign(saved, legacyIntroduction); }
  get snapshot(): CampaignState { return structuredClone(this.state); }
  get teamLimit(): number { return this.state.completed.includes(2) ? 2 : 1; }
  get activeTeam(): OwnedArkana[] { return this.state.team.map((id) => this.state.owned.find((item) => item.id === id)!).filter(Boolean).map((item) => structuredClone(item)); }
  get objective(): string {
    if (!this.state.introduced) return 'Sprich mit Arkanist Eldren an der Akademie.';
    if (!this.has('moosling')) return 'Finde Moosling am westlichen Runenpfad und nimm ihn in dein Team auf.';
    if (!this.state.team.length) return 'Wähle ein aktives Arkana in Sammlung & Team.';
    if (!this.state.completed.includes(1)) return 'Befreie den Runenpfad. Sprich mit dem Runenstein am Weg.';
    if (!this.state.completed.includes(2)) return 'Untersuche das wandernde Konstrukt östlich der Akademie.';
    if (!this.has('glutling')) return 'Finde Glutling am östlichen Weg und erweitere deine Sammlung.';
    if (!this.state.completed.includes(3)) return this.state.team.length < 2 ? 'Stelle in Sammlung & Team zwei Arkana für das Osttor zusammen.' : 'Öffne das Osttor. Untersuche das Siegel am Ende des Weges.';
    return 'Die Weltquests sind abgeschlossen. Erkunde weiter oder wiederhole eine Quest im Journal.';
  }
  has(species: ArkanId): boolean { return this.state.owned.some((item) => item.speciesId === species); }

  toggleTeam(id: string): string {
    if (this.activeMission) return 'Das Team kann während einer Begegnung nicht verändert werden.';
    const found = this.state.owned.find((item) => item.id === id);
    if (!found) return 'Dieses Arkana wurde noch nicht gefunden.';
    if (this.state.team.includes(id)) this.state.team = this.state.team.filter((item) => item !== id);
    else if (this.teamLimit === 1) this.state.team = [id];
    else if (this.state.team.length < this.teamLimit) this.state.team.push(id);
    else return 'Dein Team ist voll. Nimm zuerst ein Arkana aus dem Team.';
    return `${ARKANA_SPECIES[found.speciesId].name}: Team aktualisiert.`;
  }

  missionError(id: MissionId): string | undefined {
    if (!this.state.introduced) return 'Sprich zuerst mit Arkanist Eldren.';
    if (id > 1 && !this.state.completed.includes((id - 1) as MissionId)) return 'Schließe zuerst die vorherige Weltquest ab.';
    if (!this.state.discovered.includes(id)) return 'Entdecke diesen Questort in der Spielwelt oder sprich mit Eldren.';
    const expected = id === 3 ? 2 : 1;
    if (this.state.team.length !== expected) return `Wähle für diese Quest genau ${expected === 1 ? 'ein aktives Arkana' : 'zwei aktive Arkana'} in Sammlung & Team.`;
  }

  beginMission(id: MissionId): WorldEncounter | string {
    if (this.activeMission) return 'Eine Begegnung läuft bereits.';
    const error = this.missionError(id); if (error) return error;
    this.activeMission = id;
    const team = this.activeTeam;
    return { mission: id, team: team.map((item) => item.speciesId), skills: Object.fromEntries(team.map((item) => [item.speciesId, item.learned])) };
  }

  completeMission(id: MissionId): string | undefined {
    if (this.activeMission !== id || this.state.completed.includes(id)) return;
    this.state.completed.push(id);
    if (id === 1) for (const item of this.state.owned) item.learned = startingSkills(true);
    return WORLD_QUESTS.find((quest) => quest.id === id)!.reward;
  }
  leaveMission(): void { this.activeMission = undefined; }

  apply(action: CampaignAction): string {
    if (this.activeMission) return 'Beende zuerst die aktuelle Begegnung.';
    if (action === 'meet-eldren') { this.state.introduced = true; return 'Eldren zeigt dir Mooslings Fundort am westlichen Runenpfad.'; }
    if (action === 'recruit-moosling' || action === 'recruit-glutling') {
      const species = action === 'recruit-moosling' ? 'moosling' : 'glutling';
      if (species === 'glutling' && !this.state.completed.includes(1)) return 'Glutling bleibt noch auf Abstand. Befreie zuerst den Runenpfad.';
      if (this.has(species)) return `${ARKANA_SPECIES[species].name} ist bereits in deiner Sammlung.`;
      const owned: OwnedArkana = { id: instanceId(species), speciesId: species, learned: startingSkills(this.state.completed.includes(1)) };
      this.state.owned.push(owned);
      if (this.state.team.length < this.teamLimit) this.state.team.push(owned.id);
      return `${ARKANA_SPECIES[species].name} hat sich dir angeschlossen. Öffne Sammlung & Team, um dein Team zu wählen.`;
    }
    return '';
  }

  interact(target: string): CampaignDialog {
    if (target === 'arkanist-eldren') {
      if (!this.state.introduced) return { speaker: 'ARKANIST ELDREN', text: 'Willkommen in Aetheria. Am westlichen Runenpfad wartet Moosling. Begegne ihm, öffne deine Sammlung und programmiere ihn für unsere erste Aufgabe.', action: 'meet-eldren', actionLabel: 'Moosling suchen' };
      if (!this.has('moosling') || !this.state.team.length) return { speaker: 'ARKANIST ELDREN', text: this.objective };
      const next = ([1, 2, 3] as const).find((id) => !this.state.completed.includes(id)) ?? 1;
      return this.questDialog(next);
    }
    if (target === 'moosling' || target === 'glutling') {
      const species = ARKANA_SPECIES[target];
      if (this.has(target)) return { speaker: species.name.toUpperCase(), text: `${species.name} ist Teil deiner Sammlung. ${this.objective}` };
      if (target === 'glutling' && !this.state.completed.includes(1)) return { speaker: 'FEUERSPUR', text: 'Zwischen den Funken verbirgt sich ein scheues Wesen. Befreie zuerst den Runenpfad, damit es dir vertraut.' };
      return { speaker: species.name.toUpperCase(), text: `Du hast ${species.name} gefunden! Typ: ${species.type === 'nature' ? 'Natur' : 'Feuer'}. ${species.strength} ${species.weakness} Es möchte sich dir anschließen.`, action: target === 'moosling' ? 'recruit-moosling' : 'recruit-glutling', actionLabel: 'In Sammlung aufnehmen' };
    }
    const quest = WORLD_QUESTS.find((item) => `quest-${item.id}` === target);
    return quest ? this.questDialog(quest.id) : { speaker: 'AETHERIA', text: this.objective };
  }

  private questDialog(id: MissionId): CampaignDialog {
    const quest = WORLD_QUESTS.find((item) => item.id === id)!;
    if (!this.state.discovered.includes(id)) this.state.discovered.push(id);
    const error = this.missionError(id);
    return { speaker: quest.title.toUpperCase(), text: `${quest.introduction}${error ? ` ${error}` : ''}`,
      ...(error ? {} : { action: `quest-${id}` as CampaignAction, actionLabel: this.state.completed.includes(id) ? 'Quest wiederholen' : 'Begegnung starten' }) };
  }
}
