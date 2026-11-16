import { describe, expect, it } from 'vitest';
import { getLesson } from '../gameplay/WorldQuests';
import { LessonSession } from './LessonSession';
import { runeProgress } from './PuzzlePresentation';
import { QUEST_SOLUTIONS } from '../test/questSolutions';

describe('Runenfeld als sichtbare Arbeit in mehreren Reihen', () => {
  const lesson = getLesson('q10-schachtelkampf');
  it('demonstriert mit dem Starter genau eine Reihe und noch keinen fertigen Gesamtauftrag', () => {
    const session = new LessonSession(lesson, lesson.allowed); session.execute({ glutling: lesson.starter }, true);
    expect(session.snapshot).toMatchObject({ outcome: 'ongoing', tick: 5, player: { x: 1, y: 4 } });
    expect(runeProgress(session.snapshot)).toMatchObject({ activated: 2, total: 4, rows: [{ y: 5, activated: 2, total: 2 }, { y: 4, activated: 0, total: 2 }] });
    expect(session.snapshot.enemy).toBeUndefined();
  });
  it('lässt das frühe Betreten des Ausgangs ohne Runen nicht als Sieg gelten', () => {
    const session = new LessonSession(lesson, lesson.allowed); session.execute({ glutling: 'glutling.moveUp(); glutling.moveUp();' }, true);
    expect(session.snapshot).toMatchObject({ outcome: 'ongoing', player: { x: 1, y: 3 } });
    expect(runeProgress(session.snapshot)?.activated).toBe(0); expect(session.snapshot.log.at(-1)).toContain('4 blaue Runen fehlen');
  });
  it('zeigt die innere Zählung in der zweiten Reihe wieder bei 1 und bewahrt den Fortschritt beim Formatwechsel', () => {
    const session = new LessonSession(lesson, lesson.allowed); const source = QUEST_SOLUTIONS[lesson.id].glutling!;
    session.execute({ glutling: source }); session.execute({ glutling: source.replaceAll('; ', ';\n') });
    expect(runeProgress(session.snapshot)?.activated).toBe(2); expect(session.snapshot.tick).toBe(2);
    for (let i = 0; i < 8; i++) session.execute({ glutling: source });
    expect(session.snapshot.outcome).toBe('victory'); expect(runeProgress(session.snapshot)?.activated).toBe(4);
    session.reset(); expect(session.snapshot.tick).toBe(0); expect(runeProgress(session.snapshot)?.activated).toBe(0);
    session.execute({ glutling: source }); session.execute({ glutling: lesson.starter });
    expect(session.snapshot.tick).toBe(1); expect(runeProgress(session.snapshot)?.activated).toBe(1);
  });
  it('verwirft alte Angriffsprogramme vor jeder Änderung und zählt eine Rune auch beim Rückweg nur einmal', () => {
    const session = new LessonSession(lesson, lesson.allowed); const before = session.snapshot;
    expect(session.execute({ glutling: 'repeat(2, () => { repeat(2, () => { glutling.attack(); }); });' }, true)).toContain('nicht freigegeben');
    expect(session.snapshot).toEqual(before);
    session.execute({ glutling: 'glutling.moveRight(); glutling.moveLeft(); glutling.moveRight();' }, true);
    expect(runeProgress(session.snapshot)?.activated).toBe(1);
  });
});
