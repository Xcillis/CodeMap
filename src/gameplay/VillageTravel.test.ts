import { describe, expect, it } from 'vitest';
import { Campaign, normalizeCampaign } from './Campaign';
import { LESSON_IDS } from './WorldQuests';
import { FOREST_VILLAGE_ARRIVAL, REGIONS } from './WorldRegions';
import { arrivalAfterTravel, INTERIOR_IDS, INTERIORS, locationKey, mapSize, VILLAGE_BUILDINGS, VILLAGE_RESIDENTS } from './VillagePlaces';
import { instanceId } from './ArkanaCatalog';

const forest = () => new Campaign({ version: 2, worldVersion: 1, region: 'forest', introduced: true, completed: LESSON_IDS, owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }, { speciesId: 'felsbock' }], team: [instanceId('glutling')] });
describe('Dorf und drei betretbare Häuser', () => {
  it('erreicht das Dorf nur über den offenen Wald und erhält Fortschritt, Team und Rückreise', () => {
    const fresh = new Campaign(); const before = fresh.snapshot;
    expect(fresh.apply('travel-village')).toContain('Waldweg'); expect(fresh.snapshot).toEqual(before);
    const c = forest(); const original = c.snapshot;
    expect(c.interact('village-road').action).toBe('travel-village'); c.apply('travel-village');
    expect(c.region).toBe('village'); expect(mapSize(c.snapshot)).toEqual(mapSize(original));
    expect(c.snapshot.completed).toEqual(original.completed); expect(c.snapshot.owned).toEqual(original.owned); expect(c.snapshot.team).toEqual(original.team);
    expect(new Campaign(c.snapshot).region).toBe('village'); expect(c.interact('travel').action).toBe('travel-forest');
    expect(c.apply('travel-valley')).toContain('Aetherwald'); expect(c.region).toBe('village');
    const village = c.snapshot; c.apply('travel-forest'); expect(c.region).toBe('forest'); expect(arrivalAfterTravel(village, c.snapshot)).toEqual(FOREST_VILLAGE_ARRIVAL);
    c.apply('travel-valley'); expect(c.region).toBe('valley');
    expect(arrivalAfterTravel(c.snapshot, original)).toEqual(REGIONS.forest.arrival);
  });
  it('lädt jedes Haus erneut, zeigt nur seine Bewohner und verlässt es vor derselben Tür', () => {
    for (const id of INTERIOR_IDS) {
      const c = forest(); c.apply('travel-village'); const outside = c.snapshot;
      const house = VILLAGE_BUILDINGS.find((item) => item.interior === id)!;
      expect(c.interact(`door:${house.id}`).action).toBe(`enter-${id}`); c.apply(`enter-${id}`);
      expect(c.interior).toBe(id); expect(locationKey(c.snapshot)).not.toBe(locationKey(outside));
      expect(arrivalAfterTravel(outside, c.snapshot)).toEqual(INTERIORS[id].spawn);
      const loaded = new Campaign(c.snapshot); expect(loaded.snapshot).toMatchObject({ region: c.region, interior: id, owned: c.snapshot.owned, team: c.snapshot.team, completed: c.snapshot.completed });
      expect([...loaded.snapshot.discovered].sort()).toEqual([...c.snapshot.discovered].sort()); expect([...loaded.snapshot.introductions].sort()).toEqual([...c.snapshot.introductions].sort());
      expect(mapSize(loaded.snapshot)).toEqual(INTERIORS[id].size);
      const resident = VILLAGE_RESIDENTS.find((person) => person.interior === id)!;
      expect(loaded.interact(`resident:${resident.id}`).speaker).toBe(resident.name.toUpperCase());
      expect(loaded.interact('resident:pia').speaker).not.toBe('GÄRTNERIN PIA');
      expect(loaded.apply('travel-forest')).toContain('Haus'); expect(loaded.interior).toBe(id);
      expect(loaded.beginMission('q01-glutspur')).toContain('Haus'); expect(loaded.beginTraining(1, ['glutling'])).toContain('Trainingssteine');
      expect(loaded.interact('leave-house').action).toBe('leave-house'); const inside = loaded.snapshot; loaded.apply('leave-house');
      expect(loaded.interior).toBeUndefined(); expect(loaded.region).toBe('village'); expect(arrivalAfterTravel(inside, loaded.snapshot)).toEqual({ x: house.x, y: house.y + 65 });
    }
  });
  it('behält private Häuser geschlossen und verwirft falsche Innenräume in alten oder beschädigten Speicherständen', () => {
    const c = forest(); expect(c.apply('enter-inn')).toContain('Dorf'); c.apply('travel-village');
    for (const house of VILLAGE_BUILDINGS.filter((item) => !item.interior)) expect(c.interact(`door:${house.id}`).action).toBeUndefined();
    expect(normalizeCampaign({ ...c.snapshot, interior: 'unknown' }).interior).toBeUndefined();
    expect(normalizeCampaign({ ...c.snapshot, region: 'forest', interior: 'inn' }).interior).toBeUndefined();
    expect(normalizeCampaign({ version: 2, worldVersion: 1, region: 'village', interior: 'inn', completed: [] })).toMatchObject({ region: 'valley' });
    expect(new Campaign().snapshot).not.toHaveProperty('interior');
  });
  it('wechselt während einer laufenden Begegnung weder Gebiet noch Innenraum', () => {
    const c = forest(); c.visitGiver('lyra'); c.beginMission('q05-aufmerksam'); const before = c.snapshot;
    for (const action of ['travel-village', 'enter-inn', 'leave-house'] as const) expect(c.apply(action)).toContain('Beende');
    expect(c.snapshot).toEqual(before);
  });
});
