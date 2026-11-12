import type { ActionPlanResult, CombatAction, ProgramBlock, ProgramStep } from './types';

const ACTIONS: CombatAction[] = ['ATTACK', 'MOVE_TOWARD'];
const MAX_REPEAT = 6;
const MAX_ACTIONS = 12;

/**
 * M2 accepts only fixed repeat blocks and builds an action list. User text is
 * parsed, never evaluated, so loops cannot freeze the browser.
 */
export function compileActionPlan(source: string): ActionPlanResult {
  const blockPattern = /repeat\s*\(\s*(\d+)\s*,\s*\(\s*\)\s*=>\s*\{\s*(?:(moveToward|attack)\s*\(\s*\)\s*;?|if\s*\(\s*state\.enemyAdjacent\s*\)\s*\{\s*(moveToward|attack)\s*\(\s*\)\s*;?\s*\}\s*else\s*\{\s*(moveToward|attack)\s*\(\s*\)\s*;?\s*\})\s*\}\s*\)\s*;?/gs;
  const steps: ProgramStep[] = [];
  const blocks: ProgramBlock[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(source)) !== null) {
    if (source.slice(cursor, match.index).trim()) return { error: 'Verwende nur repeat(n, () => { moveToward(); }) oder repeat(n, () => { attack(); }).' };
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
    return { error: 'Beginne mit einer repeat-Schleife und nutze moveToward() oder attack().' };
  }
  if (steps.length > MAX_ACTIONS) {
    return { error: `Ein Plan darf höchstens ${MAX_ACTIONS} Schritte enthalten.` };
  }
  return { steps, blocks };
}

export function blocksToSource(blocks: readonly ProgramBlock[]): string {
  return blocks.map((block) => {
    if (block.kind === 'action') return `repeat(${block.count}, () => {\n  ${toCommand(block.action)}();\n});`;
    return `repeat(${block.count}, () => {\n  if (state.enemyAdjacent) {\n    ${toCommand(block.whenTrue)}();\n  } else {\n    ${toCommand(block.whenFalse)}();\n  }\n});`;
  }).join('\n\n');
}

export const DEFAULT_PROGRAM = `repeat(3, () => {
  moveToward();
});

repeat(3, () => {
  attack();
});`;

export const CONDITION_PROGRAM = `repeat(6, () => {
  if (state.enemyAdjacent) {
    attack();
  } else {
    moveToward();
  }
});`;

export const FORMATION_PROGRAM = `repeat(4, () => {
  moveToward();
});

repeat(3, () => {
  attack();
});`;

function toAction(command: string): CombatAction {
  return command === 'moveToward' ? 'MOVE_TOWARD' : 'ATTACK';
}

function toCommand(action: CombatAction): 'moveToward' | 'attack' {
  return action === 'MOVE_TOWARD' ? 'moveToward' : 'attack';
}
