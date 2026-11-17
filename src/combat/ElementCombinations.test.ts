import { describe, expect, it } from 'vitest';
import { BattleEngine } from './BattleEngine';
import { castAbility } from './Abilities';
import { applyCold, freezeSurface } from './StateReactions';
import { statusLabels } from './CombatPresentation';
import { evaluateCondition } from './Conditions';
import type { ActionFrame, Combatant } from './types';
import { LessonSession } from './LessonSession';
import { getLesson } from '../gameplay/WorldQuests';
import { QUEST_SOLUTIONS } from '../test/questSolutions';

describe('Gemeinsame Zustandsreaktionen', () => {
  it('verstärkt direkten Feuerangriff nur bei bestehendem Brand, verbraucht ihn und erzeugt keine neue Anwendung', () => {
    const engine = new BattleEngine({ konstrukt: { x: 2, y: 3 } }); engine.reset(false, 30, ['glutling']);
    engine.runStep('ATTACK'); expect(engine.snapshot.enemy.hp).toBe(28);
    engine.runStep('IGNITE'); expect(engine.snapshot.enemy.hp).toBe(26);
    const frames: ActionFrame[] = []; engine.runStep('ATTACK', false, (frame) => frames.push(frame));
    expect(engine.snapshot.enemy.hp).toBe(23); expect(engine.snapshot.enemy.burning).toBeUndefined();
    expect(frames.flatMap((frame) => frame.effects ?? []).filter((effect) => effect.kind === 'combo')).toHaveLength(1);
    engine.runStep('ATTACK'); expect(engine.snapshot.enemy.hp).toBe(21);
    engine.runStep('IGNITE'); engine.runStep('WAIT'); engine.runStep('WAIT');
    expect(engine.snapshot.enemy.burning).toBeUndefined(); const hp = engine.snapshot.enemy.hp;
    engine.runStep('ATTACK'); expect(engine.snapshot.enemy.hp).toBe(hp - 2);
  });
  it('teilt Kälte zwischen Quellen, ersetzt Kühlung und verbraucht Frost erst bei einer echten regulären Aktion', () => {
    const engine = new BattleEngine({ konstrukt: { x: 2, y: 3 } }); engine.reset(false, 20, ['frostmolch']);
    engine.runStep('CHILL'); expect(engine.snapshot.enemy.chilled?.remaining).toBe(2);
    expect(statusLabels(engine.snapshot.enemy).join()).toContain('Kälte 1/2');
    engine.runStep('CHILL'); expect(engine.snapshot.enemy.frozen?.remaining).toBe(1); expect(engine.snapshot.enemy.chilled).toBeUndefined();
    engine.runStep('WAIT'); expect(engine.snapshot.enemy.frozen).toBeDefined();
    const before = engine.snapshot.player.hp; const frames: ActionFrame[] = [];
    engine.runStep('WAIT', true, (frame) => frames.push(frame)); expect(engine.snapshot.player.hp).toBe(before);
    expect(engine.snapshot.enemy.frozen).toBeUndefined(); expect(frames.flatMap((frame) => frame.effects ?? []).some((effect) => effect.kind === 'freeze')).toBe(true);
    engine.runStep('WAIT', true); expect(engine.snapshot.player.hp).toBe(before - 1);
    const target: Combatant = { id: 'konstrukt', name: 'Ziel', x: 0, y: 0, hp: 5, maxHp: 5, guarding: false };
    expect(applyCold(target, 'glutling')).toBe('chilled'); expect(applyCold(target, 'frostmolch')).toBe('frozen'); expect(target.frozen?.source).toBe('frostmolch');
  });
  it('lässt Kühlung ablaufen und eine erst später erneut angewendete Kälte wieder bei 1/2 beginnen', () => {
    const engine = new BattleEngine(); engine.reset(false, 20, ['frostmolch']);
    // Range failures must not consume cooldown or apply partial statuses.
    engine.runStep('CHILL'); expect(engine.snapshot.enemy.chilled).toBeUndefined(); expect(engine.snapshot.player.cooldowns?.CHILL).toBeUndefined();
    const near = new BattleEngine({ konstrukt: { x: 2, y: 3 } }); near.reset(false, 20, ['frostmolch']);
    near.runStep('CHILL'); near.runStep('WAIT'); near.runStep('WAIT'); expect(near.snapshot.enemy.chilled).toBeUndefined();
    near.runStep('CHILL'); expect(near.snapshot.enemy.chilled).toBeDefined(); expect(near.snapshot.enemy.frozen).toBeUndefined();
  });
  it('löscht Gegner und brennende Verbündete, respektiert Reichweite und verhindert weitere Brandimpulse', () => {
    const engine = new BattleEngine({ konstrukt: { x: 2, y: 3 } }, { initialBurning: ['glutling', 'konstrukt'] }); engine.reset(false, 20, ['glutling', 'frostmolch']);
    engine.runTick({ frostmolch: { kind: 'action', action: 'EXTINGUISH_ENEMY' } }); expect(engine.snapshot.enemy.burning).toBeUndefined(); expect(engine.snapshot.player.hp).toBe(3);
    engine.runTick({ frostmolch: { kind: 'action', action: 'EXTINGUISH_ALLY' } }); expect(engine.snapshot.player.burning).toBeUndefined(); expect(engine.snapshot.player.hp).toBe(3);
    expect(evaluateCondition(engine.snapshot, 'allyBurning', 'frostmolch')).toBe(false);
    engine.runTick({ frostmolch: { kind: 'action', action: 'WAIT' } }); expect(engine.snapshot.player.hp).toBe(3);
    const state = engine.snapshot; const actor = state.companion!; delete actor.cooldowns;
    expect(castAbility(state, actor, 'EXTINGUISH_ENEMY', () => {})).toEqual([]); expect(actor.cooldowns).toBeUndefined();
    state.enemy.burning = { source: 'glutling', remaining: 2 }; actor.x = 6; actor.y = 6;
    expect(castAbility(state, actor, 'EXTINGUISH_ENEMY', () => {})).toEqual([]); expect(state.enemy.burning).toBeDefined();
  });
  it('nutzt dieselbe Wasser-Eis-Reaktion im Kampf und im Rätsel und sperrt tiefes Wasser', () => {
    const engine = new BattleEngine({ konstrukt: { x: 5, y: 3 } }, { surfaces: [{ x: 2, y: 3, kind: 'water', shallow: true }] }); engine.reset(false, 20, ['frostmolch']);
    expect(evaluateCondition(engine.snapshot, 'waterAhead', 'frostmolch')).toBe(true);
    engine.runStep('MOVE_FORWARD'); expect(engine.snapshot.player.x).toBe(1);
    engine.runStep('CHILL'); expect(evaluateCondition(engine.snapshot, 'iceAhead', 'frostmolch')).toBe(true);
    engine.runStep('MOVE_FORWARD'); expect(engine.snapshot.player.x).toBe(2);
    expect(freezeSurface({ x: 1, y: 1, kind: 'water', shallow: false })).toBe(false);
    engine.reset(false, 20, ['frostmolch']); expect(engine.snapshot.surfaces?.[0].kind).toBe('water');
    const lesson = getLesson('q26-eisbruecke'); const session = new LessonSession(lesson, lesson.allowed);
    session.execute(QUEST_SOLUTIONS[lesson.id], true); expect(session.snapshot.outcome).toBe('victory'); expect(session.snapshot.surfaces?.every((tile) => tile.kind === 'ice')).toBe(true);
    session.reset(); session.execute({ frostmolch: 'repeat(4, () => { frostmolch.moveForward(); });' }, true); expect(session.snapshot.player.x).toBe(1);
  });
  it('zählt in der Löschquest beide realen Ziele statt nur einer beliebigen Löschaktion', () => {
    const quest = getLesson('q25-loeschen'); const session = new LessonSession(quest, quest.allowed);
    session.execute({ glutling: 'glutling.wait(); glutling.wait(); glutling.flameStrike();', frostmolch: 'frostmolch.extinguishEnemy();' }, true);
    expect(session.snapshot.outcome).toBe('incomplete');
    session.execute(QUEST_SOLUTIONS[quest.id], true); expect(session.snapshot.outcome).toBe('victory');
  });
});
