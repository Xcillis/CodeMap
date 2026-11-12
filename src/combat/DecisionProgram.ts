import type { BattleState, CombatAction, ProgramResult } from './types';

const ACTIONS: CombatAction[] = ['ATTACK', 'DEFEND', 'MOVE_TOWARD', 'WAIT'];

/**
 * M2 accepts a deliberately tiny JavaScript-shaped language. It recognizes only
 * a single return statement and never evaluates user input in the browser.
 */
export function chooseAction(source: string, state: Readonly<BattleState>): ProgramResult {
  const conditional = source.match(/if\s*\(\s*state\.enemyAdjacent\s*\)\s*\{\s*return\s+["'](ATTACK|DEFEND|MOVE_TOWARD|WAIT)["']\s*;?\s*\}\s*return\s+["'](ATTACK|DEFEND|MOVE_TOWARD|WAIT)["']\s*;?/s);
  if (conditional) {
    const [whenAdjacent, otherwise] = [conditional[1], conditional[2]] as CombatAction[];
    return { action: areAdjacent(state) ? whenAdjacent : otherwise };
  }
  const match = source.match(/return\s+["'](ATTACK|DEFEND|MOVE_TOWARD|WAIT)["']\s*;/);
  if (!match || !ACTIONS.includes(match[1] as CombatAction)) {
    return { error: 'Erlaubt ist genau ein return mit ATTACK, DEFEND, MOVE_TOWARD oder WAIT.' };
  }
  return { action: match[1] as CombatAction };
}

export const DEFAULT_PROGRAM = `function chooseAction(state) {
  if (state.enemyAdjacent) {
    return "ATTACK";
  }
  return "MOVE_TOWARD";
}`;

function areAdjacent(state: Readonly<BattleState>): boolean {
  return Math.abs(state.player.x - state.enemy.x) + Math.abs(state.player.y - state.enemy.y) === 1;
}
