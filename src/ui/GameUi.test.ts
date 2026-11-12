// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameUi } from './GameUi';
import { gameEvents } from '../game/events';
import { missionPrograms } from '../combat/BattleSession';

const listeners = vi.hoisted(() => new Map<string, ((...args: unknown[]) => void)[]>());
vi.mock('../game/events', () => ({ gameEvents: {
  on: (name: string, callback: (...args: unknown[]) => void) => listeners.set(name, [...(listeners.get(name) ?? []), callback]),
  emit: (name: string, ...args: unknown[]) => listeners.get(name)?.forEach((callback) => callback(...args)),
} }));

function click(id: string): void { document.getElementById(id)!.click(); }
function source(): HTMLTextAreaElement { return document.getElementById('program-source') as HTMLTextAreaElement; }
function type(value: string): void { source().value = value; source().dispatchEvent(new Event('input')); }

beforeEach(() => {
  listeners.clear();
  localStorage.clear();
  document.body.innerHTML = readFileSync('index.html', 'utf8');
  new GameUi();
});

describe('Arkan-Editor', () => {
  it('behält getrennte, auch unvollständige Texte bei Arkan-Wechsel und Wiederöffnung', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    click('text-mode');
    type('repeat(2, () => { moosling.attack(); });');
    click('select-glutling');
    expect(source().value).toContain('glutling.moveForward()');
    type('glutling.');
    click('select-moosling');
    expect(source().value).toBe('repeat(2, () => { moosling.attack(); });');
    click('select-glutling');
    expect(source().value).toBe('glutling.');
    gameEvents.emit('battle-closed');
    listeners.clear();
    new GameUi();
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    click('select-glutling');
    expect(source().value).toBe('glutling.');
  });

  it('überschreibt bei erneutem Klick auf Textmodus keinen Entwurf', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1);
    click('text-mode');
    type('moosling.');
    click('text-mode');
    expect(source().value).toBe('moosling.');
    click('blocks-mode');
    expect(source().hidden).toBe(false);
    expect(source().value).toBe('moosling.');
  });

  it('sendet beide Programme, unabhängig vom ausgewählten Arkan', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    click('select-glutling');
    let submitted: unknown;
    gameEvents.on('battle-run-program', (programs: unknown) => { submitted = programs; });
    click('battle-run-program');
    expect(submitted).toEqual(missionPrograms(3));
    click('text-mode');
    click('blocks-mode');
    click('text-mode');
    expect(source().value).toContain('glutling.');
    expect(source().value).not.toContain('moosling.');
  });

  it('zeigt in Einstiegsmissionen nur Moosling und getrennte Entwürfe je Mission', () => {
    gameEvents.emit('battle-opened', missionPrograms(2), 2);
    click('text-mode');
    type('repeat(1, () => { moosling.attack(); });');
    gameEvents.emit('battle-opened', missionPrograms(1), 1);
    expect((document.getElementById('select-glutling') as HTMLButtonElement).hidden).toBe(true);
    expect(source().value).toBe(missionPrograms(1).moosling);
    gameEvents.emit('battle-opened', missionPrograms(2), 2);
    expect(source().value).toBe('repeat(1, () => { moosling.attack(); });');
  });
});
