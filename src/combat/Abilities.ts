import type { SkillId } from '../gameplay/ArkanaCatalog';
import type { ArkanId, BattleState, CombatAction, CombatEffect, CombatRole, Combatant } from './types';
import { partyMembers } from './Party';

export type AbilityAction = 'IGNITE' | 'VINE_SNARE' | 'HEALING_MOSS' | 'BARK_GUARD' | 'STONE_ARMOR' | 'COVER_ALLY';
export const ABILITIES: Record<AbilityAction, { skill: SkillId; role: CombatRole; range: number; cooldown: number; description: string }> = {
  STONE_ARMOR: { skill: 'stoneArmor', role: 'tank', range: 0, cooldown: 3, description: 'Natur / Fels · Fängt zwei Schritte lang pro Treffer bis zu 2 Schaden ab. Lenkt das Ziel des Gegners nicht um. Nach 3 Schritten wieder bereit.' },
  COVER_ALLY: { skill: 'coverAlly', role: 'tank', range: 3, cooldown: 3, description: 'Deckt zwei Schritte lang das andere lebende Arkana mit dem niedrigsten LP-Anteil in Reichweite 3 (bei Gleichstand Teamreihenfolge). Felsbock übernimmt dessen Treffer, solange es lebt und höchstens 3 Felder entfernt ist. Sein Steinpanzer kann den übernommenen Schaden abfangen. Nach 3 Schritten wieder bereit.' },
  IGNITE: { skill: 'ignite', role: 'damage', range: 3, cooldown: 3, description: 'Feuer · Reichweite 3. Sofort 1 Schaden und an drei Schrittenden je 1 Brandschaden. Erneut nach 3 Schritten bereit.' },
  VINE_SNARE: { skill: 'vineSnare', role: 'support', range: 3, cooldown: 3, description: 'Natur · Reichweite 3. Hält den Gegner zwei Schritte fest. Angreifen kann er weiterhin. Erneut nach 3 Schritten bereit.' },
  HEALING_MOSS: { skill: 'healingMoss', role: 'healing', range: 3, cooldown: 3, description: 'Natur · Heilt den verletzten lebenden Verbündeten mit dem niedrigsten LP-Anteil in Reichweite 3 an drei Schrittenden um je 1 LP. Erneut nach 3 Schritten bereit.' },
  BARK_GUARD: { skill: 'barkGuard', role: 'tank', range: 0, cooldown: 3, description: 'Natur · Zieht zwei Schritte lang gegnerische Angriffe auf sich und fängt pro Treffer bis zu 2 Schaden ab. Erneut nach 3 Schritten bereit.' },
};
export const isAbility = (action: CombatAction): action is AbilityAction => Object.hasOwn(ABILITIES, action);
export const distance = (a: Combatant, b: Combatant): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const allies = partyMembers;

/** Successful casts only: failed range/target checks neither consume cooldown nor overwrite existing effects. */
export function castAbility(state: BattleState, actor: Combatant, action: AbilityAction, log: (text: string) => void): CombatEffect[] {
  const rule = ABILITIES[action]; const source = actor.id as ArkanId;
  if ((actor.cooldowns?.[action] ?? 0) > 0) { log(`${actor.name}: Fähigkeit noch nicht bereit (${actor.cooldowns![action]} Schritte).`); return []; }
  const target = action === 'HEALING_MOSS' || action === 'COVER_ALLY' ? allies(state).filter((unit) => unit.hp > 0 && (action === 'COVER_ALLY' ? unit.id !== actor.id : unit.hp < unit.maxHp) && distance(actor, unit) <= rule.range)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] : action === 'BARK_GUARD' || action === 'STONE_ARMOR' ? actor : state.enemy;
  if (!target || target.hp <= 0) { log(`${actor.name}: Kein passendes lebendes Ziel.`); return []; }
  if (distance(actor, target) > rule.range) { log(`${actor.name}: Ziel außerhalb der Reichweite ${rule.range}.`); return []; }
  actor.cooldowns ??= {}; actor.cooldowns[action] = rule.cooldown;
  if (action === 'IGNITE') {
    const amount = Math.min(1, target.hp); target.hp -= amount; target.burning = { remaining: 3, source };
    const text = `${actor.name} entzündet ${target.name}: ${amount} Feuerschaden, Brand für 3 Schritte.`; log(text);
    return [{ kind: 'damage', source, target: target.id, amount, text }];
  }
  if (action === 'VINE_SNARE') { target.rooted = { remaining: 2, source }; log(`${actor.name}: Ranken halten ${target.name} für 2 Schritte fest.`); }
  if (action === 'HEALING_MOSS') { target.regeneration = { remaining: 3, source }; log(`${actor.name}: Heilmoos regeneriert ${target.name} für 3 Schritte.`); }
  if (action === 'BARK_GUARD') { target.protection = { remaining: 2, source }; target.guarding = true; log(`${actor.name}: Rindenwacht zieht Angriffe auf sich und schützt für 2 Schritte.`); }
  if (action === 'STONE_ARMOR') { target.armor = { remaining: 2, source }; log(`${actor.name}: Steinpanzer fängt für 2 Schritte bis zu 2 Schaden pro Treffer ab.`); }
  if (action === 'COVER_ALLY') { target.coveredBy = { remaining: 2, source }; log(`${actor.name} deckt ${target.name} für 2 Schritte in Reichweite 3.`); }
  return [];
}

export function cooldownStep(state: BattleState): void {
  for (const unit of allies(state)) for (const action of Object.keys(unit.cooldowns ?? {}) as CombatAction[]) {
    const remaining = (unit.cooldowns?.[action] ?? 0) - 1;
    if (remaining <= 0) delete unit.cooldowns![action]; else unit.cooldowns![action] = remaining;
  }
}
export function expireControl(state: BattleState): void {
  for (const unit of [...allies(state), state.enemy]) for (const status of ['rooted', 'protection', 'armor', 'coveredBy'] as const) {
    if (unit[status] && --unit[status]!.remaining <= 0) { delete unit[status]; if (status === 'protection') unit.guarding = false; }
  }
}
