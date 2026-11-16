import { FOREST_VILLAGE_ARRIVAL, REGIONS, REGION_SIZES, type RegionId } from './WorldRegions';

export const INTERIOR_IDS = ['inn', 'workshop', 'library'] as const;
export type InteriorId = typeof INTERIOR_IDS[number];
export const isInteriorId = (value: unknown): value is InteriorId => INTERIOR_IDS.some((id) => id === value);
export interface MapPoint { x: number; y: number }
export interface VillageBuilding extends MapPoint { id: string; name: string; frame: 'inn' | 'workshop' | 'library' | 'cottage'; width: number; height: number; interior?: InteriorId }
/** y is the front threshold; approach and return are below the solid footprint. */
export const VILLAGE_BUILDINGS: readonly VillageBuilding[] = [
  { id: 'inn', name: 'Gasthaus zur Goldenen Rune', frame: 'inn', x: 1030, y: 800, width: 320, height: 310, interior: 'inn' },
  { id: 'workshop', name: 'Jorins Werkstatt', frame: 'workshop', x: 2230, y: 790, width: 290, height: 285, interior: 'workshop' },
  { id: 'library', name: 'Haus der Geschichten', frame: 'library', x: 1750, y: 430, width: 290, height: 300, interior: 'library' },
  { id: 'cottage-west', name: 'Wohnhaus am Wald', frame: 'cottage', x: 570, y: 1260, width: 245, height: 235 },
  { id: 'cottage-east', name: 'Gärtnerhaus', frame: 'cottage', x: 2760, y: 1240, width: 250, height: 240 },
  { id: 'cottage-south', name: 'Haus am Obstgarten', frame: 'cottage', x: 2150, y: 1760, width: 245, height: 235 },
  { id: 'house-northwest', name: 'Altes Handelshaus', frame: 'inn', x: 520, y: 550, width: 260, height: 250 },
  { id: 'house-northeast', name: 'Wohnhaus am Hügel', frame: 'cottage', x: 2750, y: 540, width: 240, height: 230 },
];
export const INTERIORS = {
  inn: { name: 'Gasthaus · Schankstube', size: { width: 960, height: 720 }, spawn: { x: 480, y: 540 }, exit: { x: 480, y: 630 }, floor: 0x9b7548 },
  workshop: { name: 'Jorins Werkstatt', size: { width: 960, height: 720 }, spawn: { x: 480, y: 540 }, exit: { x: 480, y: 630 }, floor: 0x87684a },
  library: { name: 'Bibliothek · Haus der Geschichten', size: { width: 960, height: 720 }, spawn: { x: 480, y: 540 }, exit: { x: 480, y: 630 }, floor: 0x9c7e56 },
} as const;
export interface VillageResident extends MapPoint { id: string; name: string; frame: 'mara' | 'jorin' | 'selma' | 'pia'; interior?: InteriorId; text: string }
export const VILLAGE_RESIDENTS: readonly VillageResident[] = [
  { id: 'mara', name: 'Gastwirtin Mara', frame: 'mara', interior: 'inn', x: 640, y: 300, text: 'Willkommen in Auenquell! Vom Marktplatz aus findest du die Werkstatt im Osten und die Bibliothek im Norden. Durch die Tür im Süden kommst du wieder hinaus.' },
  { id: 'jorin', name: 'Handwerker Jorin', frame: 'jorin', interior: 'workshop', x: 620, y: 320, text: 'Ein guter Handgriff lässt sich wiederverwenden. Hier entstehen Möbel, Werkzeuge und bald auch neue Aufgaben für deine Arkana. Sieh dich ruhig um; der Ausgang liegt im Süden.' },
  { id: 'selma', name: 'Bibliothekarin Selma', frame: 'selma', interior: 'library', x: 630, y: 330, text: 'Jedes Buch bewahrt Wissen für später. Auch deine Programme und gelernten Begriffe bleiben bei deinen Reisen erhalten. In diesem Haus ist Platz für weitere Lernabenteuer.' },
  { id: 'pia', name: 'Gärtnerin Pia', frame: 'pia', x: 1510, y: 1120, text: 'Du bist auf dem Marktplatz von Auenquell. Gasthaus, Werkstatt und Bibliothek stehen Besuchern offen. Die anderen Häuser sind privat. Der Weg im Südwesten führt zurück in den Aetherwald.' },
];
export interface WorldLocation { region: RegionId; interior?: InteriorId }
export const locationKey = (place: WorldLocation): string => `${place.region}:${place.interior ?? 'outside'}`;
export const mapSize = (place: WorldLocation) => place.interior ? INTERIORS[place.interior].size : REGION_SIZES[place.region];
export const mapSpawn = (place: WorldLocation): MapPoint => place.interior ? INTERIORS[place.interior].spawn : REGIONS[place.region].spawn;
export function arrivalAfterTravel(before: WorldLocation, after: WorldLocation): MapPoint {
  if (after.interior) return INTERIORS[after.interior].spawn;
  if (before.interior && after.region === 'village') {
    const building = VILLAGE_BUILDINGS.find((item) => item.interior === before.interior)!;
    return { x: building.x, y: building.y + 65 };
  }
  if (before.region === 'village' && after.region === 'forest') return FOREST_VILLAGE_ARRIVAL;
  return REGIONS[after.region].arrival;
}
