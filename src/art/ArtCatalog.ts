import manifest from '../../public/assets/aetheria-v1/frames.json';

export { manifest as ART_MANIFEST };
export const ART_BASE = 'assets/aetheria-v1/';
export const ART_KEYS = { environment: 'cm-environment-v1', characters: 'cm-characters-v1', grass: 'cm-grass-v1', groundTile: 'cm-ground-tile-v1' } as const;
export type CharacterFrame = keyof typeof manifest.characters.frames;
export type EnvironmentFrame = keyof typeof manifest.environment.frames;
export type HeroFrame = Extract<CharacterFrame, `hero-${string}`>;
export const groundDepth = (y: number): number => 1000 + y;
export function heroFacing(x: number, y: number, previous: HeroFrame = 'hero-down'): HeroFrame {
  if (!x && !y) return previous;
  return Math.abs(x) > Math.abs(y) ? x < 0 ? 'hero-left' : 'hero-right' : y < 0 ? 'hero-up' : 'hero-down';
}
