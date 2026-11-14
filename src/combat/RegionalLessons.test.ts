import { describe, expect, it } from 'vitest';
import { LessonSession } from './LessonSession';
import { getLesson } from '../gameplay/WorldQuests';
import { QUEST_SOLUTIONS } from '../test/questSolutions';
import { evaluateCondition } from './Conditions';
import { BattleEngine } from './BattleEngine';
import { compileActionPlan, nodesToSource } from './DecisionProgram';
import { learnedTerms } from '../gameplay/LearningTerms';

describe('Verschachtelte Schleifen und bedingte Rätsel', () => {
  it('verlangt echte innere Wiederholungen in mehreren äußeren Durchläufen', () => {
    const lesson = getLesson('q10-schachtelkampf');
    for (const invalid of ['glutling.attack(); glutling.attack(); glutling.attack(); glutling.attack();', 'repeat(4, () => { glutling.attack(); });', 'repeat(1, () => { repeat(4, () => { glutling.attack(); }); });', 'repeat(2, () => { repeat(2, () => {}); }); repeat(4, () => { glutling.attack(); });']) {
      const s = new LessonSession(lesson, lesson.allowed); expect(s.execute({ glutling: invalid }, true)).toContain('Verschachtelungsübung');
      expect(s.snapshot).toMatchObject({ outcome: 'incomplete', enemy: { hp: 0 } }); expect(s.frames.every((f) => f.after.outcome !== 'victory')).toBe(true);
    }
    const s = new LessonSession(lesson, lesson.allowed); s.execute(QUEST_SOLUTIONS[lesson.id], true); expect(s.snapshot.outcome).toBe('victory');
    expect(s.frames.map((f) => f.trace?.loops.map((loop) => loop.iteration))).toEqual([[1, 1], [1, 2], [2, 1], [2, 2]]);
    s.reset(); s.execute({ glutling: 'repeat(4, () => { glutling.attack(); });' }, true); expect(s.snapshot.outcome).toBe('incomplete');
  });
  it('unterscheidet einen flachen Treppenweg vom tatsächlich verschachtelten Programm', () => {
    const lesson = getLesson('q09-schachtelpfad'); const s = new LessonSession(lesson, lesson.allowed);
    s.execute({ glutling: 'repeat(3, () => { glutling.moveRight(); glutling.moveRight(); glutling.moveUp(); });' }, true);
    expect(s.snapshot).toMatchObject({ outcome: 'incomplete', player: { x: 6, y: 2 } });
    s.execute(QUEST_SOLUTIONS[lesson.id], true); expect(s.snapshot.outcome).toBe('victory');
    expect(s.frames.filter((f) => f.trace?.loops.length === 2)).toHaveLength(6);
  });
  it('bewertet auch im Tal-Kampf wirksame Schleifen statt bloß vorhandener leerer Blöcke', () => {
    const lesson = getLesson('q11-schleifenwache'); const s = new LessonSession(lesson, lesson.allowed);
    s.execute({ glutling: 'repeat(2, () => {}); glutling.moveRight(); glutling.moveRight(); glutling.attack(); glutling.attack(); glutling.attack();' }, true);
    expect(s.snapshot.outcome).toBe('incomplete'); s.execute(QUEST_SOLUTIONS[lesson.id], true); expect(s.snapshot.outcome).toBe('victory');
  });
  it('prüft den realen Weg vor jeder Bewegung und zeichnet beide Antworten auf', () => {
    const lesson = getLesson('q13-lichtpfad'); const s = new LessonSession(lesson, lesson.allowed);
    s.execute(QUEST_SOLUTIONS[lesson.id], true); expect(s.snapshot).toMatchObject({ outcome: 'victory', player: { x: 3, y: 2 } });
    expect(s.frames.map((f) => f.trace?.conditions[0].value)).toEqual([false, true, true, false]);
    expect(s.frames.every((f) => f.trace?.conditions[0].condition === 'pathRightClear')).toBe(true);
    const nodes = compileActionPlan(QUEST_SOLUTIONS[lesson.id].glutling!, 'glutling').nodes!;
    expect(compileActionPlan(nodesToSource(nodes, 'glutling'), 'glutling').nodes).toEqual(nodes);
    s.execute({ glutling: 'glutling.moveUp(); glutling.moveRight(); glutling.moveRight(); glutling.moveUp();' }, true);
    expect(s.snapshot).toMatchObject({ outcome: 'incomplete', player: { x: 3, y: 2 } });
    const before = s.snapshot; s.execute({ glutling: 'if (glutling.unknownSensor) { glutling.moveRight(); }' }, true); expect(s.snapshot).toEqual(before);
  });
  it('behandelt auch Kartenränder und besetzte Felder als gesperrt, jeweils für das abgefragte Objekt', () => {
    const engine = new BattleEngine({ moosling: { x: 1, y: 3 }, glutling: { x: 2, y: 3 } }); engine.reset(true);
    expect(evaluateCondition(engine.snapshot, 'pathRightClear', 'moosling')).toBe(false);
    expect(evaluateCondition(engine.snapshot, 'pathRightClear', 'glutling')).toBe(true);
    const state = engine.snapshot; state.player.x = 6; expect(evaluateCondition(state, 'pathRightClear', 'moosling')).toBe(false);
  });
  it('lernt die Verschachtelung bei Mira oder an der Gebietsaufgabe und die Weg-Abfrage erst im Wald', () => {
    expect(learnedTerms(['q03-wiederkehr']).some((t) => t.id === 'nested-loop')).toBe(false);
    expect(learnedTerms(['q09-schachtelpfad']).some((t) => t.id === 'nested-loop')).toBe(true);
    expect(learnedTerms(['q12-steinrutsch']).some((t) => t.id === 'nested-loop')).toBe(true);
    expect(learnedTerms(['q13-lichtpfad']).some((t) => t.id === 'query')).toBe(true);
  });
});
