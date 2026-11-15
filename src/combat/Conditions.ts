import { partyMembers } from './Party';
import type { ArkanId, ConditionId, EncounterState } from './types';

export function evaluateCondition(state: EncounterState, condition: ConditionId, actor: ArkanId = state.player.id as ArkanId): boolean {
  const unit = partyMembers(state).find((candidate) => candidate?.id === actor);
  if (!unit) return false;
  if (condition === 'enemyAdjacent') return Boolean(state.enemy && Math.abs(unit.x - state.enemy.x) + Math.abs(unit.y - state.enemy.y) === 1);
  if (condition === 'enemyBurning') return Boolean(state.enemy?.burning);
  if (condition === 'allyInjured') return partyMembers(state).some((ally) => ally && ally.hp > 0 && ally.hp < ally.maxHp && Math.abs(unit.x - ally.x) + Math.abs(unit.y - ally.y) <= 3);
  const next = { x: unit.x + 1, y: unit.y };
  return next.x < 7 && !('walls' in state && state.walls.some((wall) => wall.x === next.x && wall.y === next.y))
    && ![...partyMembers(state), state.enemy].some((other) => other && other.id !== actor && other.x === next.x && other.y === next.y);
}
