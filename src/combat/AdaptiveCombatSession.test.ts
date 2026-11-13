import { describe, expect, it } from 'vitest';
import { getLesson } from '../gameplay/WorldQuests';
import { LessonSession } from './LessonSession';
import { compileActionPlan, nodesToSource } from './DecisionProgram';

const lesson = getLesson('q06-waechter');
const choice = 'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); }';
const source = `repeat(5, () => { ${choice} });`;
const create = () => new LessonSession(lesson, lesson.allowed);

describe('Q06: neue Entscheidungen in jedem Schleifendurchlauf', () => {
  it('führt aktive Gegneraktionen getrennt vor und besteht beide Begegnungen mit demselben Programm', () => {
    const session = create(); expect(session.execute({ glutling: source }, true)).toContain('Questziel erreicht');
    expect(session.snapshot).toMatchObject({ outcome: 'victory', tick: 5, player: { hp: 1 }, enemy: { hp: 0 }, lessonTrial: { current: 2, total: 2, passed: 2 } });
    const first = session.frames.filter((frame) => frame.before.lessonTrial?.current === 1);
    const second = session.frames.filter((frame) => frame.before.lessonTrial?.current === 2);
    expect(first.map((frame) => frame.actor)).toEqual(['glutling', 'konstrukt', 'glutling', 'konstrukt', 'glutling', 'konstrukt', 'glutling']);
    expect(first.filter((frame) => frame.actor === 'glutling').map((frame) => frame.trace?.conditions[0].value)).toEqual([false, true, true, true]);
    expect(second.filter((frame) => frame.actor === 'glutling').map((frame) => frame.trace?.conditions[0].value)).toEqual([false, false, true, true, true]);
    expect(second[0].before).toMatchObject({ tick: 1, player: { hp: 4, x: 1 }, enemy: { hp: 6, x: 5 } });
    expect(first.at(-1)?.after).toMatchObject({ outcome: 'ongoing', lessonTrial: { passed: 1 } });
    expect(session.frames.slice(0, -1).every((frame) => frame.after.outcome !== 'victory')).toBe(true);
    for (const frame of session.frames) {
      if (!frame.after.enemy) throw new Error('Jeder Wächter-Frame muss das Konstrukt enthalten.');
      expect(frame.after.player.x === frame.after.enemy.x && frame.after.player.y === frame.after.enemy.y).toBe(false);
      if (frame.actor === 'konstrukt') expect(frame.trace).toBeUndefined();
    }
    expect(first[1]).toMatchObject({ action: 'MOVE_TOWARD', before: { enemy: { x: 4 } }, after: { enemy: { x: 3 } } });
  });
  it('behält die bestandene Situation für den nächsten Schritt und setzt beim Programmwechsel beide zurück', () => {
    const session = create();
    for (let index = 0; index < 4; index++) session.execute({ glutling: source });
    expect(session.snapshot.lessonTrial).toMatchObject({ current: 1, passed: 1 });
    session.execute({ glutling: nodesToSource(compileActionPlan(source, 'glutling').nodes!, 'glutling') });
    expect(session.snapshot).toMatchObject({ tick: 1, lessonTrial: { current: 2, passed: 1 } });
    session.execute({ glutling: source.replace('repeat(5', 'repeat(6') });
    expect(session.snapshot).toMatchObject({ tick: 1, lessonTrial: { current: 1, passed: 0 } });
    session.reset(); expect(session.snapshot).toMatchObject({ tick: 0, outcome: 'ongoing', player: { hp: 4 }, lessonTrial: { current: 1, passed: 0 } });
  });
  it('lässt einen Sieg ohne wiederholt geprüfte innere Bedingung als offene Lernübung stehen', () => {
    for (const invalid of [
      'glutling.moveForward(); glutling.attack(); glutling.attack(); glutling.attack();',
      'repeat(2, () => {}); glutling.moveForward(); repeat(3, () => { glutling.attack(); });',
      `repeat(1, () => { ${choice} }); repeat(3, () => { glutling.attack(); });`,
      `${choice} repeat(3, () => { glutling.attack(); });`,
      'if (glutling.enemyAdjacent) { repeat(3, () => { glutling.attack(); }); } else { repeat(1, () => { glutling.moveForward(); }); repeat(3, () => { glutling.attack(); }); }',
      'repeat(4, () => { if (glutling.enemyAdjacent) { glutling.attack(); } if (glutling.enemyAdjacent) {} else { glutling.moveForward(); } });',
      `repeat(1, () => { ${choice} }); repeat(1, () => { ${choice} }); repeat(2, () => { glutling.attack(); });`,
    ]) {
      const session = create(); expect(session.execute({ glutling: invalid }, true), invalid).toContain('Lernziel noch offen');
      expect(session.snapshot).toMatchObject({ outcome: 'incomplete', enemy: { hp: 0 }, lessonTrial: { passed: 0 } });
      expect(session.frames.every((frame) => frame.after.outcome !== 'victory')).toBe(true);
    }
  });
  it('verlangt den Nachweis in jeder Situation und akzeptiert gleichwertige verschachtelte Lösungen', () => {
    for (const valid of [source.replace('repeat(5', 'repeat(6'), source.replace('moveForward', 'moveRight'), `repeat(1, () => { ${source} });`]) {
      const session = create(); session.execute({ glutling: valid }, true); expect(session.snapshot.outcome, valid).toBe('victory');
    }
    // The adjacent second start never produces a useful false branch.
    // Evidence from the first start must not satisfy that second encounter.
    if (lesson.kind !== 'combat') throw new Error('combat expected');
    const session = new LessonSession({ ...lesson, adaptiveTrials: [lesson.adaptiveTrials![0], { title: 'Bereits direkt daneben', start: { x: 1, y: 3 }, enemy: { x: 2, y: 3 } }] }, lesson.allowed);
    session.execute({ glutling: source }, true);
    expect(session.snapshot).toMatchObject({ outcome: 'incomplete', lessonTrial: { current: 2, passed: 1 } });
  });
  it('erkennt Niederlage und zu kurze Programme, ohne einen Teilerfolg als Gesamtsieg anzuzeigen', () => {
    const short = create(); short.execute({ glutling: `repeat(4, () => { ${choice} });` }, true);
    expect(short.snapshot).toMatchObject({ outcome: 'incomplete', enemy: { hp: 2 }, lessonTrial: { current: 2, passed: 1 } });
    const wrong = create(); wrong.execute({ glutling: 'repeat(6, () => { if (glutling.enemyAdjacent) { glutling.moveForward(); } else { glutling.attack(); } });' }, true);
    expect(wrong.snapshot).toMatchObject({ outcome: 'defeat', player: { hp: 0 }, lessonTrial: { passed: 0 } });
    const emptyBranch = create(); emptyBranch.execute({ glutling: lesson.starter }, true);
    expect(emptyBranch.snapshot).toMatchObject({ outcome: 'incomplete', tick: 0, lessonTrial: { passed: 0 } });
    expect(emptyBranch.frames).toEqual([]);
  });
  it('erhält laufende Zustände bei Syntax- und Freigabefehlern und erlaubt einen leeren Entwurf', () => {
    const session = create(); session.execute({ glutling: source }); const before = session.snapshot;
    for (const invalid of ['glutling.', 'attack();', 'moosling.attack();', 'glutling.moveLeft();', `repeat(6, () => { ${choice} glutling.attack(); glutling.attack(); });`]) {
      session.execute({ glutling: invalid }, true); expect(session.snapshot, invalid).toEqual(before); expect(session.frames).toEqual([]);
    }
    expect(session.execute({ glutling: '' }, true)).toContain('leer'); expect(session.snapshot.tick).toBe(0);
    session.execute({ glutling: source }, true); const completed = session.snapshot;
    session.execute({ glutling: source }); expect(session.frames).toEqual([]); expect(session.snapshot).toEqual(completed);
    session.execute({ glutling: source }, true); expect(session.frames.length).toBeGreaterThan(0); expect(session.snapshot.outcome).toBe('victory');
  });
});
