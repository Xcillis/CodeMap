export type CombatAction = 'ATTACK' | 'DEFEND' | 'MOVE_TOWARD' | 'WAIT';
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
  round: number;
  outcome: BattleOutcome;
  player: Combatant;
  enemy: Combatant;
  log: string[];
}

export interface ProgramResult {
  action?: CombatAction;
  error?: string;
}
