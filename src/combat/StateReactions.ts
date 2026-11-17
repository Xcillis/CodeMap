import { facingOf, movementDelta } from './Movement';
import type { ArkanId, Combatant, GridPosition, Surface } from './types';

/** Prototype values shared by all species; a status belongs to its target, not its caster. */
export const REACTION_RULES = { burningStrikeDamage: 3, chilledSteps: 3, frozenActions: 1 } as const;
export function applyCold(target: Combatant, source: ArkanId): 'chilled' | 'frozen' {
  if (target.chilled) { delete target.chilled; target.frozen = { source, remaining: REACTION_RULES.frozenActions }; return 'frozen'; }
  if (target.frozen) return 'frozen';
  target.chilled = { source, remaining: REACTION_RULES.chilledSteps }; return 'chilled';
}
export function extinguish(target: Combatant): boolean { if (!target.burning) return false; delete target.burning; return true; }
export function fireStrike(target: Combatant, normalDamage: number): { power: number; consumed: boolean } {
  if (!target.burning) return { power: normalDamage, consumed: false };
  delete target.burning; return { power: REACTION_RULES.burningStrikeDamage, consumed: true };
}
export function freezeSurface(surface: Surface): boolean {
  if (surface.kind !== 'water' || !surface.shallow) return false;
  surface.kind = 'ice'; return true;
}
export const surfaceAt = (surfaces: readonly Surface[] | undefined, point: GridPosition): Surface | undefined => surfaces?.find((tile) => tile.x === point.x && tile.y === point.y);
export const surfaceBlocks = (surfaces: readonly Surface[] | undefined, point: GridPosition): boolean => surfaceAt(surfaces, point)?.kind === 'water';
export function surfaceAhead(unit: Combatant, surfaces?: readonly Surface[]): Surface | undefined {
  const delta = movementDelta('MOVE_FORWARD', facingOf(unit))!;
  return surfaceAt(surfaces, { x: unit.x + delta.x, y: unit.y + delta.y });
}
