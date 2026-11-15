import type { ArkanId, CombatRole } from '../combat/types';

export type SkillId = 'moveForward' | 'moveRight' | 'moveLeft' | 'moveUp' | 'moveDown' | 'attack' | 'enemyAdjacent' | 'repeat' | 'pathRightClear' | 'ignite' | 'vineSnare' | 'healingMoss' | 'barkGuard' | 'wait' | 'allyInjured' | 'enemyBurning';
export const ROLE_NAMES: Record<CombatRole, string> = { damage: 'Schaden', healing: 'Heilung', support: 'Unterstützung', tank: 'Schutz / Tank' };
export const BASIC_MOVEMENT = ['moveRight', 'moveLeft', 'moveUp', 'moveDown'] as const satisfies readonly SkillId[];
export type ArkanaType = 'fire' | 'water' | 'nature' | 'shadow' | 'light';

export const ARKANA_TYPES: Record<ArkanaType, { name: string; role: string }> = {
  fire: { name: 'Feuer', role: 'Schaden' },
  water: { name: 'Wasser', role: 'Kontrolle und Schutz' },
  nature: { name: 'Natur', role: 'Widerstandskraft und Heilung über Zeit' },
  shadow: { name: 'Schatten', role: 'Schwächung und gezielter Schaden' },
  light: { name: 'Licht', role: 'Sofortheilung und Unterstützung' },
};

export const SKILL_NAMES: Record<SkillId, string> = {
  moveForward: 'Zum nächsten Gegner gehen', attack: 'Artspezifischer Nahkampf', repeat: 'Wiederholen', enemyAdjacent: 'Gegnernähe abfragen',
  moveRight: 'Nach rechts gehen', moveLeft: 'Nach links gehen', moveUp: 'Nach oben gehen', moveDown: 'Nach unten gehen',
  pathRightClear: 'Weg rechts frei abfragen',
  ignite: 'Entzünden', vineSnare: 'Rankenfessel', healingMoss: 'Heilmoos', barkGuard: 'Rindenwacht', wait: 'Warten', allyInjured: 'Verletzten Verbündeten erkennen', enemyBurning: 'Brand erkennen',
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
  roles: readonly CombatRole[];
}

/** First two species; supported abilities still require explicit learning before world-quest use. */
export const ARKANA_SPECIES: Record<ArkanId, ArkanaSpecies> = {
  moosling: {
    id: 'moosling', name: 'Moosling', type: 'nature', maxHp: 5, attack: 1,
    strength: 'Mit 5 Lebenspunkten widerstandsfähiger als Glutling.',
    weakness: 'Sein Rankenhieb verursacht nur 1 Schaden; Heilung und Schutz brauchen Zeit.',
    roles: ['healing', 'support', 'tank'], plannedAbilities: ['Rankenbrücken in der Spielwelt'],
    supported: ['moveForward', 'moveRight', 'moveLeft', 'moveUp', 'moveDown', 'attack', 'repeat', 'enemyAdjacent', 'pathRightClear', 'vineSnare', 'healingMoss', 'barkGuard', 'wait', 'allyInjured'],
  },
  glutling: {
    id: 'glutling', name: 'Glutling', type: 'fire', maxHp: 4, attack: 2,
    strength: 'Sein Glutstoß verursacht 2 Schaden. Entzünden ergänzt später anhaltenden Brandschaden.',
    weakness: 'Mit 4 Lebenspunkten weniger widerstandsfähig als Moosling.',
    roles: ['damage'], plannedAbilities: ['Fackeln entzünden und Eis auftauen'],
    supported: ['moveForward', 'moveRight', 'moveLeft', 'moveUp', 'moveDown', 'attack', 'repeat', 'enemyAdjacent', 'pathRightClear', 'ignite', 'wait', 'enemyBurning'],
  },
};

export interface OwnedArkana {
  id: string;
  speciesId: ArkanId;
  learned: SkillId[];
}

export const isArkanId = (value: unknown): value is ArkanId => value === 'moosling' || value === 'glutling';
export const instanceId = (species: ArkanId): string => `aetheria-${species}-01`;
export function startingSkills(): SkillId[] {
  return [...BASIC_MOVEMENT];
}
