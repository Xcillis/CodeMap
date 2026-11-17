import type { CombatAction, Combatant, GridPosition } from './types';

export const FACINGS = ['east', 'south', 'west', 'north'] as const;
export type Facing = typeof FACINGS[number];
export const FACING_LABELS: Record<Facing, string> = { east: '→ rechts', south: '↓ unten', west: '← links', north: '↑ oben' };
export const facingOf = (unit: Pick<Combatant, 'facing'>): Facing => unit.facing ?? 'east';
export const isTurn = (action: CombatAction): boolean => action === 'TURN_LEFT' || action === 'TURN_RIGHT';
export function turnFacing(facing: Facing, action: CombatAction): Facing {
  return FACINGS[(FACINGS.indexOf(facing) + (action === 'TURN_LEFT' ? 3 : 1)) % 4];
}
export function movementDelta(action: CombatAction, facing: Facing = 'east'): GridPosition | undefined {
  const direction = { east: { x: 1, y: 0 }, south: { x: 0, y: 1 }, west: { x: -1, y: 0 }, north: { x: 0, y: -1 } }[facing];
  if (action === 'MOVE_FORWARD') return { ...direction };
  if (action === 'MOVE_BACKWARD') return { x: -direction.x, y: -direction.y };
  // Compatibility for saved pre-orientation programs; these actions are absent from new palettes.
  if (action === 'MOVE_RIGHT') return { x: 1, y: 0 };
  if (action === 'MOVE_LEFT') return { x: -1, y: 0 };
  if (action === 'MOVE_UP') return { x: 0, y: -1 };
  if (action === 'MOVE_DOWN') return { x: 0, y: 1 };
}
