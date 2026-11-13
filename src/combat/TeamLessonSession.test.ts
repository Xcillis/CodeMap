import { describe, expect, it } from 'vitest';
import { getLesson, lessonPrograms } from '../gameplay/WorldQuests';
import { LessonSession } from './LessonSession';
import type { ProgramSources } from './types';

const teamSolution: ProgramSources = {
  moosling: 'repeat(2, () => { moosling.moveRight(); }); repeat(2, () => { moosling.attack(); });',
  glutling: 'repeat(3, () => { glutling.moveRight(); }); repeat(2, () => { glutling.attack(); });',
};
const lesson = getLesson('q08-team');
const create = () => new LessonSession(lesson, { moosling: lesson.allowed, glutling: lesson.allowed });

describe('Moosling und zwei eigene Programme', () => {
  it('verwendet in Q07 Mooslings Programm, Lebenspunkte und Schaden', () => {
    const solo = getLesson('q07-moosling'); const session = new LessonSession(solo, solo.allowed);
    session.execute(lessonPrograms(solo), true); expect(session.snapshot).toMatchObject({ player: { id: 'moosling', hp: 5, attackPower: 1 }, companion: undefined, tick: 1 });
    expect(session.snapshot.outcome).toBe('ongoing');
    const programs = { moosling: 'repeat(2, () => { moosling.moveRight(); }); repeat(3, () => { moosling.attack(); });' };
    session.execute(programs, true); expect(session.snapshot.outcome).toBe('victory');
    expect(session.frames.filter((frame) => frame.action === 'ATTACK')).toHaveLength(3);
    expect(session.frames.every((frame) => frame.actor === 'moosling')).toBe(true);
    session.reset(); const before = session.snapshot;
    session.execute({ moosling: 'glutling.attack();' }, true); expect(session.snapshot).toEqual(before);
    expect(session.execute({ moosling: 'moosling.moveForward();' }, true)).toContain('nicht freigegeben');
    expect(session.snapshot).toEqual(before);
  });
  it('führt beide Programme in fester Reihenfolge aus und akzeptiert den gemeinsamen Trefferbeitrag', () => {
    const session = create(); expect(session.execute(teamSolution, true)).toContain('Questziel erreicht');
    expect(session.snapshot).toMatchObject({ tick: 5, outcome: 'victory', player: { id: 'moosling', hp: 5 }, companion: { id: 'glutling', hp: 4 }, enemy: { hp: 0 } });
    expect(session.frames.slice(0, 4).map((frame) => frame.actor)).toEqual(['moosling', 'glutling', 'moosling', 'glutling']);
    expect(session.frames.filter((frame) => frame.actor === 'moosling' && frame.action === 'ATTACK').map((frame) => frame.before.enemy!.hp - frame.after.enemy!.hp)).toEqual([1, 1]);
    expect(session.frames.filter((frame) => frame.actor === 'glutling' && frame.action === 'ATTACK').map((frame) => frame.before.enemy!.hp - frame.after.enemy!.hp)).toEqual([2, 2]);
    expect(session.frames.at(-1)?.actor).toBe('glutling');
    for (const frame of session.frames) {
      const units = [frame.after.player, frame.after.companion, frame.after.enemy].filter((unit) => unit !== undefined);
      expect(new Set(units.map((unit) => `${unit.x},${unit.y}`)).size).toBe(units.length);
    }
  });
  it('erlaubt leere Entwürfe und Warten, verlangt aber einen wirksamen Beitrag von beiden', () => {
    const session = create(); expect(session.execute({ moosling: '', glutling: '' }, true)).toContain('leer'); expect(session.snapshot.tick).toBe(0);
    session.execute({ moosling: 'repeat(2, () => { moosling.moveRight(); }); repeat(6, () => { moosling.attack(); });', glutling: '' }, true);
    expect(session.snapshot).toMatchObject({ outcome: 'incomplete', enemy: { hp: 0 } });
    expect(session.frames.every((frame) => frame.after.outcome !== 'victory')).toBe(true);
    const failed = session.snapshot;
    expect(session.execute({ ...teamSolution, glutling: 'glutling.' }, true)).toContain('Unbekannter Arkan-Befehl');
    expect(session.snapshot).toEqual(failed); expect(session.frames).toEqual([]);
    expect(session.execute(teamSolution, true)).toContain('Questziel erreicht');
    session.execute({ moosling: '', glutling: 'repeat(3, () => { glutling.moveRight(); }); repeat(3, () => { glutling.attack(); });' }, true);
    expect(session.snapshot.outcome).toBe('incomplete');
    session.execute(lessonPrograms(lesson), true); expect(session.snapshot).toMatchObject({ outcome: 'ongoing', enemy: { hp: 6 } });
  });
  it('blockiert ein besetztes Feld und prüft jedes Programm vor jeder Zustandsänderung', () => {
    const session = create();
    session.execute({ moosling: 'moosling.moveUp();', glutling: 'glutling.moveRight();' });
    expect(session.frames[0].after.player).toMatchObject({ x: 1, y: 3 }); expect(session.frames[0].after.log.at(-1)).toContain('belegt');
    expect(session.snapshot.companion).toMatchObject({ x: 2, y: 2 });
    session.execute(teamSolution); const before = session.snapshot;
    for (const invalid of [{ ...teamSolution, glutling: 'glutling.' }, { ...teamSolution, glutling: 'moosling.attack();' }, { ...teamSolution, moosling: 'if (moosling.enemyAdjacent) { moosling.attack(); }' }]) {
      session.execute(invalid, true); expect(session.snapshot).toEqual(before); expect(session.frames).toEqual([]);
    }
  });
  it('erhält Beiträge bei Formatwechsel und verwirft sie bei Programmänderung, Neustart und erneutem Gesamtlauf', () => {
    const session = create();
    for (let index = 0; index < 4; index++) session.execute(teamSolution);
    expect(session.snapshot.tick).toBe(4);
    session.execute({ ...teamSolution, glutling: teamSolution.glutling!.replaceAll('; ', ';\n') }); expect(session.snapshot.outcome).toBe('victory');
    session.execute({ ...teamSolution, moosling: '' }); expect(session.snapshot).toMatchObject({ tick: 1, outcome: 'ongoing' });
    session.reset(); expect(session.snapshot).toMatchObject({ tick: 0, outcome: 'ongoing' });
    session.execute(teamSolution, true); expect(session.snapshot.outcome).toBe('victory');
    session.execute({ moosling: '', glutling: 'repeat(3, () => { glutling.moveRight(); }); repeat(3, () => { glutling.attack(); });' }, true);
    expect(session.snapshot.outcome).toBe('incomplete');
  });
});
