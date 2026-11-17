import type { ArkanId, CombatRole } from '../combat/types';

export type SkillId = 'moveBackward' | 'turnLeft' | 'turnRight' | 'moveTowardEnemy' | 'pathAheadClear' | 'moveForward' | 'moveRight' | 'moveLeft' | 'moveUp' | 'moveDown' | 'attack' | 'enemyAdjacent' | 'repeat' | 'pathRightClear' | 'ignite' | 'vineSnare' | 'healingMoss' | 'barkGuard' | 'stoneArmor' | 'coverAlly' | 'wait' | 'allyInjured' | 'enemyBurning';
export const ROLE_NAMES: Record<CombatRole, string> = { damage: 'Schaden', healing: 'Heilung', support: 'Unterstützung', tank: 'Schutz / Tank' };
export const BASIC_MOVEMENT = ['moveForward', 'moveBackward', 'turnLeft', 'turnRight'] as const satisfies readonly SkillId[];
export type ArkanaType = 'fire' | 'water' | 'nature' | 'shadow' | 'light';

export const ARKANA_TYPES: Record<ArkanaType, { name: string; role: string }> = {
  fire: { name: 'Feuer', role: 'Schaden' },
  water: { name: 'Wasser', role: 'Kontrolle und Schutz' },
  nature: { name: 'Natur', role: 'Widerstandskraft und Heilung über Zeit' },
  shadow: { name: 'Schatten', role: 'Schwächung und gezielter Schaden' },
  light: { name: 'Licht', role: 'Sofortheilung und Unterstützung' },
};

export const SKILL_NAMES: Record<SkillId, string> = {
  moveForward: 'Vorwärts gehen', moveBackward: 'Rückwärts gehen', turnLeft: '90° nach links drehen', turnRight: '90° nach rechts drehen', moveTowardEnemy: 'Zum nächsten Gegner gehen', pathAheadClear: 'Weg voraus frei abfragen', attack: 'Artspezifischer Nahkampf', repeat: 'Wiederholen', enemyAdjacent: 'Gegnernähe abfragen',
  moveRight: 'Nach rechts gehen', moveLeft: 'Nach links gehen', moveUp: 'Nach oben gehen', moveDown: 'Nach unten gehen',
  pathRightClear: 'Weg rechts frei abfragen',
  stoneArmor: 'Steinpanzer', coverAlly: 'Verbündeten decken',
  ignite: 'Entzünden', vineSnare: 'Rankenfessel', healingMoss: 'Heilmoos', barkGuard: 'Rindenwacht', wait: 'Warten', allyInjured: 'Verletzten Verbündeten erkennen', enemyBurning: 'Brand erkennen',
};

export interface ArkanaSpecies {
  id: ArkanId;
  name: string;
  type: ArkanaType;
  maxHp: number;
  attack: number;
  basicAttack: { method: string; label: string };
  color: number;
  strength: string;
  weakness: string;
  plannedAbilities: readonly string[];
  supported: readonly SkillId[];
  roles: readonly CombatRole[];
}

/** Species capabilities never grant learned abilities automatically. */
export const ARKANA_SPECIES: Record<ArkanId, ArkanaSpecies> = {
  moosling: {
    id: 'moosling', name: 'Moosling', type: 'nature', maxHp: 5, attack: 1,
    basicAttack: { method: 'vineStrike', label: 'Rankenhieb' }, color: 0x63b76b,
    strength: 'Unterstützt das Team mit Rankenfessel und Heilung über Zeit.',
    weakness: 'Nur 1 Rankenhieb-Schaden und kein Panzerschutz. Ranken verhindern keine benachbarten Angriffe.',
    roles: ['healing', 'support'], plannedAbilities: ['Rankenbrücken in der Spielwelt'],
    supported: [...BASIC_MOVEMENT, 'moveTowardEnemy', 'pathAheadClear', 'moveRight', 'moveLeft', 'moveUp', 'moveDown', 'attack', 'repeat', 'enemyAdjacent', 'pathRightClear', 'vineSnare', 'healingMoss', 'wait', 'allyInjured'],
  },
  glutling: {
    id: 'glutling', name: 'Glutling', type: 'fire', maxHp: 4, attack: 2,
    basicAttack: { method: 'flameStrike', label: 'Glutstoß' }, color: 0xf29b4b,
    strength: 'Sein Glutstoß verursacht 2 Schaden. Entzünden ergänzt später anhaltenden Brandschaden.',
    weakness: 'Mit 4 Lebenspunkten weniger widerstandsfähig als Moosling.',
    roles: ['damage'], plannedAbilities: ['Fackeln entzünden und Eis auftauen'],
    supported: [...BASIC_MOVEMENT, 'moveTowardEnemy', 'pathAheadClear', 'moveRight', 'moveLeft', 'moveUp', 'moveDown', 'attack', 'repeat', 'enemyAdjacent', 'pathRightClear', 'ignite', 'wait', 'enemyBurning'],
  },
  felsbock: {
    id: 'felsbock', name: 'Felsbock', type: 'nature', maxHp: 8, attack: 1,
    basicAttack: { method: 'stoneStrike', label: 'Steinstoß' }, color: 0xa99b83,
    strength: '8 Lebenspunkte, Steinpanzer und Deckung für ein anderes Arkana machen es zum widerstandsfähigen Beschützer.',
    weakness: 'Sein Steinstoß verursacht nur 1 Schaden. Deckung übernimmt Schaden und braucht Heilung oder einen Steinpanzer.',
    roles: ['tank'], plannedAbilities: ['Felsen in der Spielwelt verschieben'],
    supported: [...BASIC_MOVEMENT, 'moveTowardEnemy', 'pathAheadClear', 'moveRight', 'moveLeft', 'moveUp', 'moveDown', 'attack', 'repeat', 'enemyAdjacent', 'pathRightClear', 'stoneArmor', 'coverAlly', 'wait', 'allyInjured'],
  },
};
export const ARKANA_IDS = Object.keys(ARKANA_SPECIES) as ArkanId[];

export interface OwnedArkana {
  id: string;
  speciesId: ArkanId;
  learned: SkillId[];
}

export const isArkanId = (value: unknown): value is ArkanId => typeof value === 'string' && Object.hasOwn(ARKANA_SPECIES, value);
export const instanceId = (species: ArkanId): string => `aetheria-${species}-01`;
export function startingSkills(): SkillId[] {
  return [...BASIC_MOVEMENT];
}
