import type { CombatAction, GridPosition } from './types';

export const ACTIONS = {
  MOVE_TOWARD: { method: 'moveForward', block: 'cm_move', label: 'zum Gegner gehen' },
  ATTACK: { method: 'attack', block: 'cm_attack', label: 'angreifen' },
  MOVE_RIGHT: { method: 'moveRight', block: 'cm_move_right', label: 'gehe nach rechts' },
  MOVE_LEFT: { method: 'moveLeft', block: 'cm_move_left', label: 'gehe nach links' },
  MOVE_UP: { method: 'moveUp', block: 'cm_move_up', label: 'gehe nach oben' },
  MOVE_DOWN: { method: 'moveDown', block: 'cm_move_down', label: 'gehe nach unten' },
} as const satisfies Record<CombatAction, { method: string; block: string; label: string }>;

export function actionForCommand(command: string): CombatAction | undefined {
  return (Object.keys(ACTIONS) as CombatAction[]).find((action) => ACTIONS[action].method === command);
}
export function actionForBlock(block: string): CombatAction | undefined {
  return (Object.keys(ACTIONS) as CombatAction[]).find((action) => ACTIONS[action].block === block);
}
export function directionDelta(action: CombatAction): GridPosition | undefined {
  switch (action) {
    case 'MOVE_RIGHT': return { x: 1, y: 0 };
    case 'MOVE_LEFT': return { x: -1, y: 0 };
    case 'MOVE_UP': return { x: 0, y: -1 };
    case 'MOVE_DOWN': return { x: 0, y: 1 };
  }
}
