import type { ActionPlanResult, CombatAction, LoopBlock } from './types';

const ACTIONS: CombatAction[] = ['ATTACK', 'MOVE_TOWARD'];
const MAX_REPEAT = 6;
const MAX_ACTIONS = 12;

/**
 * M2 accepts only fixed repeat blocks and builds an action list. User text is
 * parsed, never evaluated, so loops cannot freeze the browser.
 */
export function compileActionPlan(source: string): ActionPlanResult {
  const blockPattern = /repeat\s*\(\s*(\d+)\s*,\s*\(\s*\)\s*=>\s*\{\s*(moveToward|attack)\s*\(\s*\)\s*;?\s*\}\s*\)\s*;?/g;
  const actions: CombatAction[] = [];
  const blocks: LoopBlock[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(source)) !== null) {
    if (source.slice(cursor, match.index).trim()) return { error: 'Verwende nur repeat(n, () => { moveToward(); }) oder repeat(n, () => { attack(); }).' };
    const count = Number(match[1]);
    if (!Number.isInteger(count) || count < 1 || count > MAX_REPEAT) return { error: `Eine Schleife darf 1 bis ${MAX_REPEAT} Wiederholungen enthalten.` };
    const action = match[2] === 'moveToward' ? 'MOVE_TOWARD' : 'ATTACK';
    blocks.push({ count, action });
    actions.push(...Array.from({ length: count }, () => action));
    cursor = blockPattern.lastIndex;
  }

  if (!actions.length || source.slice(cursor).trim()) {
    return { error: 'Beginne mit einer repeat-Schleife und nutze moveToward() oder attack().' };
  }
  if (actions.length > MAX_ACTIONS) {
    return { error: `Ein Plan darf höchstens ${MAX_ACTIONS} Schritte enthalten.` };
  }
  return { actions, blocks };
}

export function blocksToSource(blocks: readonly LoopBlock[]): string {
  return blocks.map((block) => {
    const command = block.action === 'MOVE_TOWARD' ? 'moveToward' : 'attack';
    return `repeat(${block.count}, () => {\n  ${command}();\n});`;
  }).join('\n\n');
}

export const DEFAULT_PROGRAM = `repeat(3, () => {
  moveToward();
});

repeat(3, () => {
  attack();
});`;
