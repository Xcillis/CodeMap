import type { LessonId } from './WorldQuests';
import type { RegionId } from './WorldRegions';

export const QUEST_GIVERS = {
  eldren: { name: 'Arkanist Eldren', region: 'valley', x: 915, y: 540, color: 0x8c55bc, description: 'Bewegung, Angriff und Runenrätsel an der Talakademie.' },
  brann: { name: 'Wächter Brann', region: 'valley', x: 440, y: 390, color: 0xbd7652, description: 'Patrouilliert durch das Tal und lehrt Schleifen im Kampf sowie Glutlings Feuerfähigkeiten.' },
  mira: { name: 'Bergmeisterin Mira', region: 'valley', x: 1280, y: 650, color: 0xc9a95c, description: 'Verschachtelte Schleifen, die Räumung des Steinrutschs und danach Felsbocks Schutz am Ostpass.' },
  lyra: { name: 'Waldhüterin Lyra', region: 'forest', x: 700, y: 1450, color: 0x69b482, description: 'Am westlichen Waldsaum: die Einführung in Bedingungen und ein beweglicher Wächter.' },
  neria: { name: 'Runenkundige Neria', region: 'forest', x: 2440, y: 500, color: 0x90aacb, description: 'Auf der nordöstlichen Sonnenlichtung: Entscheidungen auf dem verschlungenen Waldpfad.' },
  tala: { name: 'Arkana-Forscherin Tala', region: 'forest', x: 2580, y: 1550, color: 0xa7b86c, description: 'Im südöstlichen Hain: Mooslings eigenes Programm, Heilung, Ranken und koordinierte Teamkämpfe.' },
} as const;
export type QuestGiverId = keyof typeof QUEST_GIVERS;
export const isQuestGiverId = (value: unknown): value is QuestGiverId => typeof value === 'string' && Object.hasOwn(QUEST_GIVERS, value);
interface Route { region: RegionId; giver: QuestGiverId; all: readonly LessonId[]; any?: readonly LessonId[]; role: string }
export const QUEST_ROUTES: Record<LessonId, Route> = {
  'q18-steinpanzer': { region: 'valley', giver: 'mira', all: ['q17-teamrollen'], role: 'Folgequest · Felsbocks Schutz' },
  'q19-deckung': { region: 'valley', giver: 'mira', all: ['q18-steinpanzer'], role: 'Koordinationsquest · Dritter Teamplatz' },
  'q20-dreiklang': { region: 'forest', giver: 'tala', all: ['q19-deckung'], role: 'Teamquest · Drei eigene Programme' },
  'q01-glutspur': { region: 'valley', giver: 'eldren', all: [], role: 'Tutorial · Bewegung' },
  'q02-basisangriff': { region: 'valley', giver: 'eldren', all: ['q01-glutspur'], role: 'Tutorial · Angriff' },
  'q03-wiederkehr': { region: 'valley', giver: 'eldren', all: ['q02-basisangriff'], role: 'Wahlreihe · Schleifenrätsel' },
  'q04-musterpfad': { region: 'valley', giver: 'eldren', all: ['q03-wiederkehr'], role: 'Folgequest · Bewegungsmuster' },
  'q09-schachtelpfad': { region: 'valley', giver: 'mira', all: ['q02-basisangriff'], role: 'Wahlreihe · Verschachtelte Schleifen' },
  'q10-schachtelkampf': { region: 'valley', giver: 'mira', all: ['q09-schachtelpfad'], role: 'Folgequest · Reihen und Felder' },
  'q11-schleifenwache': { region: 'valley', giver: 'brann', all: ['q02-basisangriff'], role: 'Wahlreihe · Schleifenkampf' },
  'q12-steinrutsch': { region: 'valley', giver: 'mira', all: ['q02-basisangriff'], any: ['q03-wiederkehr', 'q09-schachtelpfad', 'q11-schleifenwache'], role: 'Gebietsaufgabe · Waldzugang' },
  'q05-aufmerksam': { region: 'forest', giver: 'lyra', all: ['q02-basisangriff'], role: 'Pflicht-Einführung · Bedingungen' },
  'q06-waechter': { region: 'forest', giver: 'lyra', all: ['q05-aufmerksam'], role: 'Wahlquest · Bedingter Kampf' },
  'q13-lichtpfad': { region: 'forest', giver: 'neria', all: ['q05-aufmerksam'], role: 'Wahlquest · Bedingtes Rätsel' },
  'q07-moosling': { region: 'forest', giver: 'tala', all: ['q05-aufmerksam'], role: 'Wahlreihe · Moosling' },
  'q08-team': { region: 'forest', giver: 'tala', all: ['q07-moosling'], role: 'Folgequest · Zwei Programme' },
  'q14-feuerprobe': { region: 'valley', giver: 'brann', all: ['q02-basisangriff'], role: 'Wahlquest · Feuer und Brandschaden' },
  'q15-wurzelschutz': { region: 'forest', giver: 'tala', all: ['q07-moosling'], role: 'Wahlquest · Unterstützung durch Ranken' },
  'q16-heilmoos': { region: 'forest', giver: 'tala', all: ['q07-moosling'], role: 'Wahlquest · Heilung über Zeit' },
  'q17-teamrollen': { region: 'forest', giver: 'tala', all: ['q08-team', 'q14-feuerprobe', 'q15-wurzelschutz', 'q16-heilmoos'], role: 'Folgequest · Aktiver Rollenkampf' },
};
export const requirementsMet = (id: LessonId, completed: readonly LessonId[]): boolean => {
  const route = QUEST_ROUTES[id]; return route.all.every((prior) => completed.includes(prior)) && (!route.any || route.any.some((prior) => completed.includes(prior)));
};
export const forestAccessible = (completed: readonly LessonId[], legacy = false): boolean => legacy || completed.includes('q12-steinrutsch');
export const giverLessons = (giver: QuestGiverId): LessonId[] => (Object.keys(QUEST_ROUTES) as LessonId[]).filter((id) => QUEST_ROUTES[id].giver === giver);
/** Keep valid independent branches; input order and catalog order never imply prerequisites. */
export function normalizeCompletions(saved: readonly LessonId[], legacyForest: boolean): LessonId[] {
  const accepted: LessonId[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of saved) if (!accepted.includes(id) && requirementsMet(id, accepted) && (QUEST_ROUTES[id].region === 'valley' || forestAccessible(accepted, legacyForest))) { accepted.push(id); changed = true; }
  }
  return accepted;
}
