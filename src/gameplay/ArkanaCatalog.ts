import type { ArkanId } from '../combat/types';

export type SkillId = 'moveForward' | 'attack' | 'enemyAdjacent' | 'repeat';
export type ArkanaType = 'fire' | 'water' | 'nature' | 'shadow' | 'light';

export const ARKANA_TYPES: Record<ArkanaType, { name: string; role: string }> = {
  fire: { name: 'Feuer', role: 'Schaden' },
  water: { name: 'Wasser', role: 'Kontrolle und Schutz' },
  nature: { name: 'Natur', role: 'Widerstandskraft und Heilung über Zeit' },
  shadow: { name: 'Schatten', role: 'Schwächung und gezielter Schaden' },
  light: { name: 'Licht', role: 'Sofortheilung und Unterstützung' },
};

export const SKILL_NAMES: Record<SkillId, string> = {
  moveForward: 'Vorwärts gehen', attack: 'Basisangriff', repeat: 'Wiederholen', enemyAdjacent: 'Gegnernähe abfragen',
};

export interface ArkanaSpecies {
  id: ArkanId;
  name: string;
  type: ArkanaType;
  maxHp: number;
  attack: number;
  strength: string;
  weakness: string;
  plannedAbilities: readonly string[];
  supported: readonly SkillId[];
}

/** First two prototype species. Special abilities are design previews, not executable commands. */
export const ARKANA_SPECIES: Record<ArkanId, ArkanaSpecies> = {
  moosling: {
    id: 'moosling', name: 'Moosling', type: 'nature', maxHp: 5, attack: 1,
    strength: 'Mit 5 Lebenspunkten widerstandsfähiger als Glutling.',
    weakness: 'Sein Basisangriff verursacht nur 1 Schaden.',
    plannedAbilities: ['Ranken wachsen lassen', 'Heilung über Zeit'],
    supported: ['moveForward', 'attack', 'repeat', 'enemyAdjacent'],
  },
  glutling: {
    id: 'glutling', name: 'Glutling', type: 'fire', maxHp: 4, attack: 2,
    strength: 'Sein Basisangriff verursacht 2 Schaden.',
    weakness: 'Mit 4 Lebenspunkten weniger widerstandsfähig als Moosling.',
    plannedAbilities: ['Entzünden', 'Fackeln entzünden und Eis auftauen'],
    supported: ['moveForward', 'attack', 'repeat', 'enemyAdjacent'],
  },
};

export interface OwnedArkana {
  id: string;
  speciesId: ArkanId;
  learned: SkillId[];
}

export const isArkanId = (value: unknown): value is ArkanId => value === 'moosling' || value === 'glutling';
export const instanceId = (species: ArkanId): string => `aetheria-${species}-01`;
export function startingSkills(perception: boolean): SkillId[] {
  return ['moveForward', 'attack', 'repeat', ...(perception ? ['enemyAdjacent' as const] : [])];
}
