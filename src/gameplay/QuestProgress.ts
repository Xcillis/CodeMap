import type { Campaign } from './Campaign';
import { giverLessons, type QuestGiverId } from './QuestNetwork';
import type { LessonId } from './WorldQuests';

export interface QuestStage { readonly title: string; readonly quests: readonly LessonId[]; readonly note?: string }
export interface QuestSeries { readonly id: string; readonly giver: QuestGiverId; readonly title: string; readonly note?: string; readonly stages: readonly QuestStage[] }
/** Display order only. Campaign and QuestNetwork retain all actual prerequisites and permissions. */
export const QUEST_SERIES: readonly QuestSeries[] = [
  { id: 'basics', giver: 'eldren', title: 'Die ersten Grundlagen', stages: [
    { title: 'Glutling bewegen', quests: ['q01-glutspur'] }, { title: 'Bewegung und Angriff verbinden', quests: ['q02-basisangriff'] },
  ] },
  { id: 'runes', giver: 'eldren', title: 'Schleifenrätsel', note: 'Nach den Grundlagen frei wählbar, unabhängig von Branns und Miras Einstiegsreihen.', stages: [
    { title: 'Eine Bewegung wiederholen', quests: ['q03-wiederkehr'] }, { title: 'Ein Bewegungsmuster wiederholen', quests: ['q04-musterpfad'] },
  ] },
  { id: 'battle-loops', giver: 'brann', title: 'Schleifenkampf', note: 'Unabhängig von der Feuerprobe wählbar.', stages: [{ title: 'Befehle im Kampf wiederholen', quests: ['q11-schleifenwache'] }] },
  { id: 'fire', giver: 'brann', title: 'Glutlings Feuerfähigkeit', note: 'Unabhängig vom Schleifenkampf wählbar; später für Talas Rollenkampf nötig.', stages: [{ title: 'Feuer und Brandschaden', quests: ['q14-feuerprobe'] }] },
  { id: 'nested', giver: 'mira', title: 'Verschachtelte Schleifen', stages: [
    { title: 'Eine Stufe wiederholen', quests: ['q09-schachtelpfad'] }, { title: 'Ein Feld Reihe für Reihe bearbeiten', quests: ['q10-schachtelkampf'] },
  ] },
  { id: 'pass', giver: 'mira', title: 'Den Waldzugang öffnen', note: 'Eine Einstiegsaufgabe bei Eldren, Brann oder Mira genügt. Miras gesamte Rätselreihe ist dafür nicht nötig.', stages: [{ title: 'Den Steinrutsch räumen', quests: ['q12-steinrutsch'] }] },
  { id: 'protection', giver: 'mira', title: 'Felsbocks Schutz', note: 'Nach Talas Rollenkampf und dem Fund von Felsbock.', stages: [
    { title: 'Steinpanzer kennenlernen', quests: ['q18-steinpanzer'] }, { title: 'Deckung und dritten Teamplatz lernen', quests: ['q19-deckung'] },
  ] },
  { id: 'decisions', giver: 'lyra', title: 'Bedingungen im Wald', stages: [
    { title: 'Entscheidungen kennenlernen', quests: ['q05-aufmerksam'] }, { title: 'Entscheidungen im aktiven Kampf', quests: ['q06-waechter'] },
  ] },
  { id: 'light', giver: 'neria', title: 'Entscheidungsrätsel', note: 'Nach Lyras Einführung unabhängig von den anderen Waldaufgaben wählbar.', stages: [{ title: 'Den Lichtpfad finden', quests: ['q13-lichtpfad'] }] },
  { id: 'moosling-team', giver: 'tala', title: 'Moosling und das Zweierteam', stages: [
    { title: 'Moosling kennenlernen', quests: ['q07-moosling'] },
    { title: 'Team, Ranken und Heilung üben', quests: ['q08-team', 'q15-wurzelschutz', 'q16-heilmoos'], note: 'Diese drei Übungen kannst du in beliebiger Reihenfolge lösen. Für den späteren Rollenkampf brauchst du alle drei sowie Branns Feuerprobe.' },
    { title: 'Die Rollen im Kampf verbinden', quests: ['q17-teamrollen'] },
  ] },
  { id: 'trio', giver: 'tala', title: 'Das Dreierteam', note: 'Vorher bei Mira Steinpanzer und Deckung lernen; die offene Voraussetzung steht an der Quest.', stages: [{ title: 'Drei eigene Programme verbinden', quests: ['q20-dreiklang'] }] },
];

export function giverProgress(campaign: Campaign, giver: QuestGiverId): { completed: number; total: number; ready: readonly LessonId[]; next?: LessonId; pending?: LessonId } {
  const state = campaign.snapshot;
  const ordered = QUEST_SERIES.filter((series) => series.giver === giver).flatMap((series) => series.stages.flatMap((stage) => stage.quests));
  const ready = ordered.filter((id) => !state.completed.includes(id) && Boolean(campaign.lessonOffer(id).action));
  return { completed: giverLessons(giver).filter((id) => state.completed.includes(id)).length, total: ordered.length, ready, next: ready[0], pending: ordered.find((id) => !state.completed.includes(id)) };
}
