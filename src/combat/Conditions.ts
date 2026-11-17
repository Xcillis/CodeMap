import { partyMembers } from './Party';
import type { ArkanId, ConditionId, EncounterState } from './types';
import { facingOf, movementDelta } from './Movement';
import { surfaceAhead, surfaceBlocks } from './StateReactions';

export function evaluateCondition(state: EncounterState, condition: ConditionId, actor: ArkanId = state.player.id as ArkanId): boolean {
  const unit = partyMembers(state).find((candidate) => candidate?.id === actor);
  if (!unit) return false;
  if (condition === 'enemyAlive') return Boolean(state.enemy && state.enemy.hp > 0);
  if (condition === 'enemyChilled') return Boolean(state.enemy?.chilled);
  if (condition === 'enemyFrozen') return Boolean(state.enemy?.frozen);
  if (condition === 'allyBurning') return partyMembers(state).some((ally) => ally.hp > 0 && ally.burning && Math.abs(unit.x - ally.x) + Math.abs(unit.y - ally.y) <= 3);
  if (condition === 'waterAhead' || condition === 'iceAhead') return surfaceAhead(unit, state.surfaces)?.kind === (condition === 'waterAhead' ? 'water' : 'ice');
  if (condition === 'enemyAdjacent') return Boolean(state.enemy && Math.abs(unit.x - state.enemy.x) + Math.abs(unit.y - state.enemy.y) === 1);
  if (condition === 'enemyBurning') return Boolean(state.enemy?.burning);
  if (condition === 'allyInjured') return partyMembers(state).some((ally) => ally && ally.hp > 0 && ally.hp < ally.maxHp && Math.abs(unit.x - ally.x) + Math.abs(unit.y - ally.y) <= 3);
  const delta = condition === 'pathAheadClear' ? movementDelta('MOVE_FORWARD', facingOf(unit))! : { x: 1, y: 0 };
  const next = { x: unit.x + delta.x, y: unit.y + delta.y };
  return next.x >= 0 && next.y >= 0 && next.x < 7 && next.y < 7 && !surfaceBlocks(state.surfaces, next) && !('walls' in state && state.walls.some((wall) => wall.x === next.x && wall.y === next.y))
    && ![...partyMembers(state), state.enemy].some((other) => other && other.id !== actor && other.x === next.x && other.y === next.y);
}
