import type { ArkanId, ProgramBlock } from './types';
import { blocksToSource } from './DecisionProgram';

export type SkillId = 'moveForward' | 'attack' | 'enemyAdjacent' | 'repeat';
export type CommandCategory = 'movement' | 'combat' | 'senses' | 'flow';
export type CommandId = 'move' | 'attack' | 'condition' | 'repeat';

export const COMMAND_CATEGORIES: readonly { id: CommandCategory; label: string; color: string }[] = [
  { id: 'movement', label: 'Bewegung', color: '#559cf0' },
  { id: 'combat', label: 'Kampf', color: '#db7767' },
  { id: 'senses', label: 'Wahrnehmung', color: '#ad8aeb' },
  { id: 'flow', label: 'Ablauf', color: '#e1b64e' },
];

/** Species capabilities and training unlocks are deliberately separate. */
export const ARKAN_SKILLS: Record<ArkanId, {
  supported: readonly SkillId[];
  lessons: readonly { mission: number; skills: readonly SkillId[] }[];
}> = {
  moosling: {
    supported: ['moveForward', 'attack', 'enemyAdjacent', 'repeat'],
    lessons: [
      { mission: 1, skills: ['moveForward', 'attack', 'repeat'] },
      { mission: 2, skills: ['enemyAdjacent'] },
    ],
  },
  glutling: {
    supported: ['moveForward', 'attack', 'enemyAdjacent', 'repeat'],
    lessons: [{ mission: 3, skills: ['moveForward', 'attack', 'repeat'] }],
  },
};

export interface CommandDefinition {
  id: CommandId;
  category: CommandCategory;
  label: string;
  description: string;
  requires: readonly SkillId[];
  syntax: (actor: ArkanId) => string;
  block: () => ProgramBlock;
}

export const COMMANDS: readonly CommandDefinition[] = [
  { id: 'move', category: 'movement', label: 'Zum Gegner gehen', description: 'Ein Feld zum Gegner. Belegte Felder blockieren die Bewegung.', requires: ['repeat', 'moveForward'], syntax: (actor) => `${actor}.moveForward()`, block: () => ({ kind: 'action', count: 1, action: 'MOVE_TOWARD' }) },
  { id: 'attack', category: 'combat', label: 'Angreifen', description: 'Ein Schadenspunkt, wenn der Gegner direkt neben dem Arkan steht.', requires: ['repeat', 'attack'], syntax: (actor) => `${actor}.attack()`, block: () => ({ kind: 'action', count: 1, action: 'ATTACK' }) },
  { id: 'condition', category: 'senses', label: 'Gegner in der Nähe?', description: 'Prüft vor jeder Aktion die Nähe: angreifen, sonst zum Gegner gehen.', requires: ['repeat', 'enemyAdjacent', 'attack', 'moveForward'], syntax: (actor) => `${actor}.enemyAdjacent`, block: () => ({ kind: 'condition', count: 1, whenTrue: 'ATTACK', whenFalse: 'MOVE_TOWARD' }) },
  { id: 'repeat', category: 'flow', label: 'Wiederhole … mal', description: 'Wiederholt eine Aktion 1 bis 6 Mal. Starte mit einem Bewegungsschritt und wähle die Anzahl im Block.', requires: ['repeat', 'moveForward'], syntax: () => 'repeat(3, () => { … });', block: () => ({ kind: 'action', count: 3, action: 'MOVE_TOWARD' }) },
];

export function learnedSkills(actor: ArkanId, mission: number): readonly SkillId[] {
  return ARKAN_SKILLS[actor].lessons.filter((lesson) => lesson.mission <= mission).flatMap((lesson) => lesson.skills);
}

export function availableCommands(actor: ArkanId, mission: number, learned = learnedSkills(actor, mission)): readonly CommandDefinition[] {
  const supported = ARKAN_SKILLS[actor].supported;
  return COMMANDS.filter((command) => command.requires.every((skill) => supported.includes(skill) && learned.includes(skill)));
}

export function programCapabilityError(blocks: readonly ProgramBlock[], actor: ArkanId, mission: number): string | undefined {
  const supported = ARKAN_SKILLS[actor].supported;
  const learned = learnedSkills(actor, mission);
  const required = new Set<SkillId>(['repeat']);
  for (const block of blocks) {
    if (block.kind === 'condition') required.add('enemyAdjacent');
    const actions = block.kind === 'action' ? [block.action] : [block.whenTrue, block.whenFalse];
    for (const action of actions) required.add(action === 'ATTACK' ? 'attack' : 'moveForward');
  }
  for (const skill of required) {
    if (!supported.includes(skill) || !learned.includes(skill)) return `${actor} hat „${skill}“ in dieser Mission noch nicht gelernt.`;
  }
}

export function commandSource(command: CommandDefinition, actor: ArkanId): string {
  return blocksToSource([command.block()], actor);
}
