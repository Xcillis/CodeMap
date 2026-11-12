export type CombatAction = 'ATTACK' | 'MOVE_TOWARD';
export type BattleOutcome = 'ongoing' | 'victory' | 'defeat';

export interface RepeatActionBlock {
  kind: 'action';
  count: number;
  action: CombatAction;
}

export interface RepeatConditionBlock {
  kind: 'condition';
  count: number;
  whenTrue: CombatAction;
  whenFalse: CombatAction;
}

export type ProgramBlock = RepeatActionBlock | RepeatConditionBlock;

export type ProgramStep =
  | { kind: 'action'; action: CombatAction }
  | { kind: 'condition'; whenTrue: CombatAction; whenFalse: CombatAction };

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
  steps?: ProgramStep[];
  blocks?: ProgramBlock[];
  error?: string;
}
