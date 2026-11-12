import { describe, expect, it } from 'vitest';
import { compileActionPlan, nodesToSource } from './DecisionProgram';
import { BattleSession, missionPrograms } from './BattleSession';
import { ProgramRunner } from './ProgramRunner';

describe('Verschachtelte Programme', () => {
  it('führt mehrere eingerastete Befehle in einer Schleife in Reihenfolge aus', () => {
    const parsed = compileActionPlan('repeat(2, () => { moosling.moveForward(); moosling.attack(); });', 'moosling');
    const runner = new ProgramRunner(parsed.nodes!);
    expect([runner.next(false), runner.next(false), runner.next(false), runner.next(false)]).toEqual([
      { kind: 'action', action: 'MOVE_TOWARD' }, { kind: 'action', action: 'ATTACK' },
      { kind: 'action', action: 'MOVE_TOWARD' }, { kind: 'action', action: 'ATTACK' },
    ]);
    expect(runner.done).toBe(true);
  });
  it('entscheidet bei jedem Schleifendurchlauf erneut und bewahrt einen begonnenen Zweig', () => {
    const parsed = compileActionPlan('repeat(2, () => { if (moosling.enemyAdjacent) { moosling.attack(); moosling.attack(); } else { moosling.moveForward(); } });');
    const runner = new ProgramRunner(parsed.nodes!);
    expect(runner.next(false)).toEqual({ kind: 'action', action: 'MOVE_TOWARD' });
    expect(runner.next(true)).toEqual({ kind: 'action', action: 'ATTACK' });
    expect(runner.next(false)).toEqual({ kind: 'action', action: 'ATTACK' });
  });
  it('liefert für verschachtelte Duo-Programme identische Einzel- und Gesamtläufe', () => {
    const moosling = 'repeat(3, () => { moosling.moveForward(); }); repeat(3, () => { if (moosling.enemyAdjacent) { moosling.attack(); } else { moosling.moveForward(); } });';
    const sources = { ...missionPrograms(3), moosling };
    const full = new BattleSession(3); const steps = new BattleSession(3);
    full.execute(sources, true);
    for (let index = 0; index < 12; index++) steps.execute(sources);
    expect(full.snapshot).toEqual(steps.snapshot);
    expect(full.snapshot.outcome).toBe('victory');
  });
  it('prüft Fähigkeiten auch in tiefen Zweigen und begrenzt verschachtelte Schleifen', () => {
    const forbidden = 'repeat(1, () => { repeat(1, () => { if (glutling.enemyAdjacent) { glutling.attack(); } }); });';
    const session = new BattleSession(3);
    expect(session.execute({ ...missionPrograms(3), glutling: forbidden })).toContain('noch nicht gelernt');
    expect(compileActionPlan('repeat(6, () => { repeat(6, () => { moosling.attack(); }); });').error).toContain('zwölf');
    const oversized = 'repeat(6, () => { repeat(6, () => { moosling.attack(); }); });';
    expect(compileActionPlan(oversized).nodes).toBeDefined();
    const before = session.snapshot;
    expect(session.execute({ ...missionPrograms(3), moosling: oversized }, true)).toContain('zwölf');
    expect(session.snapshot).toEqual(before);
    expect(compileActionPlan('moosling.attack(); window.alert();').error).toBeDefined();
  });
  it('erhält einzelne Befehle und leere Schleifen beim Text-Roundtrip', () => {
    const source = 'moosling.moveForward(); repeat(2, () => { }); moosling.attack();';
    const nodes = compileActionPlan(source).nodes!;
    expect(compileActionPlan(nodesToSource(nodes, 'moosling')).nodes).toEqual(nodes);
  });
});
