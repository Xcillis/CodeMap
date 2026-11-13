import type { ArkanId } from '../combat/types';
import type { CampaignState } from './Campaign';
import type { LessonId } from './WorldQuests';

export interface ArkanaEncounter { id: ArkanId; name: string; x: number; y: number; color: number; afterLesson?: LessonId }

/** Encounter availability never grants ownership; the player still has to find and recruit. */
export const ARKANA_ENCOUNTERS: readonly ArkanaEncounter[] = [
  { id: 'glutling', name: 'Glutling', x: 600, y: 650, color: 0xef934a },
  { id: 'moosling', name: 'Moosling', x: 1450, y: 915, color: 0x78bc69, afterLesson: 'q05-aufmerksam' },
];

export function encounterUnlocked(state: CampaignState, species: ArkanId): boolean {
  const encounter = ARKANA_ENCOUNTERS.find((item) => item.id === species);
  return Boolean(encounter && (!encounter.afterLesson || state.completed.includes(encounter.afterLesson)));
}
export function availableArkanaEncounters(state: CampaignState): readonly ArkanaEncounter[] {
  return ARKANA_ENCOUNTERS.filter((encounter) => encounterUnlocked(state, encounter.id) && !state.owned.some((owned) => owned.speciesId === encounter.id));
}
