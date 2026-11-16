import manifest from '../../public/assets/aetheria-motion-v1/motion.json';

export const MOTION_MANIFEST = manifest;
export type MotionActor = keyof typeof manifest.actors;
export type MotionSheet = keyof typeof manifest.sheets;
export type MotionMode = 'idle' | 'walk';
export const MOTION_BASE = 'assets/aetheria-motion-v1/';
export const MOTION_KEYS: Record<MotionSheet, string> = { hero: 'cm-motion-hero-v1', npcs: 'cm-motion-npcs-v1', creatures: 'cm-motion-creatures-v1' };
export const motionSheet = (actor: MotionActor): MotionSheet => manifest.actors[actor].sheet as MotionSheet;
export const motionKey = (actor: MotionActor, mode: MotionMode): string => `cm-motion:${actor}:${mode}`;
export const motionFrames = (actor: MotionActor, mode: MotionMode): readonly string[] => manifest.actors[actor][mode];
