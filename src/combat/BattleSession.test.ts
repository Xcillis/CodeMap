import { describe, expect, it } from 'vitest';
import { BattleSession, missionPrograms } from './BattleSession';
import { BattleEngine } from './BattleEngine';
import { blocksToSource, compileActionPlan } from './DecisionProgram';

describe('Arkan-Programme', () => {
  it('erhält Glutlings Identität beim Block-Text-Roundtrip', () => {
    const source = 'repeat(2, () => { if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); } });';
    const parsed = compileActionPlan(source, 'glutling');
    expect(parsed.actor).toBe('glutling');
    expect(compileActionPlan(blocksToSource(parsed.blocks!, 'glutling'), 'glutling')).toEqual(parsed);
  });

  it('lehnt unbenannte, gemischte und fremde Befehle ab', () => {
    expect(compileActionPlan('repeat(2, () => { attack(); });').error).toBeDefined();
    expect(compileActionPlan('repeat(2, () => { glutling.attack(); });', 'moosling').error).toBeDefined();
    expect(compileActionPlan('repeat(2, () => { moosling.attack(); }); repeat(1, () => { glutling.attack(); });').error).toBeDefined();
  });
});

describe('Formation und Feldbelegung', () => {
  it('blockiert einen Zug auf das Feld eines Verbündeten', () => {
    const battle = new BattleEngine({ moosling: { x: 1, y: 3 }, glutling: { x: 2, y: 3 } });
    battle.reset(true, 5);
    battle.runTick({ moosling: { kind: 'action', action: 'MOVE_TOWARD' } });
    expect(battle.snapshot.player.x).toBe(1);
    expect(battle.snapshot.log.some((line) => line.includes('Feld von Glutling belegt'))).toBe(true);
  });

  it('lässt pro Tick jeden Arkan ausschließlich seinen eigenen Befehl ausführen', () => {
    const battle = new BattleEngine();
    battle.reset(true, 5);
    battle.runTick({ moosling: { kind: 'action', action: 'ATTACK' }, glutling: { kind: 'action', action: 'MOVE_TOWARD' } });
    expect(battle.snapshot.player.x).toBe(1);
    expect(battle.snapshot.companion?.x).toBe(2);
    expect(battle.snapshot.log.join('\n')).toContain('glutling.moveForward()');
  });

  it('kann nach dem Freigeben eines Feldes in stabiler Reihenfolge nachrücken', () => {
    const battle = new BattleEngine({ moosling: { x: 2, y: 3 }, glutling: { x: 1, y: 3 } });
    battle.reset(true);
    battle.runTick({ moosling: { kind: 'action', action: 'MOVE_TOWARD' }, glutling: { kind: 'action', action: 'MOVE_TOWARD' } });
    expect(battle.snapshot.player.x).toBe(3);
    expect(battle.snapshot.companion?.x).toBe(2);
  });
});

describe('Missionsausführung', () => {
  for (const mission of [1, 2, 3] as const) {
    it(`liefert für Mission ${mission} schrittweise und vollständig das gleiche Ergebnis`, () => {
      const full = new BattleSession(mission);
      const step = new BattleSession(mission);
      const sources = missionPrograms(mission);
      full.execute(sources, true);
      for (let index = 0; index < 12; index += 1) step.execute(sources);
      expect(step.snapshot).toEqual(full.snapshot);
      expect(full.snapshot.outcome).toBe('victory');
      expect(Boolean(full.snapshot.companion)).toBe(mission === 3);
      full.reset();
      expect(full.snapshot.enemy.maxHp).toBe(mission === 3 ? 5 : 3);
      full.execute(sources, true);
      expect(full.snapshot).toEqual(step.snapshot);
    });
  }

  it('verändert bei einem Fehler in Glutlings Programm keine Einheit', () => {
    const session = new BattleSession(3);
    const before = session.snapshot;
    expect(session.execute({ ...missionPrograms(3), glutling: 'attack();' }, true)).toContain('glutling');
    expect(session.snapshot).toEqual(before);
  });

  it('wartet bei kürzerem Programm und führt das längere weiter aus', () => {
    const session = new BattleSession(3);
    session.execute({ moosling: 'repeat(1, () => { moosling.attack(); });', glutling: 'repeat(3, () => { glutling.moveForward(); });' }, true);
    expect(session.snapshot.tick).toBe(3);
    expect(session.snapshot.player.x).toBe(1);
    expect(session.snapshot.companion?.x).toBe(4);
  });

  it('behält beim Formatwechsel den Cursor, startet bei Programmänderung aber frisch', () => {
    const session = new BattleSession(1);
    const sources = missionPrograms(1);
    session.execute(sources);
    session.execute({ moosling: sources.moosling!.replace(/\n/g, ' ') });
    expect(session.snapshot.tick).toBe(2);
    session.execute({ moosling: 'repeat(2, () => { moosling.attack(); });' });
    expect(session.snapshot.tick).toBe(1);
    expect(session.snapshot.player.x).toBe(1);
  });
});
