import { describe, expect, it } from 'vitest';
import { LessonSession } from './LessonSession';
import { getLesson } from '../gameplay/WorldQuests';
import { QUEST_SOLUTIONS } from '../test/questSolutions';
import { runeProgress } from './PuzzlePresentation';

describe('Eigenständige Runenwinde statt einer zweiten Runentreppe', () => {
  const lesson = getLesson('q12-steinrutsch');
  it('verlangt alle drei Sicherungen UND die anschließende Rückkehr zur Winde', () => {
    const session = new LessonSession(lesson, lesson.allowed);
    expect(session.snapshot.outcome).toBe('ongoing');
    const outward = 'repeat(2, () => { glutling.moveUp(); }); repeat(2, () => { glutling.moveRight(); }); repeat(2, () => { glutling.moveDown(); });';
    session.execute({ glutling: outward }, true);
    expect(session.snapshot).toMatchObject({ outcome: 'ongoing', player: { x: 3, y: 5 } });
    expect(runeProgress(session.snapshot)).toMatchObject({ kind: 'safeguards', activated: 3, total: 3, rows: [] });
    expect(runeProgress(session.snapshot)?.summary).toContain('Winde zurückkehren');
    session.execute(QUEST_SOLUTIONS[lesson.id], true);
    expect(session.snapshot).toMatchObject({ outcome: 'victory', tick: 11, player: { x: 1, y: 5 } });
    expect(session.frames.slice(0, -1).every((frame) => frame.after.outcome !== 'victory')).toBe(true);
  });
  it('akzeptiert unterschiedliche Rundrichtungen und Einzelbefehle ohne künstliche Verschachtelungspflicht', () => {
    for (const source of [QUEST_SOLUTIONS[lesson.id].glutling!,
      'glutling.moveRight(); glutling.moveRight(); glutling.moveUp(); glutling.moveUp(); glutling.moveLeft(); glutling.moveLeft(); glutling.moveDown(); glutling.moveDown();']) {
      const session = new LessonSession(lesson, lesson.allowed);
      for (let step = 0; step < 64 && session.snapshot.outcome === 'ongoing'; step++) session.execute({ glutling: source });
      expect(session.snapshot.outcome).toBe('victory'); session.reset(); expect(runeProgress(session.snapshot)?.activated).toBe(0);
    }
  });
  it('verhindert frühe Rückkehr und Abkürzungen durch den Felsblock; das alte Treppenprogramm löst dieses Rätsel nicht', () => {
    const session = new LessonSession(lesson, lesson.allowed);
    session.execute({ glutling: 'glutling.moveUp(); glutling.moveDown();' }, true);
    expect(session.snapshot.outcome).toBe('ongoing'); expect(session.snapshot.log.at(-1)).toContain('3 Sicherungsrunen');
    session.execute({ glutling: 'glutling.moveUp(); glutling.moveRight();' }, true);
    expect(session.snapshot.player).toMatchObject({ x: 1, y: 4 }); expect(session.snapshot.log.at(-1)).toContain('blockiert');
    session.execute({ glutling: 'repeat(2, () => { repeat(2, () => { glutling.moveRight(); }); glutling.moveUp(); });' }, true);
    expect(session.snapshot.outcome).toBe('ongoing'); expect(runeProgress(session.snapshot)?.activated).toBeLessThan(3);
  });
});
