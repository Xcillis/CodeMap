import type { ArkanId, CombatAction, GridPosition } from './types';

export const ACTIONS = {
  MOVE_TOWARD: { method: 'moveForward', block: 'cm_move', label: 'zum nächsten Gegner gehen' },
  ATTACK: { method: 'attack', block: 'cm_attack', label: 'angreifen' },
  MOVE_RIGHT: { method: 'moveRight', block: 'cm_move_right', label: 'gehe nach rechts' },
  MOVE_LEFT: { method: 'moveLeft', block: 'cm_move_left', label: 'gehe nach links' },
  MOVE_UP: { method: 'moveUp', block: 'cm_move_up', label: 'gehe nach oben' },
  MOVE_DOWN: { method: 'moveDown', block: 'cm_move_down', label: 'gehe nach unten' },
  IGNITE: { method: 'ignite', block: 'cm_ignite', label: 'entzünden' },
  VINE_SNARE: { method: 'vineSnare', block: 'cm_vine_snare', label: 'Rankenfessel' },
  HEALING_MOSS: { method: 'healingMoss', block: 'cm_healing_moss', label: 'Heilmoos' },
  BARK_GUARD: { method: 'barkGuard', block: 'cm_bark_guard', label: 'Rindenwacht' },
  WAIT: { method: 'wait', block: 'cm_wait', label: 'warten' },
} as const satisfies Record<CombatAction, { method: string; block: string; label: string }>;

export function actionForCommand(command: string, actor?: ArkanId): CombatAction | undefined {
  if (command === 'flameStrike') return actor === 'glutling' ? 'ATTACK' : undefined;
  if (command === 'vineStrike') return actor === 'moosling' ? 'ATTACK' : undefined;
  return (Object.keys(ACTIONS) as CombatAction[]).find((action) => ACTIONS[action].method === command);
}
export const actionMethod = (action: CombatAction, actor: ArkanId): string => action === 'ATTACK' ? actor === 'glutling' ? 'flameStrike' : 'vineStrike' : ACTIONS[action].method;
export const actionLabel = (action: CombatAction, actor: ArkanId): string => action === 'ATTACK' ? actor === 'glutling' ? 'Glutstoß' : 'Rankenhieb' : ACTIONS[action].label;
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
