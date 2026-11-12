import { describe, expect, it } from 'vitest';
import { BattleEngine } from './BattleEngine';
import { parseDecisionProgram } from './DecisionProgram';

describe('BattleEngine', () => {
  it('führt identische Runden deterministisch aus', () => {
    const first = new BattleEngine();
    const second = new BattleEngine();

    first.runRound('MOVE_TOWARD');
    second.runRound('MOVE_TOWARD');

    expect(first.snapshot).toEqual(second.snapshot);
  });

  it('lässt Moosling das Konstrukt nach drei Treffern besiegen', () => {
    const battle = new BattleEngine();
    battle.runRound('MOVE_TOWARD');
    battle.runRound('MOVE_TOWARD');
    battle.runRound('ATTACK');
    battle.runRound('ATTACK');
    const result = battle.runRound('ATTACK');

    expect(result.outcome).toBe('victory');
    expect(result.enemy.hp).toBe(0);
  });
});

describe('parseDecisionProgram', () => {
  it('liest ausschließlich erlaubte Aktionen aus', () => {
    expect(parseDecisionProgram('function chooseAction() { return "ATTACK"; }').action).toBe('ATTACK');
    expect(parseDecisionProgram('return window.alert("x");').error).toBeDefined();
  });
});
