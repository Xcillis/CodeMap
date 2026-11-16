import type { QuestGiverId } from './QuestNetwork';

export interface PatrolPoint { x: number; y: number }
export type NpcBehavior = { kind: 'idle' } | { kind: 'patrol'; offset: PatrolPoint; speed: number; pauseMs: number };
export const NPC_BEHAVIORS: Record<QuestGiverId, NpcBehavior> = {
  eldren: { kind: 'idle' }, neria: { kind: 'idle' }, tala: { kind: 'idle' },
  brann: { kind: 'patrol', offset: { x: 48, y: 0 }, speed: 20, pauseMs: 2000 },
  mira: { kind: 'patrol', offset: { x: 44, y: 0 }, speed: 16, pauseMs: 2600 },
  lyra: { kind: 'patrol', offset: { x: 52, y: 0 }, speed: 18, pauseMs: 1800 },
};
export const npcShouldPause = (position: PatrolPoint, player: PatrolPoint, interfaceOpen: boolean): boolean => interfaceOpen || Math.hypot(player.x - position.x, player.y - position.y) < 90;

/** Small local motion only; quest state and the NPC's published world identity stay separate. */
export class NpcPatrol {
  private point: PatrolPoint;
  private outbound = true;
  private waiting: number;
  constructor(private readonly anchor: PatrolPoint, private readonly behavior: NpcBehavior) {
    this.point = { x: anchor.x, y: anchor.y }; this.waiting = behavior.kind === 'patrol' ? behavior.pauseMs : 0;
  }
  get position(): PatrolPoint { return { ...this.point }; }
  step(deltaMs: number, frozen: boolean, canStand: (point: PatrolPoint) => boolean = () => true): { x: number; y: number; dx: number; moving: boolean } {
    const delta = Math.max(0, Math.min(100, Number.isFinite(deltaMs) ? deltaMs : 0));
    const stopped = () => ({ ...this.point, dx: 0, moving: false });
    if (frozen || this.behavior.kind === 'idle' || !delta) return stopped();
    if (this.waiting > 0) { this.waiting = Math.max(0, this.waiting - delta); return stopped(); }
    const target = this.outbound ? { x: this.anchor.x + this.behavior.offset.x, y: this.anchor.y + this.behavior.offset.y } : this.anchor;
    const distance = Math.hypot(target.x - this.point.x, target.y - this.point.y);
    if (distance === 0) { this.outbound = !this.outbound; this.waiting = this.behavior.pauseMs; return stopped(); }
    const ratio = Math.min(1, this.behavior.speed * delta / 1000 / distance);
    const next = { x: this.point.x + (target.x - this.point.x) * ratio, y: this.point.y + (target.y - this.point.y) * ratio };
    if (!canStand(next)) { this.outbound = !this.outbound; this.waiting = this.behavior.pauseMs; return stopped(); }
    const dx = next.x - this.point.x; this.point = next;
    if (ratio === 1) { this.outbound = !this.outbound; this.waiting = this.behavior.pauseMs; }
    return { ...this.point, dx, moving: true };
  }
}
