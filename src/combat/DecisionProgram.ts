import type { ActionPlanResult, ArkanId, CombatAction, ProgramBlock, ProgramStep } from './types';

const MAX_REPEAT = 6;
const MAX_ACTIONS = 12;

/**
 * M2 accepts only fixed repeat blocks and builds an action list. User text is
 * parsed, never evaluated, so loops cannot freeze the browser.
 */
export function compileActionPlan(source: string, expectedActor?: ArkanId): ActionPlanResult {
  if (source.length > 8000) return { error: 'Das Programm ist zu lang (maximal 8000 Zeichen).' };
  if (!source.trim()) return { actor: expectedActor, steps: [], blocks: [] };
  const receivers = [...source.matchAll(/\b([A-Za-z_]\w*)\s*\./g)].map((match) => match[1]);
  const actor = receivers[0];
  if ((actor !== 'moosling' && actor !== 'glutling') || receivers.some((id) => id !== actor)) {
    return { error: 'Jedes Programm darf ausschließlich benannte Befehle eines einzelnen Arkanen enthalten.' };
  }
  if (expectedActor && actor !== expectedActor) return { error: `Dieses Programm gehört zu ${expectedActor}. Verwende ${expectedActor}.moveForward() oder ${expectedActor}.attack().` };
  source = source.replace(/\b(moosling|glutling)\s*\./g, 'moosling.');
  const blockPattern = /repeat\s*\(\s*(\d+)\s*,\s*\(\s*\)\s*=>\s*\{\s*(?:(?:moosling|glutling)\.(moveForward|attack)\s*\(\s*\)\s*;?|if\s*\(\s*moosling\.enemyAdjacent\s*\)\s*\{\s*moosling\.(moveForward|attack)\s*\(\s*\)\s*;?\s*\}\s*else\s*\{\s*moosling\.(moveForward|attack)\s*\(\s*\)\s*;?\s*\})\s*\}\s*\)\s*;?/gs;
  const steps: ProgramStep[] = [];
  const blocks: ProgramBlock[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(source)) !== null) {
    if (source.slice(cursor, match.index).trim()) return { error: 'Erwartet wird ein vollständiger repeat-Block mit benannten Arkan-Befehlen.' };
    const count = Number(match[1]);
    if (!Number.isInteger(count) || count < 1 || count > MAX_REPEAT) return { error: `Eine Schleife darf 1 bis ${MAX_REPEAT} Wiederholungen enthalten.` };
    if (match[2]) {
      const action = toAction(match[2]);
      blocks.push({ kind: 'action', count, action });
      steps.push(...Array.from({ length: count }, () => ({ kind: 'action' as const, action })));
    } else {
      const whenTrue = toAction(match[3]);
      const whenFalse = toAction(match[4]);
      blocks.push({ kind: 'condition', count, whenTrue, whenFalse });
      steps.push(...Array.from({ length: count }, () => ({ kind: 'condition' as const, whenTrue, whenFalse })));
    }
    cursor = blockPattern.lastIndex;
  }

  if (!steps.length || source.slice(cursor).trim()) {
    return { error: 'Befehle müssen einem Arkan zugeordnet sein, etwa moosling.moveForward() oder glutling.attack().' };
  }
  if (steps.length > MAX_ACTIONS) {
    return { error: `Ein Plan darf höchstens ${MAX_ACTIONS} Schritte enthalten.` };
  }
  return { actor, steps, blocks };
}

export function blocksToSource(blocks: readonly ProgramBlock[], actor: ArkanId = 'moosling'): string {
  return blocks.map((block) => {
    if (block.kind === 'action') return `repeat(${block.count}, () => {\n  moosling.${toCommand(block.action)}();\n});`;
    return `repeat(${block.count}, () => {\n  if (moosling.enemyAdjacent) {\n    moosling.${toCommand(block.whenTrue)}();\n  } else {\n    moosling.${toCommand(block.whenFalse)}();\n  }\n});`;
  }).join('\n\n').replace(/moosling\./g, `${actor}.`);
}

export const DEFAULT_PROGRAM = `repeat(3, () => {
  moosling.moveForward();
});

repeat(3, () => {
  moosling.attack();
});`;

export const CONDITION_PROGRAM = `repeat(6, () => {
  if (moosling.enemyAdjacent) {
    moosling.attack();
  } else {
    moosling.moveForward();
  }
});`;

export const FORMATION_PROGRAM = `repeat(4, () => {
  moosling.moveForward();
});

repeat(3, () => {
  moosling.attack();
});`;

function toAction(command: string): CombatAction {
  return command === 'moveForward' ? 'MOVE_TOWARD' : 'ATTACK';
}

function toCommand(action: CombatAction): 'moveForward' | 'attack' {
  return action === 'MOVE_TOWARD' ? 'moveForward' : 'attack';
}
