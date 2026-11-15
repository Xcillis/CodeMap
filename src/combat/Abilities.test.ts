import { describe, expect, it } from 'vitest';
import { BattleEngine } from './BattleEngine';
import { BattleSession } from './BattleSession';
import { compileActionPlan, nodesToSource } from './DecisionProgram';
import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';
import { getLesson } from '../gameplay/WorldQuests';
import { LessonSession } from './LessonSession';
import { QUEST_SOLUTIONS } from '../test/questSolutions';
import type { ActionFrame, CombatAction } from './types';

const duo = (glutling: CombatAction, moosling: CombatAction) => ({ glutling: { kind: 'action' as const, action: glutling }, moosling: { kind: 'action' as const, action: moosling } });

describe('Artspezifische RPG-Fähigkeiten', () => {
  it('wandelt alte Basisangriffe in artspezifische Namen um und weist fremde Artenmethoden zurück', () => {
    for (const [actor, method] of [['glutling', 'flameStrike'], ['moosling', 'vineStrike']] as const) {
      const old = compileActionPlan(`${actor}.attack();`, actor); const typed = compileActionPlan(`${actor}.${method}();`, actor);
      expect(typed.nodes).toEqual(old.nodes); expect(nodesToSource(old.nodes!, actor)).toBe(`${actor}.${method}();`);
    }
    expect(compileActionPlan('moosling.flameStrike();', 'moosling').error).toBeDefined();
    expect(compileActionPlan('glutling.vineStrike();', 'glutling').error).toBeDefined();
  });
  it('lässt Brand und Abklingzeit einmal pro gemeinsamem Schritt laufen, nicht pro Teammitglied', () => {
    const engine = new BattleEngine({ glutling: { x: 1, y: 3 }, konstrukt: { x: 3, y: 3 } }); engine.reset(true, 20, ['glutling', 'moosling']);
    const frames: ActionFrame[] = [];
    engine.runTick(duo('IGNITE', 'WAIT'), false, (frame) => frames.push(frame));
    expect(engine.snapshot.enemy).toMatchObject({ hp: 18, burning: { remaining: 2 } });
    expect(frames.filter((frame) => frame.periodic)).toHaveLength(1);
    engine.runTick(duo('IGNITE', 'WAIT')); expect(engine.snapshot.enemy.hp).toBe(17);
    expect(engine.snapshot.player.cooldowns?.IGNITE).toBe(2); expect(engine.snapshot.log.some((line) => line.includes('noch nicht bereit'))).toBe(true);
    engine.runTick(duo('WAIT', 'WAIT')); expect(engine.snapshot.enemy).toMatchObject({ hp: 16 }); expect(engine.snapshot.enemy.burning).toBeUndefined();
    engine.runTick(duo('IGNITE', 'WAIT')); expect(engine.snapshot.enemy.hp).toBe(14);
    engine.reset(true, 20, ['glutling', 'moosling']); expect(engine.snapshot.enemy.burning).toBeUndefined(); expect(engine.snapshot.player.cooldowns).toBeUndefined();
  });
  it('verhindert mit Ranken Bewegung, erlaubt benachbarte Angriffe aber weiterhin', () => {
    const engine = new BattleEngine({ konstrukt: { x: 3, y: 3 } }); engine.reset(false, 10);
    const effects: string[] = []; engine.runStep('VINE_SNARE', true, (frame) => effects.push(...(frame.effects ?? []).map((effect) => effect.kind)));
    expect(engine.snapshot.enemy.x).toBe(3); expect(effects).toContain('root');
    engine.runStep('MOVE_RIGHT', true); expect(engine.snapshot.player.hp).toBe(4); expect(engine.snapshot.enemy.rooted).toBeUndefined();
    engine.runStep('MOVE_LEFT', true); expect(engine.snapshot.enemy.x).toBe(2);
  });
  it('zieht Angriffe mit Rindenwacht um und fängt Schaden nur während der Schutzdauer ab', () => {
    const engine = new BattleEngine({ konstrukt: { x: 2, y: 2 } }, { enemyActive: true, enemyAttackPower: 2 }); engine.reset(true, 20, ['glutling', 'moosling']);
    expect(engine.snapshot.enemyIntent?.target).toBe('glutling'); const frames: ActionFrame[] = [];
    engine.runTick(duo('WAIT', 'BARK_GUARD'), true, (frame) => frames.push(frame));
    expect(frames.at(-1)?.after).toEqual(engine.snapshot);
    expect(engine.snapshot.enemyIntent?.target).toBe('moosling'); expect(engine.snapshot.companion?.hp).toBe(5);
    expect(frames.flatMap((frame) => frame.effects ?? []).some((effect) => effect.kind === 'guard' && effect.amount === 2)).toBe(true);
    frames.length = 0; engine.runTick(duo('WAIT', 'WAIT'), true, (frame) => frames.push(frame)); expect(engine.snapshot.companion?.protection).toBeUndefined(); expect(engine.snapshot.enemyIntent?.target).toBe('glutling');
    expect(frames.at(-1)?.after).toEqual(engine.snapshot);
  });
  it('heilt den niedrigsten lebenden LP-Anteil, niemals über das Maximum und nicht sofort komplett', () => {
    const engine = new BattleEngine(undefined, { initialHp: { glutling: 1, moosling: 2 } }); engine.reset(true, 20, ['glutling', 'moosling']);
    engine.runTick(duo('WAIT', 'HEALING_MOSS')); expect(engine.snapshot.player.hp).toBe(2); expect(engine.snapshot.companion?.hp).toBe(2);
    engine.runTick(duo('WAIT', 'WAIT')); engine.runTick(duo('WAIT', 'WAIT'));
    expect(engine.snapshot.player.hp).toBe(4); expect(engine.snapshot.player.regeneration).toBeUndefined();
  });
  it('verbraucht bei ungültigem Ziel keine Abklingzeit und verhindert fremde Fähigkeiten auch direkt in der Engine', () => {
    const engine = new BattleEngine(); engine.runStep('HEALING_MOSS'); expect(engine.snapshot.player.cooldowns).toBeUndefined();
    engine.runStep('IGNITE'); expect(engine.snapshot.enemy.burning).toBeUndefined();
    const fire = new BattleEngine({ konstrukt: { x: 6, y: 6 } }); fire.reset(false, 10, ['glutling']); fire.runStep('IGNITE');
    expect(fire.snapshot.player.cooldowns).toBeUndefined(); expect(fire.snapshot.enemy.hp).toBe(10);
    const session = new BattleSession(3, ['glutling', 'moosling'], { glutling: ARKANA_SPECIES.glutling.supported, moosling: ARKANA_SPECIES.moosling.supported });
    const before = session.snapshot;
    expect(session.execute({ glutling: 'glutling.healingMoss();', moosling: 'moosling.ignite();' }, true)).toContain('nicht freigegeben');
    expect(session.snapshot).toEqual(before); expect(session.frames).toHaveLength(0);
  });
  it('lässt ein überlebendes Arkana weiterkämpfen und überspringt das besiegte Teammitglied', () => {
    const engine = new BattleEngine({ konstrukt: { x: 2, y: 3 }, moosling: { x: 2, y: 2 } }, { initialHp: { glutling: 1 }, enemyAttackPower: 2 }); engine.reset(true, 10, ['glutling', 'moosling']);
    engine.runTick(duo('WAIT', 'WAIT'), true); expect(engine.snapshot).toMatchObject({ outcome: 'ongoing', player: { hp: 0 }, companion: { hp: 5 } });
    const frames: ActionFrame[] = []; engine.runTick(duo('ATTACK', 'ATTACK'), true, (frame) => frames.push(frame));
    expect(frames.some((frame) => frame.actor === 'glutling')).toBe(false); expect(engine.snapshot.enemy.hp).toBe(9); expect(engine.snapshot.companion?.hp).toBe(3);
  });
  it('ordnet anhaltende Effekte keiner erneut ausgeführten Codezeile zu', () => {
    const session = new BattleSession(3, ['glutling', 'moosling'], { glutling: ARKANA_SPECIES.glutling.supported, moosling: ARKANA_SPECIES.moosling.supported }, { enemyHp: 20, spawns: { konstrukt: { x: 3, y: 3 } } });
    session.execute({ glutling: 'glutling.ignite(); glutling.wait();', moosling: 'moosling.wait(); moosling.wait();' }, true);
    expect(session.frames.filter((frame) => frame.periodic)).toHaveLength(2); expect(session.frames.filter((frame) => frame.periodic).every((frame) => !frame.trace)).toBe(true);
  });
  it('beendet den Gesamtlauf, wenn nur das Programm eines besiegten Arkana Schritte übrig hat', () => {
    const session = new BattleSession(3, ['glutling', 'moosling'], { glutling: ARKANA_SPECIES.glutling.supported, moosling: ARKANA_SPECIES.moosling.supported },
      { enemyHp: 20, enemyActive: true, enemyAttackPower: 2, initialHp: { glutling: 1 }, spawns: { konstrukt: { x: 2, y: 3 } } });
    session.execute({ glutling: 'repeat(6, () => { glutling.wait(); });', moosling: 'moosling.wait();' }, true);
    expect(session.snapshot).toMatchObject({ tick: 1, outcome: 'ongoing', player: { hp: 0 } }); expect(session.done).toBe(true);
  });
  it('verlangt echte Fähigkeitseffekte und lässt die vier Rollenquests schrittweise und komplett gewinnen', () => {
    for (const id of ['q14-feuerprobe', 'q15-wurzelschutz', 'q16-heilmoos', 'q17-teamrollen'] as const) {
      const quest = getLesson(id); const full = new LessonSession(quest, quest.allowed); const step = new LessonSession(quest, quest.allowed);
      full.execute(QUEST_SOLUTIONS[id], true); expect(full.snapshot.outcome, id).toBe('victory');
      for (let i = 0; i < 12 && step.snapshot.outcome === 'ongoing'; i++) step.execute(QUEST_SOLUTIONS[id]);
      expect(step.snapshot).toEqual(full.snapshot); expect(full.frames.some((frame) => frame.effects?.length)).toBe(true);
    }
    const quest = getLesson('q14-feuerprobe'); const singles = new LessonSession(quest, quest.allowed);
    singles.execute({ glutling: 'glutling.moveRight(); repeat(4, () => { glutling.flameStrike(); });' }, true);
    // This quest intentionally has no loop permission; try a valid sequence instead.
    singles.execute({ glutling: 'glutling.moveRight(); glutling.flameStrike(); glutling.flameStrike(); glutling.flameStrike(); glutling.flameStrike();' }, true);
    expect(singles.snapshot).toMatchObject({ outcome: 'incomplete', enemy: { hp: 0 } });
  });
});
