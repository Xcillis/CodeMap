export type PlaybackState = 'idle' | 'running' | 'paused';

/** Timer-driven presentation, independent of simulation and Phaser. */
export class Playback<T> {
  state: PlaybackState = 'idle';
  private frames: readonly T[] = [];
  private cursor = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private speed = 1;
  private completed: () => void = () => {};
  constructor(private readonly show: (frame: T, duration: number) => void, private readonly changed: (state: PlaybackState) => void) {}

  play(frames: readonly T[], completed: () => void): void {
    this.stop(); this.frames = frames; this.cursor = 0; this.completed = completed;
    if (!frames.length) { completed(); return; }
    this.setState('running'); this.advance();
  }
  pause(): void { if (this.state === 'running') { this.clear(); this.setState('paused'); } }
  resume(): void { if (this.state === 'paused') { this.clear(); this.setState('running'); this.advance(); } }
  step(): void {
    if (this.state !== 'paused') return;
    this.clear();
    if (this.cursor >= this.frames.length) { this.finish(); return; }
    this.show(this.frames[this.cursor++], this.duration());
    if (this.cursor === this.frames.length) this.timer = setTimeout(() => this.finish(), this.duration());
  }
  setSpeed(speed: number): void {
    if (![.5, 1, 2].includes(speed)) return;
    this.speed = speed;
    if (this.state === 'running') { this.clear(); this.timer = setTimeout(() => this.advance(), this.duration()); }
  }
  stop(): void { this.clear(); this.frames = []; this.cursor = 0; this.completed = () => {}; this.setState('idle'); }
  private duration(): number { return 850 / this.speed; }
  private advance(): void {
    if (this.cursor >= this.frames.length) { this.finish(); return; }
    this.show(this.frames[this.cursor++], this.duration());
    this.timer = setTimeout(() => this.advance(), this.duration());
  }
  private finish(): void { const completed = this.completed; this.stop(); completed(); }
  private clear(): void { if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined; }
  private setState(state: PlaybackState): void { this.state = state; this.changed(state); }
}
