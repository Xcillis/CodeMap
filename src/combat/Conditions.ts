import type { ArkanId, ConditionId, EncounterState } from './types';

export function evaluateCondition(state: EncounterState, condition: ConditionId, actor: ArkanId = state.player.id as ArkanId): boolean {
  const unit = [state.player, state.companion].find((candidate) => candidate?.id === actor);
  if (!unit) return false;
  if (condition === 'enemyAdjacent') return Boolean(state.enemy && Math.abs(unit.x - state.enemy.x) + Math.abs(unit.y - state.enemy.y) === 1);
  const next = { x: unit.x + 1, y: unit.y };
  return next.x < 7 && !('walls' in state && state.walls.some((wall) => wall.x === next.x && wall.y === next.y))
    && ![state.player, state.companion, state.enemy].some((other) => other && other.id !== actor && other.x === next.x && other.y === next.y);
}
