import { partyMembers } from './Party';
import { ACTIONS } from './ActionCatalog';
import type { CombatAction, Combatant, EncounterState } from './types';

export function statusLabels(unit: Combatant): string[] {
  return (['burning', 'rooted', 'regeneration', 'protection', 'armor', 'coveredBy'] as const).flatMap((key) => unit[key] ? [`${{ burning: 'Brand', rooted: 'Ranken', regeneration: 'Heilmoos', protection: 'Rindenschutz', armor: 'Steinpanzer', coveredBy: 'In Deckung' }[key]}: ${unit[key]!.remaining}`] : []);
}
export function cooldownLabels(unit: Combatant): string[] {
  return (Object.keys(unit.cooldowns ?? {}) as CombatAction[]).filter((action) => (unit.cooldowns?.[action] ?? 0) > 0).map((action) => `${ACTIONS[action].label}: ${unit.cooldowns![action]}`);
}
export function intentLabel(state: EncounterState): string {
  const intent = state.enemyIntent;
  if (!intent || state.outcome !== 'ongoing') return '';
  const target = partyMembers(state).find((unit) => unit?.id === intent.target);
  return `${target?.coveredBy ? `Deckung durch ${target.coveredBy.source} (max. 3 Felder). ` : ''}Absicht des Wächters: ${target?.name ?? intent.target} verfolgen oder benachbart angreifen (${intent.damage} Schaden vor Schutz).`;
}
