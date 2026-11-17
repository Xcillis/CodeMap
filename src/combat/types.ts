import type { Facing } from './Movement';
export type CombatAction = 'CHILL' | 'EXTINGUISH_ENEMY' | 'EXTINGUISH_ALLY' | 'ATTACK' | 'MOVE_TOWARD' | 'MOVE_FORWARD' | 'MOVE_BACKWARD' | 'TURN_LEFT' | 'TURN_RIGHT' | 'MOVE_RIGHT' | 'MOVE_LEFT' | 'MOVE_UP' | 'MOVE_DOWN' | 'IGNITE' | 'VINE_SNARE' | 'HEALING_MOSS' | 'BARK_GUARD' | 'STONE_ARMOR' | 'COVER_ALLY' | 'WAIT';
export type AbilityEvidence = 'burn' | 'root' | 'heal' | 'guard' | 'cover' | 'combo' | 'cold' | 'freeze' | 'extinguish' | 'ice';
export type CombatRole = 'damage' | 'healing' | 'support' | 'tank';
export interface TimedEffect { remaining: number; source: ArkanId }
export interface CombatEffect { kind: AbilityEvidence | 'damage'; source: ArkanId; target: Combatant['id']; amount: number; text: string; tile?: GridPosition }
export type BattleOutcome = 'ongoing' | 'victory' | 'defeat' | 'incomplete';
export type ArkanId = 'moosling' | 'glutling' | 'felsbock' | 'frostmolch';
export type ProgramSources = Partial<Record<ArkanId, string>>;
export type ConditionId = 'enemyAdjacent' | 'pathRightClear' | 'pathAheadClear' | 'allyInjured' | 'enemyBurning' | 'enemyAlive' | 'enemyChilled' | 'enemyFrozen' | 'allyBurning' | 'waterAhead' | 'iceAhead';
export type ProgramNode =
  | { kind: 'action'; action: CombatAction }
  | { kind: 'repeat'; count: number; body: ProgramNode[] }
  | { kind: 'while'; condition: ConditionId; body: ProgramNode[] }
  | { kind: 'if'; condition?: ConditionId; then: ProgramNode[]; otherwise: ProgramNode[] };

export interface RepeatActionBlock {
  kind: 'action';
  count: number;
  action: CombatAction;
}

export interface RepeatConditionBlock {
  kind: 'condition';
  condition?: ConditionId;
  count: number;
  whenTrue: CombatAction;
  whenFalse: CombatAction;
}

export type ProgramBlock = RepeatActionBlock | RepeatConditionBlock;

export type ProgramStep =
  | { kind: 'action'; action: CombatAction }
  | { kind: 'condition'; condition?: ConditionId; whenTrue: CombatAction; whenFalse: CombatAction };

export interface GridPosition {
  x: number;
  y: number;
}

export interface Combatant extends GridPosition {
  facing?: Facing;
  id: ArkanId | 'konstrukt';
  name: string;
  hp: number;
  maxHp: number;
  attackPower?: number;
  guarding: boolean;
  burning?: TimedEffect;
  chilled?: TimedEffect;
  frozen?: TimedEffect;
  rooted?: TimedEffect;
  regeneration?: TimedEffect;
  protection?: TimedEffect;
  armor?: TimedEffect;
  coveredBy?: TimedEffect;
  cooldowns?: Partial<Record<CombatAction, number>>;
}

export interface BattleState {
  surfaces?: Surface[];
  tick: number;
  outcome: BattleOutcome;
  player: Combatant;
  companion?: Combatant;
  additionalAllies?: Combatant[];
  enemy: Combatant;
  log: string[];
  lessonTrial?: { current: number; total: number; title: string; passed: number; message: string };
  enemyIntent?: { target: ArkanId; damage: number };
}

export interface ActionPlanResult {
  sourceMap?: Record<string, number>;
  nodes?: ProgramNode[];
  actor?: ArkanId;
  steps?: ProgramStep[];
  blocks?: ProgramBlock[];
  error?: string;
}

export interface Surface extends GridPosition { kind: 'water' | 'ice'; shallow: boolean }
export interface LoopTrace { path: string; iteration: number; total: number; kind?: 'while' }
export interface ExecutionTrace {
  path: string;
  line?: number;
  loops: LoopTrace[];
  conditions: { path: string; value: boolean; condition?: ConditionId }[];
}
export interface PuzzleState extends Omit<BattleState, 'enemy' | 'companion'> {
  enemy?: undefined;
  companion?: undefined;
  goal: GridPosition;
  walls: GridPosition[];
  runes?: (GridPosition & { activated: boolean })[];
  runeMode?: 'rows' | 'safeguards';
}
export type EncounterState = BattleState | PuzzleState;

export interface ActionFrame<State extends EncounterState = BattleState> {
  actor: Combatant['id'];
  action: CombatAction;
  before: State;
  after: State;
  trace?: ExecutionTrace;
  effects?: CombatEffect[];
  periodic?: boolean;
}
