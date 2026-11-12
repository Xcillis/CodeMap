import type { CombatAction, ProgramResult } from './types';

const ACTIONS: CombatAction[] = ['ATTACK', 'DEFEND', 'MOVE_TOWARD', 'WAIT'];

/**
 * M2 accepts a deliberately tiny JavaScript-shaped language. It recognizes only
 * a single return statement and never evaluates user input in the browser.
 */
export function parseDecisionProgram(source: string): ProgramResult {
  const match = source.match(/return\s+["'](ATTACK|DEFEND|MOVE_TOWARD|WAIT)["']\s*;/);
  if (!match || !ACTIONS.includes(match[1] as CombatAction)) {
    return { error: 'Erlaubt ist genau ein return mit ATTACK, DEFEND, MOVE_TOWARD oder WAIT.' };
  }
  return { action: match[1] as CombatAction };
}

export const DEFAULT_PROGRAM = `function chooseAction(state) {
  return "MOVE_TOWARD";
}`;
