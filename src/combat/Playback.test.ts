import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Playback } from './Playback';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Sichtbare Programmausführung', () => {
  it('zeigt jede Aktion genau einmal und meldet erst danach den Abschluss', () => {
    const show = vi.fn(); const done = vi.fn(); const states = vi.fn();
    const playback = new Playback(show, states);
    playback.play(['move', 'attack'], done);
    expect(show.mock.calls).toEqual([['move', 850]]);
    vi.advanceTimersByTime(850);
    expect(show.mock.calls).toEqual([['move', 850], ['attack', 850]]);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(850);
    expect(done).toHaveBeenCalledTimes(1);
    expect(playback.state).toBe('idle');
    vi.runAllTimers(); expect(done).toHaveBeenCalledTimes(1);
  });

  it('pausiert ohne Aktionen zu überspringen und setzt mit gewähltem Tempo fort', () => {
    const show = vi.fn(); const playback = new Playback(show, () => {});
    playback.play([1, 2, 3], () => {});
    playback.pause(); vi.advanceTimersByTime(10000);
    expect(show).toHaveBeenCalledTimes(1);
    playback.setSpeed(2); playback.resume();
    expect(show).toHaveBeenLastCalledWith(2, 425);
    vi.advanceTimersByTime(425); expect(show).toHaveBeenLastCalledWith(3, 425);
    vi.advanceTimersByTime(425); expect(playback.state).toBe('idle');
  });

  it('erlaubt Einzelschritte während einer Pause und beendet auch die letzte Aktion', () => {
    const show = vi.fn(); const done = vi.fn(); const playback = new Playback(show, () => {});
    playback.play([1, 2, 3], done); playback.pause(); playback.step();
    vi.advanceTimersByTime(2000);
    expect(show.mock.calls.map(([frame]) => frame)).toEqual([1, 2]);
    expect(playback.state).toBe('paused');
    playback.step(); vi.advanceTimersByTime(850);
    expect(done).toHaveBeenCalledTimes(1); expect(playback.state).toBe('idle');
  });

  it('verwirft beim Abbruch und bei einem neuen Lauf alle alten Timer und Abschlussaktionen', () => {
    const show = vi.fn(); const oldDone = vi.fn(); const newDone = vi.fn();
    const playback = new Playback(show, () => {});
    playback.play([1, 2], oldDone); playback.stop(); vi.runAllTimers();
    expect(show).toHaveBeenCalledTimes(1); expect(oldDone).not.toHaveBeenCalled();
    playback.play([3, 4], oldDone); playback.play([5], newDone); vi.runAllTimers();
    expect(show.mock.calls.map(([frame]) => frame)).toEqual([1, 3, 5]);
    expect(oldDone).not.toHaveBeenCalled(); expect(newDone).toHaveBeenCalledTimes(1);
  });

  it('verarbeitet leere Läufe und Tempoänderungen ohne doppelte Timer', () => {
    const done = vi.fn(); const show = vi.fn(); const playback = new Playback(show, () => {});
    playback.play([], done); expect(done).toHaveBeenCalledTimes(1); expect(playback.state).toBe('idle');
    playback.play([1, 2], done); playback.setSpeed(.5); playback.setSpeed(99);
    vi.advanceTimersByTime(1699); expect(show).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1); expect(show).toHaveBeenLastCalledWith(2, 1700);
    vi.runAllTimers(); expect(done).toHaveBeenCalledTimes(2);
  });
});
