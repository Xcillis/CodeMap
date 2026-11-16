import { describe, expect, it } from 'vitest';
import { NPC_BEHAVIORS, NpcPatrol, npcShouldPause } from './NpcPatrol';
import { QUEST_GIVERS, type QuestGiverId } from './QuestNetwork';
import { InteractionController } from './InteractionController';
import { valleyBlocked } from '../world/ValleyLayout';
import { forestBlocked } from '../world/ForestLayout';

describe('Ruhige Questgeber und kurze Patrouillen', () => {
  it('hält Eldren, Neria und Tala an ihrem Ort, während andere Questgeber hin- und zurückgehen', () => {
    for (const id of Object.keys(QUEST_GIVERS) as QuestGiverId[]) {
      const anchor = QUEST_GIVERS[id]; const behavior = NPC_BEHAVIORS[id]; const patrol = new NpcPatrol(anchor, behavior); const horizontal = new Set<number>();
      for (let step = 0; step < 1800; step++) {
        const next = patrol.step(50, false); if (next.moving) horizontal.add(Math.sign(next.dx));
        if (behavior.kind === 'idle') expect(patrol.position).toEqual({ x: anchor.x, y: anchor.y });
        else { expect(next.x).toBeGreaterThanOrEqual(anchor.x); expect(next.x).toBeLessThanOrEqual(anchor.x + behavior.offset.x); }
      }
      expect(horizontal.size).toBe(behavior.kind === 'idle' ? 0 : 2);
    }
  });
  it('friert Weg und Wartezeit bei Nähe, Dialog oder Menü ein und setzt danach ohne Sprung fort', () => {
    const patrol = new NpcPatrol({ x: 100, y: 100 }, { kind: 'patrol', offset: { x: 30, y: 0 }, speed: 20, pauseMs: 100 });
    expect(npcShouldPause(patrol.position, { x: 150, y: 100 }, false)).toBe(true); expect(npcShouldPause(patrol.position, { x: 500, y: 500 }, true)).toBe(true);
    patrol.step(100, false); patrol.step(100, false); const before = patrol.position;
    for (let i = 0; i < 50; i++) expect(patrol.step(100, true).moving).toBe(false);
    expect(patrol.position).toEqual(before); const resumed = patrol.step(10000, false);
    expect(resumed.x - before.x).toBeCloseTo(2); expect(resumed.moving).toBe(true);
  });
  it('hält alle authored Wege von Wasser, Steinen und Bäumen frei und stoppt bei einer neuen Sperre', () => {
    for (const id of Object.keys(QUEST_GIVERS) as QuestGiverId[]) {
      const anchor = QUEST_GIVERS[id]; const behavior = NPC_BEHAVIORS[id]; if (behavior.kind === 'idle') continue;
      for (let i = 0; i <= 20; i++) {
        const point = { x: anchor.x + behavior.offset.x * i / 20, y: anchor.y + behavior.offset.y * i / 20 };
        expect(anchor.region === 'valley' ? valleyBlocked(point, false, 18) : forestBlocked(point, 18), id).toBe(false);
      }
    }
    const blocked = new NpcPatrol({ x: 0, y: 0 }, { kind: 'patrol', offset: { x: 20, y: 0 }, speed: 20, pauseMs: 0 });
    expect(blocked.step(100, false, () => false)).toMatchObject({ x: 0, y: 0, moving: false });
  });
  it('hält Interaktionen am aktuellen Ort und stellt entfernte Ziele beim Bewegen nicht wieder her', () => {
    const target = { id: 'giver:brann', label: 'Brann', x: 440, y: 390, range: 10 }; const controller = new InteractionController([target]);
    controller.moveTarget(target.id, 488, 390); expect(controller.nearestTo(440, 390)).toBeUndefined(); expect(controller.nearestTo(488, 390)?.id).toBe(target.id);
    controller.setTargets([target]); expect(controller.nearestTo(488, 390)?.label).toBe('Brann');
    controller.removeTarget(target.id); controller.moveTarget(target.id, 440, 390); expect(controller.nearestTo(440, 390)).toBeUndefined();
  });
});
