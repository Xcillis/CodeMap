import { describe, expect, it } from 'vitest';
import { BattleSession, missionPrograms } from './BattleSession';
import { compileActionPlan } from './DecisionProgram';
import { ProgramRunner } from './ProgramRunner';

describe('Aktions-Trace', () => {
  it('ordnet verschachtelte Aktionen ihrer Quellzeile und jedem Schleifendurchlauf zu', () => {
    const parsed = compileActionPlan(`repeat(2, () => {
  repeat(2, () => {
    moosling.moveForward();
  });
  moosling.attack();
});`, 'moosling');
    expect(parsed.sourceMap).toEqual({ '0': 1, '0.body.0': 2, '0.body.0.body.0': 3, '0.body.1': 5 });
    const runner = new ProgramRunner(parsed.nodes!);
    const actions = Array.from({ length: 6 }, () => { runner.next(false); return structuredClone(runner.lastTrace); });
    expect(actions.map((trace) => trace?.path)).toEqual(['0.body.0.body.0', '0.body.0.body.0', '0.body.1', '0.body.0.body.0', '0.body.0.body.0', '0.body.1']);
    expect(actions.map((trace) => trace?.loops.map((loop) => loop.iteration))).toEqual([[1, 1], [1, 2], [1], [2, 1], [2, 2], [2]]);
    expect(runner.done).toBe(true);
  });

  it('vermerkt den tatsächlich gewählten Bedingungszweig und prüft bei erneutem Eintritt neu', () => {
    const parsed = compileActionPlan('repeat(2, () => { if (moosling.enemyAdjacent) { moosling.attack(); } else { moosling.moveForward(); } });');
    const runner = new ProgramRunner(parsed.nodes!);
    expect(runner.next(false)).toEqual({ kind: 'action', action: 'MOVE_TOWARD' });
    expect(runner.lastTrace).toMatchObject({ path: '0.body.0.otherwise.0', conditions: [{ path: '0.body.0', value: false }] });
    expect(runner.next(true)).toEqual({ kind: 'action', action: 'ATTACK' });
    expect(runner.lastTrace).toMatchObject({ path: '0.body.0.then.0', conditions: [{ path: '0.body.0', value: true }], loops: [{ iteration: 2, total: 2 }] });
    runner.next(false); expect(runner.lastTrace).toBeUndefined();
  });

  it('zeichnet beide Arkane in stabiler Reihenfolge mit unabhängigen Vorher-/Nachher-Zuständen auf', () => {
    const session = new BattleSession(3);
    session.execute(missionPrograms(3), true);
    const frames = session.frames;
    expect(frames.slice(0, 4).map((frame) => frame.actor)).toEqual(['moosling', 'glutling', 'moosling', 'glutling']);
    expect(frames[0]).toMatchObject({ before: { player: { x: 1 } }, after: { player: { x: 2 } }, trace: { path: '0.body.0', line: 2 } });
    expect(frames[1].before.player.x).toBe(2);
    expect(frames.at(-1)?.after).toEqual(session.snapshot);
    const savedFrame = structuredClone(frames[0]);
    session.reset(); expect(frames[0]).toEqual(savedFrame); expect(session.frames).toHaveLength(0);
  });

  it('zeichnet Gegneraktionen auf und liefert bei Validierungsfehlern keine alten Frames', () => {
    const session = new BattleSession(2);
    session.execute(missionPrograms(2));
    expect(session.frames.map((frame) => frame.actor)).toEqual(['moosling', 'konstrukt']);
    expect(session.frames[1].trace).toBeUndefined();
    const before = session.snapshot;
    session.execute({ moosling: 'attack();' });
    expect(session.frames).toHaveLength(0); expect(session.snapshot).toEqual(before);
  });
});
