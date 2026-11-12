import { describe, expect, it } from 'vitest';
import { BattleEngine } from './BattleEngine';
import { blocksToSource, compileActionPlan } from './DecisionProgram';

describe('BattleEngine', () => {
  it('führt identische Runden deterministisch aus', () => {
    const first = new BattleEngine();
    const second = new BattleEngine();

    first.runStep('MOVE_TOWARD');
    second.runStep('MOVE_TOWARD');

    expect(first.snapshot).toEqual(second.snapshot);
  });

  it('lässt Moosling nach einem Schleifenplan das Konstrukt besiegen', () => {
    const battle = new BattleEngine();
    ['MOVE_TOWARD', 'MOVE_TOWARD', 'MOVE_TOWARD', 'ATTACK', 'ATTACK', 'ATTACK'].forEach((action) => battle.runStep(action as 'MOVE_TOWARD' | 'ATTACK'));
    const result = battle.snapshot;

    expect(result.outcome).toBe('victory');
    expect(result.enemy.hp).toBe(0);
  });

  it('führt eine Duo-Formation in stabiler Reihenfolge aus', () => {
    const battle = new BattleEngine();
    battle.reset(true, 5);

    for (let index = 0; index < 4; index += 1) battle.runStep('MOVE_TOWARD', false, true);
    for (let index = 0; index < 3; index += 1) battle.runStep('ATTACK', false, true);

    expect(battle.snapshot.companion?.name).toBe('Glutling');
    expect(battle.snapshot.outcome).toBe('victory');
  });
});

describe('compileActionPlan', () => {
  it('übersetzt repeat-Blöcke in einen begrenzten Aktionsplan', () => {
    const source = 'repeat(2, () => { moveToward(); }); repeat(3, () => { attack(); });';
    expect(compileActionPlan(source).steps).toEqual([
      { kind: 'action', action: 'MOVE_TOWARD' }, { kind: 'action', action: 'MOVE_TOWARD' },
      { kind: 'action', action: 'ATTACK' }, { kind: 'action', action: 'ATTACK' }, { kind: 'action', action: 'ATTACK' },
    ]);
  });

  it('wandelt Blockdaten verlustfrei in die Textdarstellung zurück', () => {
    const source = blocksToSource([{ kind: 'action', count: 2, action: 'MOVE_TOWARD' }, { kind: 'action', count: 3, action: 'ATTACK' }]);
    expect(compileActionPlan(source).blocks).toEqual([{ kind: 'action', count: 2, action: 'MOVE_TOWARD' }, { kind: 'action', count: 3, action: 'ATTACK' }]);
  });

  it('erhält Bedingungen in der gemeinsamen Programmstruktur', () => {
    const source = 'repeat(2, () => { if (state.enemyAdjacent) { attack(); } else { moveToward(); } });';
    expect(compileActionPlan(source).blocks).toEqual([{ kind: 'condition', count: 2, whenTrue: 'ATTACK', whenFalse: 'MOVE_TOWARD' }]);
  });

  it('lehnt freie JavaScript-APIs und unbeschränkte Wiederholungen ab', () => {
    expect(compileActionPlan('while (true) { attack(); }').error).toBeDefined();
    expect(compileActionPlan('repeat(7, () => { attack(); });').error).toContain('1 bis 6');
  });
});
