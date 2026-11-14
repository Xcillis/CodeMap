export type RegionId = 'valley' | 'forest';
export const REGIONS = {
  valley: { name: 'Tal von Aetheria', theme: 'Bewegung, Angriff und Schleifen', spawn: { x: 330, y: 735 }, arrival: { x: 1320, y: 520 }, exit: { x: 1540, y: 520 } },
  forest: { name: 'Aetherwald', theme: 'Bedingungen und Verzweigungen', spawn: { x: 230, y: 520 }, arrival: { x: 230, y: 520 }, exit: { x: 100, y: 520 } },
} as const;
export const isRegionId = (value: unknown): value is RegionId => value === 'valley' || value === 'forest';
export const WORLD_SIZE = { width: 1600, height: 1040 };
/** The east wall leaves one pass. Its middle collider is removed only after the clearing quest. */
export const VALLEY_PASS = { x: 1460, y: 520, width: 100, height: 180 };
export const VALLEY_CLIFFS = [{ x: 1460, y: 215, width: 100, height: 430 }, { x: 1460, y: 825, width: 100, height: 430 }] as const;
