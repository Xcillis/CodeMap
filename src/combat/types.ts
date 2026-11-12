export type CombatAction = 'ATTACK' | 'MOVE_TOWARD';
export type BattleOutcome = 'ongoing' | 'victory' | 'defeat';

export interface GridPosition {
  x: number;
  y: number;
}

export interface Combatant extends GridPosition {
  id: 'moosling' | 'konstrukt';
  name: string;
  hp: number;
  maxHp: number;
  guarding: boolean;
}

export interface BattleState {
  tick: number;
  outcome: BattleOutcome;
  player: Combatant;
  enemy: Combatant;
  log: string[];
}

export interface ActionPlanResult {
  actions?: CombatAction[];
  error?: string;
}
