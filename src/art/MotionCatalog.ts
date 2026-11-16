import manifest from '../../public/assets/aetheria-motion-v1/motion.json';
import brann from '../../public/assets/aetheria-motion-v1/brann-4way-v1.json';

export const MOTION_MANIFEST = { sheets: { ...manifest.sheets, brann: brann.sheet }, actors: { ...manifest.actors, ...brann.actors } };
export type MotionActor = keyof typeof MOTION_MANIFEST.actors;
export type MotionSheet = keyof typeof MOTION_MANIFEST.sheets;
export type MotionMode = 'idle' | 'walk';
export const MOTION_BASE = 'assets/aetheria-motion-v1/';
export const MOTION_KEYS: Record<MotionSheet, string> = { hero: 'cm-motion-hero-v1', npcs: 'cm-motion-npcs-v1', creatures: 'cm-motion-creatures-v1', brann: 'cm-motion-brann-4way-v1' };
export const motionSheet = (actor: MotionActor): MotionSheet => MOTION_MANIFEST.actors[actor].sheet as MotionSheet;
export const motionKey = (actor: MotionActor, mode: MotionMode): string => `cm-motion:${actor}:${mode}`;
export const motionFrames = (actor: MotionActor, mode: MotionMode): readonly string[] => MOTION_MANIFEST.actors[actor][mode];
export type MotionDirection = 'down' | 'up' | 'left' | 'right';
export function motionDirection(dx: number, dy: number, previous: MotionDirection): MotionDirection {
  if (!dx && !dy) return previous;
  return Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'up' : 'down';
}
