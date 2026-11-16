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
        const next = patrol.step(50, false); if (next.moving && next.dx) horizontal.add(Math.sign(next.dx));
        if (behavior.kind === 'idle') expect(patrol.position).toEqual({ x: anchor.x, y: anchor.y });
        else if (behavior.kind === 'patrol') { expect(next.x).toBeGreaterThanOrEqual(anchor.x); expect(next.x).toBeLessThanOrEqual(anchor.x + behavior.offset.x); }
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
  it('hält sämtliche Wegabschnitte von Wasser, Steinen und Bäumen frei und stoppt bei einer neuen Sperre', () => {
    for (const id of Object.keys(QUEST_GIVERS) as QuestGiverId[]) {
      const anchor = QUEST_GIVERS[id]; const behavior = NPC_BEHAVIORS[id]; if (behavior.kind === 'idle') continue;
      const points = behavior.kind === 'route' ? [{ x: anchor.x, y: anchor.y }, ...behavior.points, behavior.points[0]] : [anchor, { x: anchor.x + behavior.offset.x, y: anchor.y + behavior.offset.y }];
      for (let segment = 1; segment < points.length; segment++) {
        const start = points[segment - 1]; const end = points[segment]; const steps = Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / 2);
        for (let i = 0; i <= steps; i++) {
          const point = { x: start.x + (end.x - start.x) * i / steps, y: start.y + (end.y - start.y) * i / steps };
          expect(anchor.region === 'valley' ? valleyBlocked(point, false, 18) : forestBlocked(point, 18), `${id}:${point.x},${point.y}`).toBe(false);
          if (id === 'brann') for (const [otherId, giver] of Object.entries(QUEST_GIVERS)) {
            if (otherId !== id && giver.region === anchor.region) expect(Math.hypot(point.x - giver.x, point.y - giver.y)).toBeGreaterThan(50);
          }
        }
      }
    }
    const blocked = new NpcPatrol({ x: 0, y: 0 }, { kind: 'patrol', offset: { x: 20, y: 0 }, speed: 20, pauseMs: 0 });
    expect(blocked.step(100, false, () => false)).toMatchObject({ x: 0, y: 0, moving: false });
  });
  it('führt Brann wiederholt durch das Tal in alle vier Richtungen und erhält den Rundgang beim Anhalten', () => {
    const behavior = NPC_BEHAVIORS.brann; if (behavior.kind !== 'route') throw new Error('Brann benötigt einen Rundgang');
    const patrol = new NpcPatrol(QUEST_GIVERS.brann, behavior); const directions = new Set<string>(); const reached = new Set<number>();
    for (let tick = 0; tick < 3600; tick++) {
      const next = patrol.step(50, false, (point) => !valleyBlocked(point, false, 18));
      if (next.dx) directions.add(next.dx > 0 ? 'right' : 'left');
      if (next.dy) directions.add(next.dy > 0 ? 'down' : 'up');
      behavior.points.forEach((point, index) => { if (Math.hypot(point.x - next.x, point.y - next.y) < .001) reached.add(index); });
      if (tick === 250) { const before = patrol.position; for (let pause = 0; pause < 100; pause++) patrol.step(100, true); expect(patrol.position).toEqual(before); }
    }
    expect(directions).toEqual(new Set(['right', 'down', 'left', 'up'])); expect(reached.size).toBe(behavior.points.length);
    const blocked = new NpcPatrol({ x: 0, y: 0 }, { kind: 'route', speed: 20, pauseMs: 0, points: [{ x: 50, y: 0 }, { x: 50, y: 50 }] });
    for (let tick = 0; tick < 50; tick++) blocked.step(100, false, () => false);
    expect(blocked.position).toEqual({ x: 0, y: 0 }); expect(blocked.step(100, false)).toMatchObject({ x: 2, y: 0, dy: 0 });
  });
  it('hält Interaktionen am aktuellen Ort und stellt entfernte Ziele beim Bewegen nicht wieder her', () => {
    const target = { id: 'giver:brann', label: 'Brann', x: 440, y: 390, range: 10 }; const controller = new InteractionController([target]);
    controller.moveTarget(target.id, 488, 390); expect(controller.nearestTo(440, 390)).toBeUndefined(); expect(controller.nearestTo(488, 390)?.id).toBe(target.id);
    controller.setTargets([target]); expect(controller.nearestTo(488, 390)?.label).toBe('Brann');
    controller.removeTarget(target.id); controller.moveTarget(target.id, 440, 390); expect(controller.nearestTo(440, 390)).toBeUndefined();
  });
});
