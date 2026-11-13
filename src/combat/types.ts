export type CombatAction = 'ATTACK' | 'MOVE_TOWARD' | 'MOVE_RIGHT' | 'MOVE_LEFT' | 'MOVE_UP' | 'MOVE_DOWN';
export type BattleOutcome = 'ongoing' | 'victory' | 'defeat' | 'incomplete';
export type ArkanId = 'moosling' | 'glutling';
export type ProgramSources = Partial<Record<ArkanId, string>>;
export type ProgramNode =
  | { kind: 'action'; action: CombatAction }
  | { kind: 'repeat'; count: number; body: ProgramNode[] }
  | { kind: 'if'; then: ProgramNode[]; otherwise: ProgramNode[] };

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
  id: 'moosling' | 'glutling' | 'konstrukt';
  name: string;
  hp: number;
  maxHp: number;
  attackPower?: number;
  guarding: boolean;
}

export interface BattleState {
  tick: number;
  outcome: BattleOutcome;
  player: Combatant;
  companion?: Combatant;
  enemy: Combatant;
  log: string[];
}

export interface ActionPlanResult {
  sourceMap?: Record<string, number>;
  nodes?: ProgramNode[];
  actor?: ArkanId;
  steps?: ProgramStep[];
  blocks?: ProgramBlock[];
  error?: string;
}

export interface LoopTrace { path: string; iteration: number; total: number }
export interface ExecutionTrace {
  path: string;
  line?: number;
  loops: LoopTrace[];
  conditions: { path: string; value: boolean }[];
}
export interface PuzzleState extends Omit<BattleState, 'enemy' | 'companion'> {
  enemy?: undefined;
  companion?: undefined;
  goal: GridPosition;
  walls: GridPosition[];
}
export type EncounterState = BattleState | PuzzleState;

export interface ActionFrame<State extends EncounterState = BattleState> {
  actor: Combatant['id'];
  action: CombatAction;
  before: State;
  after: State;
  trace?: ExecutionTrace;
}
