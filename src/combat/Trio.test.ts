import { describe, expect, it } from 'vitest';
import { BattleEngine } from './BattleEngine';
import { BattleSession } from './BattleSession';
import { partyMembers } from './Party';
import { compileActionPlan, nodesToSource } from './DecisionProgram';
import { nodesCapabilityError } from './CommandCatalog';
import { evaluateCondition } from './Conditions';
import { LessonSession } from './LessonSession';
import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';
import { getLesson } from '../gameplay/WorldQuests';
import { QUEST_SOLUTIONS } from '../test/questSolutions';
import type { ActionFrame, CombatAction } from './types';

const team = ['glutling', 'moosling', 'felsbock'] as const;
const steps = (felsbock: CombatAction) => ({ glutling: { kind: 'action' as const, action: 'WAIT' as const }, moosling: { kind: 'action' as const, action: 'WAIT' as const }, felsbock: { kind: 'action' as const, action: felsbock } });
function battle(felsbock = { x: 1, y: 4 }) {
  const engine = new BattleEngine({ felsbock, konstrukt: { x: 2, y: 3 } }, { initialHp: { glutling: 2 }, enemyAttackPower: 2 });
  engine.reset(false, 30, team); return engine;
}

describe('Felsbock und drei getrennte Programme', () => {
  it('bindet Felsbocks Befehle an sein Objekt und erhält sie beim Textwechsel', () => {
    const source = 'felsbock.coverAlly(); felsbock.stoneArmor(); felsbock.stoneStrike();';
    const parsed = compileActionPlan(source, 'felsbock'); expect(parsed.error).toBeUndefined();
    expect(compileActionPlan(nodesToSource(parsed.nodes!, 'felsbock'), 'felsbock').nodes).toEqual(parsed.nodes);
    expect(nodesCapabilityError(parsed.nodes!, 'felsbock', 0, ARKANA_SPECIES.felsbock.supported)).toBeUndefined();
    for (const source of ['stoneStrike();', 'glutling.flameStrike();', 'felsbock.flameStrike();']) expect(compileActionPlan(source, 'felsbock').error).toBeDefined();
    const heal = compileActionPlan('felsbock.healingMoss();', 'felsbock');
    expect(nodesCapabilityError(heal.nodes!, 'felsbock', 0, ARKANA_SPECIES.felsbock.supported)).toContain('nicht freigegeben');
  });
  it('belegt drei verschiedene Startfelder und berücksichtigt das dritte Arkana bei Bewegung und Abfragen', () => {
    const engine = new BattleEngine({ felsbock: { x: 2, y: 3 } }); engine.reset(false, 30, team);
    expect(new Set(partyMembers(engine.snapshot).map((unit) => `${unit.x},${unit.y}`)).size).toBe(3);
    expect(evaluateCondition(engine.snapshot, 'pathRightClear', 'glutling')).toBe(false);
    engine.runTick({ glutling: { kind: 'action', action: 'MOVE_RIGHT' } }); expect(engine.snapshot.player.x).toBe(1);
    expect(engine.snapshot.log.at(-1)).toContain('Felsbock');
    engine.runTick({ felsbock: { kind: 'action', action: 'MOVE_LEFT' } }); expect(engine.snapshot.additionalAllies?.[0].x).toBe(2);
  });
  it('führt alle drei in Teamreihenfolge aus und zählt Abklingzeit nur einmal pro gemeinsamem Schritt', () => {
    const engine = battle(); const frames: ActionFrame[] = [];
    engine.runTick(steps('COVER_ALLY'), true, (frame) => frames.push(frame));
    expect(frames.slice(0, 4).map((frame) => frame.actor)).toEqual([...team, 'konstrukt']);
    expect(engine.snapshot.player.hp).toBe(2); expect(engine.snapshot.additionalAllies?.[0].hp).toBe(6);
    expect(frames.at(-1)?.effects).toContainEqual(expect.objectContaining({ kind: 'cover', source: 'felsbock', target: 'glutling' }));
    engine.runTick(steps('STONE_ARMOR'), true);
    expect(engine.snapshot.additionalAllies?.[0].cooldowns?.COVER_ALLY).toBe(2);
    expect(engine.snapshot.additionalAllies?.[0].hp).toBe(6); expect(engine.snapshot.player.hp).toBe(2);
    expect(engine.snapshot.player.coveredBy).toBeUndefined();
    engine.runTick(steps('WAIT'), true); expect(engine.snapshot.player.hp).toBe(0);
  });
  it('übernimmt außerhalb der Deckungsreichweite keine Treffer und beachtet den Tod des Beschützers', () => {
    const engine = battle({ x: 4, y: 3 }); engine.runTick(steps('COVER_ALLY'), true);
    expect(engine.snapshot.additionalAllies?.[0].hp).toBe(6);
    const frames: ActionFrame[] = []; engine.runTick(steps('MOVE_RIGHT'), true, (frame) => frames.push(frame));
    expect(engine.snapshot.player.hp).toBe(0); expect(engine.snapshot.additionalAllies?.[0].hp).toBe(6);
    expect(frames.flatMap((frame) => frame.effects ?? []).some((effect) => effect.kind === 'cover')).toBe(false);
    const fragile = new BattleEngine({ konstrukt: { x: 2, y: 3 } }, { initialHp: { glutling: 2, felsbock: 1 }, enemyAttackPower: 2 }); fragile.reset(false, 30, team);
    fragile.runTick(steps('COVER_ALLY'), true); expect(fragile.snapshot.additionalAllies?.[0].hp).toBe(0);
    fragile.runTick(steps('WAIT'), true); expect(fragile.snapshot.player.hp).toBe(0); expect(fragile.snapshot.outcome).toBe('ongoing');
  });
  it('verbraucht ohne anderes lebendes Ziel keine Deckungs-Abklingzeit', () => {
    const solo = new BattleEngine(); solo.reset(false, 10, ['felsbock']); solo.runStep('COVER_ALLY');
    expect(solo.snapshot.player.cooldowns).toBeUndefined(); expect(solo.snapshot.log.at(-1)).toContain('Kein passendes');
  });
  it('setzt das dritte Programm fort, wenn die ersten beiden Arkana besiegt sind', () => {
    const session = new BattleSession(3, team, Object.fromEntries(team.map((id) => [id, ARKANA_SPECIES[id].supported])), {
      enemyActive: true, enemyHp: 30, enemyAttackPower: 2, initialHp: { glutling: 1, moosling: 1 }, spawns: { konstrukt: { x: 2, y: 3 }, moosling: { x: 2, y: 2 } },
    });
    session.execute(Object.fromEntries(team.map((id) => [id, `repeat(6, () => { ${id}.wait(); });`])), true);
    expect(session.snapshot.tick).toBe(6); expect(session.snapshot.player.hp).toBe(0); expect(session.snapshot.companion?.hp).toBe(0);
    expect(session.snapshot.additionalAllies?.[0].hp).toBeGreaterThan(0); expect(session.done).toBe(true);
    expect(session.frames.filter((frame) => frame.actor === 'felsbock')).toHaveLength(6);
  });
  it('verlangt im Dreierkampf echte Deckung und Schutz zusätzlich zu Brand und Heilung', () => {
    const quest = getLesson('q20-dreiklang'); if (quest.kind !== 'combat') throw new Error('Kampf erwartet');
    const session = new LessonSession({ ...quest, enemyActive: false }, quest.allowed);
    expect(session.execute({ ...QUEST_SOLUTIONS[quest.id], felsbock: '' }, true)).toContain('Treffer für einen Verbündeten');
    expect(session.snapshot.outcome).toBe('incomplete');
  });
});
