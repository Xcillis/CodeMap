// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
  document.dispatchEvent(new Event('pointercancel'));
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function dragSetup(): void {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const workspace = document.getElementById('program-drop-area')!;
  vi.spyOn(workspace, 'getBoundingClientRect').mockReturnValue({ left: 300, right: 600, top: 100, bottom: 500, width: 300, height: 400, x: 300, y: 100, toJSON: () => ({}) });
  document.querySelectorAll<HTMLElement>('.loop-block').forEach((row, index) => {
    const top = 120 + index * 100;
    vi.spyOn(row, 'getBoundingClientRect').mockReturnValue({ left: 310, right: 580, top, bottom: top + 80, width: 270, height: 80, x: 310, y: top, toJSON: () => ({}) });
  });
  Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: (x: number, y: number) => x >= 300 && x <= 600 && y >= 100 && y <= 500 ? workspace : document.body });
}

function pointer(target: Element | Document, type: string, x: number, y: number, pointerType = 'mouse'): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y });
  Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: pointerType } });
  target.dispatchEvent(event);
}

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

describe('Drag-and-drop im Editor', () => {
  it('fügt Bibliotheksblöcke an der Drop-Position ein und unterdrückt den anschließenden Klick', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1);
    dragSetup();
    const command = document.querySelector('[data-command="attack"]')!;
    pointer(command, 'pointerdown', 40, 60);
    pointer(document, 'pointermove', 400, 125);
    expect(document.querySelector('.drop-marker')).not.toBeNull();
    pointer(document, 'pointerup', 400, 125);
    (command as HTMLButtonElement).click();
    expect(document.querySelectorAll('.loop-block')).toHaveLength(3);
    expect(source().value).toMatch(/^repeat\(1, \(\) => \{\n  moosling.attack/);
    expect(document.querySelector('.drag-ghost')).toBeNull();
  });

  it('sortiert vorhandene Blöcke per Touch um und erhält die Textdarstellung', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1);
    dragSetup();
    const handle = document.querySelector('[data-drag-block="0"]')!;
    pointer(handle, 'pointerdown', 350, 140, 'touch');
    pointer(document, 'pointermove', 400, 370, 'touch');
    pointer(document, 'pointerup', 400, 370, 'touch');
    expect(source().value.indexOf('moosling.attack()')).toBeLessThan(source().value.indexOf('moosling.moveForward()'));
    expect(document.querySelectorAll('.loop-block')).toHaveLength(2);
  });

  it('verändert beim Ablegen außerhalb und bei Escape das Programm nicht', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1);
    dragSetup();
    const before = source().value;
    const command = document.querySelector('[data-command="move"]')!;
    pointer(command, 'pointerdown', 40, 60);
    pointer(document, 'pointermove', 700, 600);
    pointer(document, 'pointerup', 700, 600);
    expect(source().value).toBe(before);
    pointer(command, 'pointerdown', 40, 60);
    pointer(document, 'pointermove', 400, 150);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    pointer(document, 'pointerup', 400, 150);
    expect(source().value).toBe(before);
    expect(document.querySelector('.drag-ghost')).toBeNull();
  });

  it('behält beim Drop in Glutlings Text den Entwurf und dessen Arkan-Zuordnung', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    click('select-glutling');
    click('text-mode');
    type('glutling.');
    source().setSelectionRange(source().value.length, source().value.length);
    dragSetup();
    pointer(document.querySelector('[data-command="attack"]')!, 'pointerdown', 40, 60);
    pointer(document, 'pointermove', 400, 150);
    pointer(document, 'pointerup', 400, 150);
    expect(source().value).toContain('glutling.\n\nrepeat');
    expect(source().value).toContain('glutling.attack()');
    expect(source().value).not.toContain('moosling');
  });

  it('ermöglicht Umsortieren per Tastatur ohne Drag-Geste', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1);
    document.querySelector('[data-drag-block="0"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(source().value.indexOf('moosling.attack()')).toBeLessThan(source().value.indexOf('moosling.moveForward()'));
    expect(document.activeElement?.getAttribute('data-drag-block')).toBe('1');
  });
});
