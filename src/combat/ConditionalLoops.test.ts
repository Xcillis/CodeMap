import { describe, expect, it } from 'vitest';
import { compileActionPlan, nodesToSource } from './DecisionProgram';
import { ProgramRunner } from './ProgramRunner';
import { LessonSession } from './LessonSession';
import { getLesson } from '../gameplay/WorldQuests';
import { QUEST_SOLUTIONS } from '../test/questSolutions';
import { nodesCapabilityError } from './CommandCatalog';
import { BattleSession } from './BattleSession';
import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';

describe('Bedingte Schleifen', () => {
  it('prüft vor dem ersten und jedem weiteren Durchlauf und setzt darunter fort, auch bei null Durchläufen', () => {
    const source = 'while (glutling.pathAheadClear) { glutling.moveForward(); } glutling.turnLeft();';
    const parsed = compileActionPlan(source, 'glutling'); expect(parsed.error).toBeUndefined();
    expect(compileActionPlan(nodesToSource(parsed.nodes!, 'glutling'), 'glutling').nodes).toEqual(parsed.nodes);
    const runner = new ProgramRunner(parsed.nodes!); let count = 0;
    expect(runner.next(() => ++count <= 2)).toEqual({ kind: 'action', action: 'MOVE_FORWARD' });
    expect(runner.next(() => ++count <= 2)).toEqual({ kind: 'action', action: 'MOVE_FORWARD' });
    expect(runner.next(() => ++count <= 2)).toEqual({ kind: 'action', action: 'TURN_LEFT' });
    expect(runner.lastTrace?.conditions).toContainEqual({ path: '0', condition: 'pathAheadClear', value: false });
    expect(runner.done).toBe(true);
    const zero = new ProgramRunner(parsed.nodes!); expect(zero.next(() => false)).toEqual({ kind: 'action', action: 'TURN_LEFT' });
    expect(zero.whileChecks).toEqual([{ path: '0', condition: 'pathAheadClear', value: false, iteration: 1 }]);
  });
  it('hält leere und wirkungslose Endlosschleifen an und bleibt im nächsten Versuch bedienbar', () => {
    const empty = new ProgramRunner(compileActionPlan('while (glutling.enemyAlive) {}', 'glutling').nodes!);
    expect(empty.next(() => true)).toBeUndefined(); expect(empty.error).toContain('512'); expect(empty.done).toBe(true);
    const runner = new ProgramRunner(compileActionPlan('while (glutling.enemyAlive) { glutling.turnLeft(); }', 'glutling').nodes!);
    for (let i = 0; i < 64; i++) expect(runner.next(() => true)).toBeDefined();
    expect(runner.next(() => true)).toBeUndefined(); expect(runner.error).toContain('64');
    const session = new BattleSession(1, ['glutling'], { glutling: ARKANA_SPECIES.glutling.supported }, { enemyHp: 20 });
    expect(session.execute({ glutling: 'while (glutling.enemyAlive) { glutling.turnLeft(); }' }, true)).toContain('64');
    expect(session.snapshot.tick).toBe(64); expect(session.done).toBe(true); session.reset(); expect(session.snapshot.tick).toBe(0);
  });
  it('beginnt eine innere solange-Schleife bei jedem äußeren Durchlauf neu', () => {
    const parsed = compileActionPlan('repeat(2, () => { while (glutling.pathAheadClear) { glutling.moveForward(); } glutling.turnLeft(); });', 'glutling');
    const runner = new ProgramRunner(parsed.nodes!);
    const answers = [true, false, true, true, false];
    const actions = [];
    while (!runner.done) {
      const step = runner.next(() => answers.shift() ?? false);
      if (step?.kind === 'action') actions.push(step.action);
    }
    expect(actions).toEqual(['MOVE_FORWARD', 'TURN_LEFT', 'MOVE_FORWARD', 'MOVE_FORWARD', 'TURN_LEFT']);
    expect(runner.whileChecks.map((check) => check.iteration)).toEqual([1, 2, 1, 2, 3]);
    expect(runner.error).toBeUndefined();
  });
  it('verlangt eine gelernte Schleife und eine gelernte Frage und blockiert falsche Objektzuordnung', () => {
    const parsed = compileActionPlan('while (glutling.enemyAlive) { glutling.moveForward(); }', 'glutling');
    expect(nodesCapabilityError(parsed.nodes!, 'glutling', 0, getLesson('q01-glutspur').allowed)).toContain('while');
    expect(nodesCapabilityError(parsed.nodes!, 'glutling', 0, [...getLesson('q01-glutspur').allowed, 'while'])).toContain('enemyAlive');
    expect(compileActionPlan('while (moosling.enemyAlive) { glutling.moveForward(); }', 'glutling').error).toContain('gehört');
  });
  it('prüft denselben Ablauf an drei Weglängen und lehnt ausgeschriebene Umgehungen ab', () => {
    const lesson = getLesson('q21-solangeweg'); const session = new LessonSession(lesson, lesson.allowed);
    session.execute(QUEST_SOLUTIONS[lesson.id], true);
    expect(session.snapshot).toMatchObject({ outcome: 'victory', lessonTrial: { passed: 3, total: 3 } });
    expect(session.frames.some((f) => f.trace?.conditions.some((c) => c.condition === 'pathAheadClear' && !c.value))).toBe(true);
    session.reset();
    session.execute({ glutling: 'glutling.moveForward(); glutling.moveForward(); glutling.moveForward(); glutling.turnLeft(); glutling.moveForward();' }, true);
    expect(session.snapshot.outcome).toBe('incomplete'); expect(session.snapshot.lessonTrial?.passed).toBe(0);
  });
});
