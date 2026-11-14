import { describe, expect, it } from 'vitest';
import { VALLEY_CLIFFS, VALLEY_PASS, REGIONS, WORLD_SIZE } from './WorldRegions';
import { QUEST_GIVERS, QUEST_ROUTES, normalizeCompletions } from './QuestNetwork';
import { LESSON_IDS } from './WorldQuests';

describe('Getrennte und begehbare Gebiete', () => {
  it('lässt durch die östliche Bergwand nur den gesperrten Pass und nach Räumung diesen Durchgang offen', () => {
    const contains = (r: { x: number; y: number; width: number; height: number }, y: number) => y >= r.y - r.height / 2 && y <= r.y + r.height / 2;
    for (let y = 0; y <= WORLD_SIZE.height; y += 5) expect([...VALLEY_CLIFFS, VALLEY_PASS].some((r) => contains(r, y))).toBe(true);
    expect(VALLEY_CLIFFS.some((r) => contains(r, 520))).toBe(false); expect(VALLEY_CLIFFS.some((r) => contains(r, 200))).toBe(true);
    expect(REGIONS.valley.exit.x).toBeGreaterThan(VALLEY_PASS.x + VALLEY_PASS.width / 2);
    expect(REGIONS.valley.arrival.x).toBeLessThan(VALLEY_PASS.x - VALLEY_PASS.width / 2);
    expect(REGIONS.forest.arrival.x - REGIONS.forest.exit.x).toBeGreaterThan(55);
  });
  it('verteilt Questgeber innerhalb ihrer Karten und ordnet jede Aufgabe einem passenden Ort zu', () => {
    for (const giver of Object.values(QUEST_GIVERS)) { expect(giver.x).toBeGreaterThan(70); expect(giver.x).toBeLessThan(WORLD_SIZE.width - 70); expect(giver.y).toBeGreaterThan(70); expect(giver.y).toBeLessThan(WORLD_SIZE.height - 70); }
    for (const id of LESSON_IDS) expect(QUEST_GIVERS[QUEST_ROUTES[id].giver].region).toBe(QUEST_ROUTES[id].region);
    expect(normalizeCompletions(LESSON_IDS, false)).toHaveLength(LESSON_IDS.length);
  });
});
