import type { ArkanId, ProgramBlock, ProgramNode } from './types';
import { blocksToNodes, nodesToSource } from './DecisionProgram';
import { ARKANA_SPECIES, type SkillId } from '../gameplay/ArkanaCatalog';
import { ACTIONS } from './ActionCatalog';

export type { SkillId } from '../gameplay/ArkanaCatalog';
export type CommandCategory = 'movement' | 'combat' | 'senses' | 'flow';
export type CommandId = 'move' | 'attack' | 'condition' | 'repeat' | 'moveRight' | 'moveLeft' | 'moveUp' | 'moveDown';

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
    supported: ARKANA_SPECIES.moosling.supported,
    lessons: [
      { mission: 1, skills: ['moveForward', 'attack', 'repeat'] },
      { mission: 2, skills: ['enemyAdjacent'] },
    ],
  },
  glutling: {
    supported: ARKANA_SPECIES.glutling.supported,
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
  { id: 'move', category: 'movement', label: 'Zum Gegner gehen', description: 'Ein Feld zum Gegner. Belegte Felder blockieren die Bewegung.', requires: ['moveForward'], syntax: (actor) => `${actor}.moveForward()`, block: () => ({ kind: 'action', count: 1, action: 'MOVE_TOWARD' }) },
  ...(['MOVE_RIGHT', 'MOVE_LEFT', 'MOVE_UP', 'MOVE_DOWN'] as const).map((action): CommandDefinition => ({
    id: ACTIONS[action].method, category: 'movement', label: ACTIONS[action].label,
    description: 'Ein Rasterfeld in diese Richtung. Hindernisse und belegte Felder blockieren den Schritt.',
    requires: [ACTIONS[action].method], syntax: (actor) => `${actor}.${ACTIONS[action].method}()`,
    block: () => ({ kind: 'action', count: 1, action }),
  })),
  { id: 'attack', category: 'combat', label: 'Angreifen', description: 'Ein Basisangriff auf einen direkt benachbarten Gegner. Der Schaden hängt von der Art ab.', requires: ['attack'], syntax: (actor) => `${actor}.attack()`, block: () => ({ kind: 'action', count: 1, action: 'ATTACK' }) },
  { id: 'condition', category: 'senses', label: 'Gegner in der Nähe?', description: 'Prüft die Nachbarschaft und wählt zwischen Angriff und Bewegung.', requires: ['enemyAdjacent', 'attack', 'moveForward'], syntax: (actor) => `${actor}.enemyAdjacent`, block: () => ({ kind: 'condition', count: 1, whenTrue: 'ATTACK', whenFalse: 'MOVE_TOWARD' }) },
  { id: 'repeat', category: 'flow', label: 'Wiederhole … mal', description: 'Wiederholt die Befehle im Rumpf 1 bis 6 Mal. Füge die gewünschten Anweisungen im Inneren ein.', requires: ['repeat'], syntax: () => 'repeat(2, () => { … });', block: () => ({ kind: 'action', count: 2, action: 'MOVE_TOWARD' }) },
];

export function learnedSkills(actor: ArkanId, mission: number): readonly SkillId[] {
  return ARKAN_SKILLS[actor].lessons.filter((lesson) => lesson.mission <= mission).flatMap((lesson) => lesson.skills);
}

export function availableCommands(actor: ArkanId, mission: number, learned = learnedSkills(actor, mission)): readonly CommandDefinition[] {
  const supported = ARKAN_SKILLS[actor].supported;
  return COMMANDS.filter((command) => command.requires.every((skill) => supported.includes(skill) && learned.includes(skill)));
}

export function programCapabilityError(blocks: readonly ProgramBlock[], actor: ArkanId, mission: number): string | undefined {
  return nodesCapabilityError(blocksToNodes(blocks), actor, mission);
}

export function nodesCapabilityError(nodes: readonly ProgramNode[], actor: ArkanId, mission: number, learned = learnedSkills(actor, mission)): string | undefined {
  const supported = ARKAN_SKILLS[actor].supported;
  const required = new Set<SkillId>();
  const visit = (list: readonly ProgramNode[]): void => {
    for (const node of list) {
      if (node.kind === 'action') required.add(ACTIONS[node.action].method);
      else if (node.kind === 'repeat') { required.add('repeat'); visit(node.body); }
      else { required.add('enemyAdjacent'); visit(node.then); visit(node.otherwise); }
    }
  };
  visit(nodes);
  for (const skill of required) {
    if (!supported.includes(skill) || !learned.includes(skill)) return `${actor}: „${skill}“ ist hier noch nicht gelernt oder für diese Aufgabe nicht freigegeben.`;
  }
}

export function commandSource(command: CommandDefinition, actor: ArkanId): string {
  if (command.id === 'repeat') return nodesToSource([{ kind: 'repeat', count: 2, body: [] }], actor);
  const block = command.block();
  return nodesToSource(blocksToNodes([block]).flatMap((node) => node.kind === 'repeat' && node.count === 1 ? node.body : [node]), actor);
}
