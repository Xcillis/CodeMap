import { describe, expect, it } from 'vitest';
import { getLesson, lessonActors, LESSON_IDS } from '../gameplay/WorldQuests';
import type { ProgramSources } from './types';
import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';
import { LessonSession } from './LessonSession';
import { PuzzleEngine } from './PuzzleEngine';
import { compileActionPlan, nodesToSource } from './DecisionProgram';

const solutions = [
  'glutling.moveRight(); glutling.moveRight(); glutling.moveUp();',
  'glutling.moveRight(); glutling.moveRight(); glutling.attack(); glutling.attack();',
  'repeat(4, () => { glutling.moveRight(); });',
  'repeat(3, () => { glutling.moveRight(); glutling.moveUp(); });',
  'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); }',
  'repeat(5, () => { if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); } });',
  'repeat(2, () => { moosling.moveRight(); }); repeat(3, () => { moosling.attack(); });',
  '',
];
describe('Lernaufgaben mit eigenen Freigaben und Zielen', () => {
  for (const [index, id] of LESSON_IDS.entries()) it(`${id}: liefert schrittweise und vollständig dieselben Zustände und Traces`, () => {
    const lesson = getLesson(id); const full = new LessonSession(lesson, lesson.allowed); const steps = new LessonSession(lesson, lesson.allowed);
    const programs: ProgramSources = id === 'q08-team' ? { moosling: 'repeat(2, () => { moosling.moveRight(); }); repeat(2, () => { moosling.attack(); });', glutling: 'repeat(3, () => { glutling.moveRight(); }); repeat(2, () => { glutling.attack(); });' } : { [lessonActors(lesson)[0]]: solutions[index] };
    full.execute(programs, true);
    const frames = [];
    for (let count = 0; count < 12 && steps.snapshot.outcome === 'ongoing'; count++) { steps.execute(programs); frames.push(...steps.frames); }
    expect(steps.snapshot).toEqual(full.snapshot); expect(frames).toEqual(full.frames); expect(full.snapshot.outcome).toBe('victory');
    expect(Boolean(full.snapshot.enemy)).toBe(lesson.kind === 'combat');
    full.reset(); expect(full.snapshot.tick).toBe(0);
  });
  it('startet mit einer demonstrierbaren Einzelanweisung ohne fertige Lösung und ohne Gegner', () => {
    const lesson = getLesson(LESSON_IDS[0]); const session = new LessonSession(lesson, lesson.allowed);
    session.execute({ glutling: lesson.starter }, true);
    expect(session.snapshot).toMatchObject({ tick: 1, outcome: 'ongoing', player: { x: 2, y: 3 } });
    expect(session.snapshot.enemy).toBeUndefined();
  });
  it('weist Angriff, Schleife und Bedingung in der ersten Aufgabe vor jeder Zustandsänderung zurück', () => {
    const lesson = getLesson(LESSON_IDS[0]); const session = new LessonSession(lesson, ARKANA_SPECIES.glutling.supported);
    const before = session.snapshot;
    for (const source of ['glutling.attack();', 'repeat(2, () => { glutling.moveRight(); });', 'if (glutling.enemyAdjacent) { glutling.moveRight(); }']) {
      expect(session.execute({ glutling: source }, true)).toContain('nicht freigegeben'); expect(session.snapshot).toEqual(before); expect(session.frames).toEqual([]);
    }
    expect(session.execute({ glutling: 'moveRight();' })).toContain('zugeordnet');
    expect(session.execute({ glutling: 'moosling.moveRight();' })).toContain('gehört');
  });
  it('erkennt das räumliche Ziel ohne sinnvolle Wiederholung als offene Lernübung', () => {
    const lesson = getLesson(LESSON_IDS[2]);
    for (const source of [
      'glutling.moveRight(); glutling.moveRight(); glutling.moveRight(); glutling.moveRight();',
      'repeat(2, () => {}); glutling.moveRight(); glutling.moveRight(); glutling.moveRight(); glutling.moveRight();',
      'repeat(1, () => { glutling.moveRight(); }); glutling.moveRight(); glutling.moveRight(); glutling.moveRight();',
    ]) {
      const session = new LessonSession(lesson, lesson.allowed);
      expect(session.execute({ glutling: source }, true)).toContain('Schleifenübung');
      expect(session.snapshot).toMatchObject({ outcome: 'incomplete', player: { x: 5, y: 3 } });
      expect(session.frames.at(-1)?.after.outcome).toBe('incomplete');
    }
  });
  it('verlangt auf dem Musterpfad die gemeinsam wiederholte Bewegungssequenz', () => {
    const lesson = getLesson('q04-musterpfad');
    for (const source of [
      'glutling.moveRight(); glutling.moveUp(); glutling.moveRight(); glutling.moveUp(); glutling.moveRight(); glutling.moveUp();',
      'repeat(1, () => { glutling.moveRight(); glutling.moveUp(); }); glutling.moveRight(); glutling.moveUp(); glutling.moveRight(); glutling.moveUp();',
      'repeat(1, () => { glutling.moveRight(); }); repeat(1, () => { glutling.moveUp(); }); repeat(1, () => { glutling.moveRight(); }); repeat(1, () => { glutling.moveUp(); }); repeat(1, () => { glutling.moveRight(); }); repeat(1, () => { glutling.moveUp(); });',
      'repeat(3, () => { repeat(1, () => { glutling.moveRight(); }); }); glutling.moveUp(); glutling.moveRight(); glutling.moveUp(); glutling.moveRight(); glutling.moveUp();',
      'repeat(3, () => { glutling.moveRight(); glutling.moveRight(); glutling.moveUp(); });',
      'repeat(2, () => { glutling.moveRight(); glutling.moveUp(); glutling.moveRight(); }); glutling.moveUp(); glutling.moveRight(); glutling.moveUp();',
    ]) {
      const session = new LessonSession(lesson, lesson.allowed);
      expect(session.execute({ glutling: source }, true)).toContain('Musterübung');
      expect(session.snapshot).toMatchObject({ outcome: 'incomplete', player: { x: 4, y: 1 } });
      expect(session.frames.at(-1)?.after.outcome).toBe('incomplete');
    }
  });
  it('erhält gültige Varianten und setzt den Musternachweis bei Neustart und Programmänderung zurück', () => {
    const lesson = getLesson('q04-musterpfad'); const session = new LessonSession(lesson, lesson.allowed);
    for (const source of [solutions[3], 'glutling.moveRight(); glutling.moveUp(); repeat(2, () => { glutling.moveRight(); glutling.moveUp(); });',
      'repeat(3, () => { repeat(1, () => { glutling.moveRight(); glutling.moveUp(); }); });']) {
      expect(session.execute({ glutling: source }, true)).toContain('Questziel erreicht');
      expect(session.snapshot.outcome).toBe('victory');
    }
    const singles = 'glutling.moveRight(); glutling.moveUp(); glutling.moveRight(); glutling.moveUp(); glutling.moveRight(); glutling.moveUp();';
    session.execute({ glutling: singles }, true); expect(session.snapshot.outcome).toBe('incomplete');
    session.reset(); expect(session.snapshot).toMatchObject({ tick: 0, outcome: 'ongoing' });
    session.execute({ glutling: solutions[3] }); session.execute({ glutling: solutions[3] });
    session.execute({ glutling: singles }); expect(session.snapshot).toMatchObject({ tick: 1, outcome: 'ongoing' });
  });
  it('sperrt den Angriff und Bedingungen auch mit einem alten vollständig freigeschalteten Arkana im Musterpfad', () => {
    const lesson = getLesson('q04-musterpfad'); const session = new LessonSession(lesson, ARKANA_SPECIES.glutling.supported);
    const before = session.snapshot;
    for (const source of ['glutling.attack();', 'if (glutling.enemyAdjacent) { glutling.moveRight(); }']) {
      expect(session.execute({ glutling: source }, true)).toContain('nicht freigegeben'); expect(session.snapshot).toEqual(before);
    }
    session.execute({ glutling: lesson.starter }, true); expect(session.snapshot).toMatchObject({ outcome: 'ongoing', tick: 1 });
    session.execute({ glutling: 'glutling.moveUp();' }, true); expect(session.snapshot.player).toMatchObject({ x: 1, y: 4 });
    expect(session.snapshot.log.at(-1)).toContain('blockiert');
  });
  it('prüft Hindernisse und Kartenränder ohne automatische Umgehung', () => {
    const lesson = getLesson(LESSON_IDS[0]); if (lesson.kind !== 'puzzle') throw new Error('puzzle expected');
    const engine = new PuzzleEngine(lesson); engine.step('MOVE_UP');
    expect(engine.snapshot.player).toMatchObject({ x: 1, y: 3 }); expect(engine.snapshot.log.at(-1)).toContain('blockiert');
    engine.step('MOVE_LEFT'); engine.step('MOVE_LEFT'); expect(engine.snapshot.player.x).toBe(0);
    expect(engine.snapshot.log.at(-1)).toContain('blockiert');
    engine.step('MOVE_DOWN'); expect(engine.snapshot.player.y).toBe(4);
    engine.step('MOVE_RIGHT'); expect(engine.snapshot.player.x).toBe(1);
  });
  it('erlaubt leere Entwürfe, erhält den Cursor bei Formatwechsel und startet geänderte Programme frisch', () => {
    const lesson = getLesson(LESSON_IDS[0]); const session = new LessonSession(lesson, lesson.allowed);
    expect(session.execute({ glutling: '' })).toContain('leer'); expect(session.snapshot.tick).toBe(0);
    session.execute({ glutling: solutions[0] });
    session.execute({ glutling: solutions[0].replaceAll('; ', ';\n') }); expect(session.snapshot.tick).toBe(2);
    session.execute({ glutling: 'glutling.moveUp();' }); expect(session.snapshot.tick).toBe(1); expect(session.snapshot.player.x).toBe(1);
    const nodes = compileActionPlan('glutling.moveLeft(); glutling.moveDown(); glutling.moveUp(); glutling.moveRight();', 'glutling').nodes!;
    expect(compileActionPlan(nodesToSource(nodes, 'glutling'), 'glutling').nodes).toEqual(nodes);
  });
});
