/** Cosmetic clock uses scene delta only; paused scenes never accumulate catch-up time. */
export class ValleyAtmosphere {
  private elapsed = 0;
  constructor(private readonly reducedMotion = false) {}
  advance(deltaMs: number): { frame: number; nextFrame: number; foamFrame: number; blend: number; flow: number; light: number } {
    if (!this.reducedMotion && Number.isFinite(deltaMs)) this.elapsed += Math.max(0, Math.min(100, deltaMs));
    const cycle = this.elapsed / 1800; const frame = Math.floor(cycle) % 4; const fraction = cycle % 1;
    return { frame, nextFrame: (frame + 1) % 4, foamFrame: Math.floor(this.elapsed / 160) % 4, blend: fraction * fraction * (3 - 2 * fraction), flow: this.elapsed * .014,
      light: .28 + Math.sin(this.elapsed / 850) * .035 + Math.sin(this.elapsed / 317) * .015 };
  }
}
