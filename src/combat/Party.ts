import type { Combatant, EncounterState } from './types';

/** Stable program order. The first two fields remain compatible with existing saves and callers. */
export function partyMembers(state: Pick<EncounterState, 'player' | 'companion' | 'additionalAllies'>): Combatant[] {
  return [state.player, ...(state.companion ? [state.companion] : []), ...(state.additionalAllies ?? [])];
}
