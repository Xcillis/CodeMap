import { describe, expect, it } from 'vitest';
import { getLesson } from '../gameplay/WorldQuests';
import { LessonSession } from './LessonSession';
import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';

const lesson = getLesson('q05-aufmerksam');
const source = 'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); }';
const create = () => new LessonSession(lesson, lesson.allowed);

describe('Q05: eine passende Entscheidung in zwei Startsituationen', () => {
  it('wertet die wirkliche Entfernung aus, führt je Fall nur eine Aktion aus und verlangt keinen besiegten Gegner', () => {
    const session = create(); session.execute({ glutling: source }, true);
    expect(session.frames).toHaveLength(2);
    expect(session.frames.map((frame) => frame.trace?.conditions[0].value)).toEqual([true, false]);
    expect(session.frames.map((frame) => frame.action)).toEqual(['ATTACK', 'MOVE_TOWARD']);
    expect(session.frames[0].after).toMatchObject({ outcome: 'ongoing', enemy: { hp: 2 }, lessonTrial: { current: 1, total: 2, passed: 1 } });
    expect(session.frames[1].before.player).toMatchObject({ x: 1, y: 3 });
    expect(session.snapshot).toMatchObject({ outcome: 'victory', player: { x: 2, y: 3 }, enemy: { hp: 4 }, lessonTrial: { current: 2, passed: 2 } });
  });
  it('prüft auch bei vertauschter Fallreihenfolge tatsächliche Zustände', () => {
    if (lesson.kind !== 'combat') throw new Error('combat expected');
    const session = new LessonSession({ ...lesson, decisionTrials: [...lesson.decisionTrials!].reverse() }, lesson.allowed);
    session.execute({ glutling: source }, true);
    expect(session.snapshot.outcome).toBe('victory');
    expect(session.frames.map((frame) => frame.trace?.conditions[0].value)).toEqual([false, true]);
  });
  it('lässt den Starter nur den ersten Fall bestehen und erklärt den fehlenden sonst-Befehl', () => {
    const session = create(); const message = session.execute({ glutling: lesson.starter }, true);
    expect(session.snapshot).toMatchObject({ outcome: 'incomplete', lessonTrial: { passed: 1, current: 2 } });
    expect(message).toContain('sonst-Teil'); expect(session.frames.every((frame) => frame.after.outcome !== 'victory')).toBe(true);
  });
  it('lehnt bedingungslose, vertauschte, blockierte oder wirkungslose Entscheidungen ab', () => {
    for (const invalid of [
      'glutling.attack();',
      'glutling.attack(); if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); }',
      'if (glutling.enemyAdjacent) {} else {} glutling.attack();',
      'if (glutling.enemyAdjacent) { glutling.moveForward(); } else { glutling.attack(); }',
      'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.attack(); }',
      'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveUp(); }',
    ]) {
      const session = create(); session.execute({ glutling: invalid }, true);
      expect(session.snapshot.outcome, invalid).toBe('incomplete');
      expect(session.frames.some((frame) => frame.after.outcome === 'victory')).toBe(false);
    }
  });
  it('verlangt beide Antworten derselben Verzweigung und akzeptiert passende Bewegungsvarianten', () => {
    const split = 'if (glutling.enemyAdjacent) { glutling.attack(); } if (glutling.enemyAdjacent) {} else { glutling.moveForward(); }';
    const session = create();
    expect(session.execute({ glutling: split }, true)).toContain('denselben falls/sonst-Block');
    expect(session.snapshot).toMatchObject({ outcome: 'incomplete', lessonTrial: { passed: 2 } });
    session.execute({ glutling: source.replace('moveForward', 'moveRight') }, true);
    expect(session.snapshot.outcome).toBe('victory');
  });
  it('bewahrt den Fallwechsel beim Formatwechsel und verwirft Erfolge bei semantischer Änderung oder Reset', () => {
    const session = create(); session.execute({ glutling: source });
    expect(session.snapshot).toMatchObject({ outcome: 'ongoing', lessonTrial: { current: 1, passed: 1 } });
    session.execute({ glutling: source.replaceAll('; ', ';\n') }); expect(session.snapshot.outcome).toBe('victory');
    session.reset(); expect(session.snapshot.lessonTrial?.passed).toBe(0);
    session.execute({ glutling: source });
    session.execute({ glutling: source.replace('moveForward', 'moveRight') });
    expect(session.snapshot).toMatchObject({ outcome: 'ongoing', lessonTrial: { current: 1, passed: 1 } });
    session.execute({ glutling: source.replace('moveForward', 'moveRight') }); expect(session.snapshot.outcome).toBe('victory');
  });
  it('beschränkt Q05 auf die neue Entscheidung und erhält den Zustand bei Syntax- und Freigabefehlern', () => {
    const session = new LessonSession(lesson, ARKANA_SPECIES.glutling.supported);
    session.execute({ glutling: source }); const before = session.snapshot;
    expect(session.execute({ glutling: `repeat(2, () => { ${source} });` }, true)).toContain('nicht freigegeben');
    expect(session.snapshot).toEqual(before); expect(session.frames).toEqual([]);
    expect(session.execute({ glutling: 'glutling.' }, true)).toContain('Unbekannter Arkan-Befehl'); expect(session.snapshot).toEqual(before);
  });
});
