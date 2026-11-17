import { describe, expect, it } from 'vitest';
import { BattleEngine } from './BattleEngine';
import { PuzzleEngine } from './PuzzleEngine';
import { getLesson, WORLD_QUESTS } from '../gameplay/WorldQuests';
import { LessonSession } from './LessonSession';
import { QUEST_SOLUTIONS } from '../test/questSolutions';
import { evaluateCondition } from './Conditions';
import { compileActionPlan } from './DecisionProgram';
import { FACINGS, movementDelta, turnFacing } from './Movement';

describe('Blickrichtungsbezogene Arkana-Bewegung', () => {
  it('geht in allen vier Blickrichtungen vorwärts und rückwärts und dreht jeweils genau 90 Grad', () => {
    for (const facing of FACINGS) {
      const forward = movementDelta('MOVE_FORWARD', facing)!; const backward = movementDelta('MOVE_BACKWARD', facing)!;
      expect(backward.x + forward.x).toBe(0); expect(backward.y + forward.y).toBe(0);
      expect(Math.abs(forward.x) + Math.abs(forward.y)).toBe(1);
      expect(turnFacing(turnFacing(facing, 'TURN_RIGHT'), 'TURN_LEFT')).toBe(facing);
      let direction = facing; for (let i = 0; i < 4; i++) direction = turnFacing(direction, 'TURN_RIGHT'); expect(direction).toBe(facing);
    }
    const definition = getLesson('q12-steinrutsch'); if (definition.kind !== 'puzzle') throw new Error('Rätsel erwartet');
    const engine = new PuzzleEngine(definition); engine.step('TURN_LEFT');
    expect(engine.snapshot.player).toMatchObject({ x: 1, y: 5, facing: 'north' });
    engine.step('MOVE_FORWARD'); expect(engine.snapshot.player).toMatchObject({ x: 1, y: 4, facing: 'north' });
    engine.step('MOVE_BACKWARD'); expect(engine.snapshot.player).toMatchObject({ x: 1, y: 5, facing: 'north' });
    engine.reset(); expect(engine.snapshot.player.facing).toBe('east');
  });
  it('prüft Steine, Ränder und besetzte Felder in Blickrichtung und lässt Drehen auf belegungsfreien Feldern zu', () => {
    const definition = getLesson('q01-glutspur'); if (definition.kind !== 'puzzle') throw new Error('Rätsel erwartet');
    const puzzle = new PuzzleEngine(definition); expect(evaluateCondition(puzzle.snapshot, 'pathAheadClear')).toBe(true);
    puzzle.step('TURN_LEFT'); expect(evaluateCondition(puzzle.snapshot, 'pathAheadClear')).toBe(false);
    const battle = new BattleEngine({ moosling: { x: 1, y: 3 }, glutling: { x: 2, y: 3 } }); battle.reset(true);
    expect(evaluateCondition(battle.snapshot, 'pathAheadClear')).toBe(false); battle.runStep('MOVE_FORWARD'); expect(battle.snapshot.player.x).toBe(1);
    battle.runStep('TURN_LEFT'); expect(battle.snapshot.player).toMatchObject({ x: 1, y: 3, facing: 'north' }); expect(evaluateCondition(battle.snapshot, 'pathAheadClear')).toBe(true);
    const edge = battle.snapshot; edge.player.x = 0; edge.player.facing = 'west'; expect(evaluateCondition(edge, 'pathAheadClear')).toBe(false);
  });
  it('unterscheidet den relativen Vorwärtsschritt von der automatischen Gegnerannäherung', () => {
    expect(compileActionPlan('moosling.moveForward();', 'moosling').nodes).toEqual([{ kind: 'action', action: 'MOVE_FORWARD' }]);
    expect(compileActionPlan('moosling.moveTowardEnemy();', 'moosling').nodes).toEqual([{ kind: 'action', action: 'MOVE_TOWARD' }]);
    const engine = new BattleEngine(); engine.runStep('TURN_LEFT'); engine.runStep('MOVE_FORWARD'); expect(engine.snapshot.player).toMatchObject({ x: 1, y: 2, facing: 'north' });
    engine.runStep('MOVE_TOWARD'); expect(engine.snapshot.player.x).toBe(2);
  });
  it('hält Blickrichtungen im Dreierteam getrennt, blockiert belegte Felder und setzt alle Richtungen zurück', () => {
    const engine = new BattleEngine(); engine.reset(false, 20, ['glutling', 'moosling', 'felsbock']);
    engine.runTick({ glutling: { kind: 'action', action: 'TURN_LEFT' }, moosling: { kind: 'action', action: 'TURN_RIGHT' }, felsbock: { kind: 'action', action: 'TURN_RIGHT' } });
    engine.runTick({ glutling: { kind: 'action', action: 'MOVE_FORWARD' }, moosling: { kind: 'action', action: 'MOVE_BACKWARD' }, felsbock: { kind: 'action', action: 'MOVE_FORWARD' } });
    expect(engine.snapshot.player).toMatchObject({ x: 1, y: 3, facing: 'north' });
    expect(engine.snapshot.companion).toMatchObject({ x: 1, y: 1, facing: 'south' });
    expect(engine.snapshot.additionalAllies?.[0]).toMatchObject({ x: 1, y: 5, facing: 'south' });
    engine.reset(false, 20, ['glutling', 'moosling', 'felsbock']);
    expect([engine.snapshot.player, engine.snapshot.companion!, ...engine.snapshot.additionalAllies!].every((unit) => unit.facing === 'east')).toBe(true);
    const active = new BattleEngine({ konstrukt: { x: 2, y: 3 } });
    active.runStep('TURN_LEFT', true); expect(active.snapshot).toMatchObject({ tick: 1, player: { x: 1, y: 3, hp: 4, facing: 'north' } });
  });
  it('zählt auch Drehungen im begrenzten Aktionsbudget', () => {
    const source = 'repeat(6, () => { repeat(6, () => { glutling.moveForward(); }); }); repeat(4, () => { repeat(6, () => { glutling.turnLeft(); }); }); repeat(4, () => { glutling.turnRight(); });';
    expect(compileActionPlan(source, 'glutling').error).toBeUndefined();
    expect(compileActionPlan(`${source} glutling.turnRight();`, 'glutling').error).toContain('64');
  });
  for (const lesson of WORLD_QUESTS) it(`${lesson.id}: erreicht mit dem relativen Beispielprogramm das vollständige Lernziel`, () => {
    const session = new LessonSession(lesson, lesson.allowed); const feedback = session.execute(QUEST_SOLUTIONS[lesson.id], true);
    expect(session.snapshot.outcome, `${feedback}\n${session.snapshot.log.join('\n')}`).toBe('victory');
  });
});
