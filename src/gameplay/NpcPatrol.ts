import type { QuestGiverId } from './QuestNetwork';

export interface PatrolPoint { x: number; y: number }
export type NpcBehavior = { kind: 'idle' } | { kind: 'patrol'; offset: PatrolPoint; speed: number; pauseMs: number }
  | { kind: 'route'; points: readonly PatrolPoint[]; speed: number; pauseMs: number };
export const NPC_BEHAVIORS: Record<QuestGiverId, NpcBehavior> = {
  eldren: { kind: 'idle' }, neria: { kind: 'idle' }, tala: { kind: 'idle' },
  brann: { kind: 'route', speed: 36, pauseMs: 900, points: [
    { x: 600, y: 390 }, { x: 600, y: 540 }, { x: 850, y: 540 }, { x: 850, y: 620 },
    { x: 1200, y: 620 }, { x: 1200, y: 735 }, { x: 950, y: 735 }, { x: 950, y: 700 },
    { x: 400, y: 700 }, { x: 400, y: 390 }, { x: 440, y: 390 },
  ] },
  mira: { kind: 'patrol', offset: { x: 44, y: 0 }, speed: 16, pauseMs: 2600 },
  lyra: { kind: 'patrol', offset: { x: 52, y: 0 }, speed: 18, pauseMs: 1800 },
};
export const npcShouldPause = (position: PatrolPoint, player: PatrolPoint, interfaceOpen: boolean): boolean => interfaceOpen || Math.hypot(player.x - position.x, player.y - position.y) < 90;

/** Small local motion only; quest state and the NPC's published world identity stay separate. */
export class NpcPatrol {
  private point: PatrolPoint;
  private outbound = true;
  private waiting: number;
  private waypoint = 0;
  constructor(private readonly anchor: PatrolPoint, private readonly behavior: NpcBehavior) {
    this.point = { x: anchor.x, y: anchor.y }; this.waiting = behavior.kind !== 'idle' ? behavior.pauseMs : 0;
  }
  get position(): PatrolPoint { return { ...this.point }; }
  step(deltaMs: number, frozen: boolean, canStand: (point: PatrolPoint) => boolean = () => true): { x: number; y: number; dx: number; dy: number; moving: boolean } {
    const delta = Math.max(0, Math.min(100, Number.isFinite(deltaMs) ? deltaMs : 0));
    const stopped = () => ({ ...this.point, dx: 0, dy: 0, moving: false });
    if (frozen || this.behavior.kind === 'idle' || !delta) return stopped();
    if (this.waiting > 0) { this.waiting = Math.max(0, this.waiting - delta); return stopped(); }
    const target = this.behavior.kind === 'route' ? this.behavior.points[this.waypoint] : this.outbound ? { x: this.anchor.x + this.behavior.offset.x, y: this.anchor.y + this.behavior.offset.y } : this.anchor;
    if (!target) return stopped();
    const distance = Math.hypot(target.x - this.point.x, target.y - this.point.y);
    if (distance === 0) { this.arrive(); return stopped(); }
    const ratio = Math.min(1, this.behavior.speed * delta / 1000 / distance);
    const next = { x: this.point.x + (target.x - this.point.x) * ratio, y: this.point.y + (target.y - this.point.y) * ratio };
    if (!canStand(next)) { this.outbound = !this.outbound; this.waiting = this.behavior.pauseMs; return stopped(); }
    const dx = next.x - this.point.x; const dy = next.y - this.point.y; this.point = next;
    if (ratio === 1) this.arrive();
    return { ...this.point, dx, dy, moving: true };
  }
  private arrive(): void {
    if (this.behavior.kind === 'idle') return;
    if (this.behavior.kind === 'route') this.waypoint = (this.waypoint + 1) % this.behavior.points.length;
    else this.outbound = !this.outbound;
    this.waiting = this.behavior.pauseMs;
  }
}
