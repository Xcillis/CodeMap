// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nodesToSource } from '../combat/DecisionProgram';
import type { ArkanId, ProgramNode } from '../combat/types';
import { GameUi } from './GameUi';
import { gameEvents } from '../game/events';
import { missionPrograms } from '../combat/BattleSession';

const listeners = vi.hoisted(() => new Map<string, ((...args: unknown[]) => void)[]>());
const snaps = vi.hoisted(() => [] as unknown[]);
vi.mock('../game/events', () => ({ gameEvents: {
  on: (name: string, callback: (...args: unknown[]) => void) => listeners.set(name, [...(listeners.get(name) ?? []), callback]),
  emit: (name: string, ...args: unknown[]) => listeners.get(name)?.forEach((callback) => callback(...args)),
} }));
vi.mock('./SnapEditor', () => ({ SnapEditor: class {
  nodes: ProgramNode[] = [];
  actor: ArkanId = 'moosling';
  loose = false;
  constructor(_host: HTMLElement, private changed: () => void) { snaps.push(this); }
  load(nodes: ProgramNode[], actor: ArkanId, _mission: number, saved?: string) {
    const state = saved ? JSON.parse(saved) as { nodes: ProgramNode[]; loose: boolean } : { nodes, loose: false };
    this.nodes = state.nodes; this.loose = state.loose; this.actor = actor;
  }
  source() { return nodesToSource(this.nodes, this.actor); }
  save() { return JSON.stringify({ nodes: this.nodes, loose: this.loose }); }
  hasLooseBlocks() { return this.loose; }
  resize() {}
  mutate(nodes: ProgramNode[], loose = false) { this.nodes = nodes; this.loose = loose; this.changed(); }
} }));

const click = (id: string) => document.getElementById(id)!.click();
const text = () => document.getElementById('program-source') as HTMLTextAreaElement;
const type = (value: string) => { text().value = value; text().dispatchEvent(new Event('input')); };
const editor = () => snaps[snaps.length - 1] as { mutate: (nodes: ProgramNode[], loose?: boolean) => void };
beforeEach(() => {
  listeners.clear(); snaps.length = 0; localStorage.clear();
  document.body.innerHTML = readFileSync('index.html', 'utf8'); new GameUi();
});

describe('Editorzustand und Arkan-Zuordnung', () => {
  it('zeigt das ausgewählte Objekt eindeutig an und wechselt dessen Programm', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    expect(document.getElementById('program-owner')!.textContent).toBe('Du programmierst gerade: Moosling');
    expect(document.getElementById('select-moosling')!.getAttribute('aria-pressed')).toBe('true');
    click('select-glutling');
    expect(document.getElementById('program-owner')!.textContent).toBe('Du programmierst gerade: Glutling');
    expect(document.getElementById('select-glutling')!.getAttribute('aria-pressed')).toBe('true');
    expect(document.getElementById('select-moosling')!.getAttribute('aria-pressed')).toBe('false');
    click('text-mode');
    expect(text().value).toContain('glutling.moveForward()');
    expect(text().value).not.toContain('moosling');
  });
  it('behält eigene Programme, auch unvollständige Texte, beim Arkan-Wechsel und Neuladen', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3); click('text-mode');
    type('repeat(2, () => { moosling.attack(); });'); click('select-glutling');
    expect(text().value).toContain('glutling.moveForward'); type('glutling.');
    click('select-moosling'); expect(text().value).toContain('repeat(2');
    click('select-glutling'); expect(text().value).toBe('glutling.');
    listeners.clear(); new GameUi(); gameEvents.emit('battle-opened', missionPrograms(3), 3);
    click('select-glutling'); expect(text().value).toBe('glutling.');
  });
  it('überschreibt einen Textentwurf weder bei erneutem Textmodus-Klick noch bei fehlgeschlagener Konvertierung', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1); click('text-mode'); type('moosling.');
    click('text-mode'); click('blocks-mode'); expect(text().value).toBe('moosling.'); expect(text().hidden).toBe(false);
  });
  it('erhält verschachtelte Programme und leere Programme in beiden Modi', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1); click('text-mode');
    type('repeat(2, () => { moosling.moveForward(); moosling.attack(); });');
    click('blocks-mode'); click('text-mode'); expect(text().value).toContain('moosling.attack();');
    click('blocks-mode'); editor().mutate([]); click('text-mode'); expect(text().value).toBe('');
    click('blocks-mode'); expect(document.getElementById('block-editor')!.hidden).toBe(false);
  });
  it('bewahrt lose Blockentwürfe und verhindert deren versehentlichen Verlust oder Ausführung', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    editor().mutate([{ kind: 'action', action: 'ATTACK' }], true);
    click('text-mode'); expect(text().hidden).toBe(true);
    let ran = false; gameEvents.on('battle-run-program', () => { ran = true; }); click('battle-run-program'); expect(ran).toBe(false);
    click('select-glutling'); click('select-moosling'); click('text-mode'); expect(text().hidden).toBe(true);
    editor().mutate([{ kind: 'action', action: 'ATTACK' }]); click('text-mode'); expect(text().value).toBe('moosling.attack();');
  });
  it('sendet beim Ausführen beide Programme und hält Missionsentwürfe getrennt', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3); click('select-glutling'); click('text-mode'); type('glutling.attack();');
    let submitted: unknown; gameEvents.on('battle-run-program', (programs: unknown) => { submitted = programs; }); click('battle-run-program');
    expect(submitted).toMatchObject({ glutling: 'glutling.attack();' });
    gameEvents.emit('battle-opened', missionPrograms(1), 1); expect(document.getElementById('select-glutling')!.hidden).toBe(true);
    expect(text().value).not.toContain('glutling');
  });
  it('filtert im Textmodus Bibliothek und Kategorien und fügt eigene Arkan-Befehle ein', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3); click('text-mode'); click('category-senses');
    expect(document.querySelector('[data-command="condition"] code')?.textContent).toBe('moosling.enemyAdjacent');
    click('select-glutling'); expect(document.getElementById('category-senses')).toBeNull();
    click('category-combat'); type(''); (document.querySelector('[data-command="attack"]') as HTMLButtonElement).click();
    expect(text().value).toContain('glutling.attack()');
  });
});
