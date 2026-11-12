import { describe, expect, it } from 'vitest';
import { BattleEngine } from './BattleEngine';
import { chooseAction } from './DecisionProgram';

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

describe('chooseAction', () => {
  it('wertet eine sichtbare Nachbarschaftsbedingung ohne Codeausführung aus', () => {
    const battle = new BattleEngine();
    const source = 'if (state.enemyAdjacent) { return "ATTACK"; } return "MOVE_TOWARD";';
    expect(chooseAction(source, battle.snapshot).action).toBe('MOVE_TOWARD');
    battle.runRound('MOVE_TOWARD');
    battle.runRound('MOVE_TOWARD');
    expect(chooseAction(source, battle.snapshot).action).toBe('ATTACK');
  });

  it('lehnt fremde Browser-APIs ab', () => {
    const battle = new BattleEngine();
    expect(chooseAction('return window.alert("x");', battle.snapshot).error).toBeDefined();
  });
});
