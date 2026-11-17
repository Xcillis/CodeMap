import manifest from '../../public/assets/aetheria-motion-v1/motion.json';
import brann from '../../public/assets/aetheria-motion-v1/brann-4way-v1.json';
import arkana from '../../public/assets/aetheria-motion-v1/arkana-4way-v1.json';
import type { ArkanId } from '../combat/types';
import type { Facing } from '../combat/Movement';

export const MOTION_MANIFEST = { sheets: { ...manifest.sheets, brann: brann.sheet, ...arkana.sheets }, actors: { ...manifest.actors, ...brann.actors, ...arkana.actors } };
export type MotionActor = keyof typeof MOTION_MANIFEST.actors;
export type MotionSheet = keyof typeof MOTION_MANIFEST.sheets;
export type MotionMode = 'idle' | 'walk';
export const MOTION_BASE = 'assets/aetheria-motion-v1/';
export const MOTION_KEYS: Record<MotionSheet, string> = { hero: 'cm-motion-hero-v1', npcs: 'cm-motion-npcs-v1', creatures: 'cm-motion-creatures-v1', brann: 'cm-motion-brann-4way-v1', glutling: 'cm-motion-glutling-4way-v1', moosling: 'cm-motion-moosling-4way-v1', felsbock: 'cm-motion-felsbock-4way-v1' };
export const motionSheet = (actor: MotionActor): MotionSheet => MOTION_MANIFEST.actors[actor].sheet as MotionSheet;
export const motionKey = (actor: MotionActor, mode: MotionMode): string => `cm-motion:${actor}:${mode}`;
export const motionFrames = (actor: MotionActor, mode: MotionMode): readonly string[] => MOTION_MANIFEST.actors[actor][mode];
export type MotionDirection = 'down' | 'up' | 'left' | 'right';
export function arkanaMotion(actor: ArkanId, facing: Facing): MotionActor {
  const direction: Record<Facing, MotionDirection> = { east: 'right', south: 'down', west: 'left', north: 'up' };
  return `${actor}-${direction[facing]}`;
}
export function motionDirection(dx: number, dy: number, previous: MotionDirection): MotionDirection {
  if (!dx && !dy) return previous;
  return Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'up' : 'down';
}
