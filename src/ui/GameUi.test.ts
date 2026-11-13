// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nodesToSource } from '../combat/DecisionProgram';
import type { ArkanId, ProgramNode } from '../combat/types';
import { GameUi } from './GameUi';
import { gameEvents } from '../game/events';
import { BattleSession, missionPrograms } from '../combat/BattleSession';

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
  readOnly = false;
  highlightedPath?: string;
  constructor(_host: HTMLElement, private changed: () => void) { snaps.push(this); }
  load(nodes: ProgramNode[], actor: ArkanId, _mission: number, saved?: string) {
    const state = saved ? JSON.parse(saved) as { nodes: ProgramNode[]; loose: boolean } : { nodes, loose: false };
    this.nodes = state.nodes; this.loose = state.loose; this.actor = actor;
  }
  source() { return nodesToSource(this.nodes, this.actor); }
  save() { return JSON.stringify({ nodes: this.nodes, loose: this.loose }); }
  hasLooseBlocks() { return this.loose; }
  resize() {}
  setReadOnly(readOnly: boolean) { this.readOnly = readOnly; }
  highlight(path?: string) { this.highlightedPath = path; }
  mutate(nodes: ProgramNode[], loose = false) { this.nodes = nodes; this.loose = loose; this.changed(); }
} }));

const click = (id: string) => document.getElementById(id)!.click();
const text = () => document.getElementById('program-source') as HTMLTextAreaElement;
const type = (value: string) => { text().value = value; text().dispatchEvent(new Event('input')); };
const editor = () => snaps[snaps.length - 1] as { mutate: (nodes: ProgramNode[], loose?: boolean) => void };
const button = (id: string) => document.getElementById(id) as HTMLButtonElement;
beforeEach(() => {
  listeners.clear(); snaps.length = 0; localStorage.clear();
  document.body.innerHTML = readFileSync('index.html', 'utf8'); new GameUi();
});

describe('Editorzustand und Arkan-Zuordnung', () => {
  it('programmiert ein gewähltes Glutling-Soloteam mit dessen tatsächlich erlernten Befehlen', () => {
    const programs = missionPrograms(2, ['glutling']);
    gameEvents.emit('battle-opened', programs, 2, { glutling: ['moveForward', 'attack', 'repeat', 'enemyAdjacent'] });
    expect(document.getElementById('select-moosling')!.hidden).toBe(true);
    expect(document.getElementById('program-owner')!.textContent).toContain('Glutling');
    click('text-mode'); expect(text().value).toContain('glutling.enemyAdjacent');
    expect(document.getElementById('category-senses')).not.toBeNull();
    const session = new BattleSession(2, ['glutling']);
    gameEvents.emit('battle-updated', session.snapshot, 'Bereit');
    expect(document.getElementById('player-health-name')!.textContent).toBe('Glutling');
    expect(document.getElementById('player-health-text')!.textContent).toBe('4/4');
    expect(document.getElementById('companion-health-status')!.hidden).toBe(true);
    gameEvents.emit('battle-opened', programs, 2, {});
    click('text-mode'); expect(document.querySelectorAll('[data-command]')).toHaveLength(0);
  });

  it('führt Fund- und Questaktionen nur nach Annahme eines Dialogs aus', () => {
    let action = ''; gameEvents.on('campaign-action', (value: string) => { action = value; });
    const dialog = { speaker: 'MOOSLING', text: 'Ein Fund.', action: 'recruit-moosling', actionLabel: 'In Sammlung aufnehmen' };
    gameEvents.emit('dialog-opened', dialog);
    expect(document.getElementById('dialog-close')!.textContent).toBe('In Sammlung aufnehmen');
    click('dialog-dismiss'); expect(action).toBe('');
    gameEvents.emit('dialog-opened', dialog); click('dialog-close'); expect(action).toBe('recruit-moosling');
    expect(document.getElementById('dialog')!.hidden).toBe(true);
  });
  it('sperrt Änderungen während der Wiedergabe, erlaubt Pause und gibt den Editor nach Abbruch frei', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1); click('text-mode');
    const source = text().value;
    let pause = 0; let steps = 0; let speed = 0;
    gameEvents.on('battle-pause', () => { pause++; });
    gameEvents.on('battle-step', () => { steps++; });
    gameEvents.on('battle-speed', (value: number) => { speed = value; });
    gameEvents.emit('battle-playback', 'running');
    expect(text().readOnly).toBe(true);
    expect(button('battle-step').disabled).toBe(true);
    expect(button('battle-run-program').disabled).toBe(true);
    click('category-combat');
    const attack = document.querySelector('[data-command="attack"]') as HTMLButtonElement;
    expect(attack.disabled).toBe(true); attack.click(); expect(text().value).toBe(source);
    click('battle-pause'); expect(pause).toBe(1);
    gameEvents.emit('battle-playback', 'paused');
    expect(button('battle-pause').textContent).toBe('Fortsetzen');
    click('battle-step'); expect(steps).toBe(1);
    const tempo = document.getElementById('battle-speed') as HTMLSelectElement;
    tempo.value = '2'; tempo.dispatchEvent(new Event('change')); expect(speed).toBe(2);
    click('blocks-mode');
    expect((snaps.at(-1) as { readOnly: boolean }).readOnly).toBe(true);
    gameEvents.emit('battle-playback', 'idle');
    const session = new BattleSession(1);
    gameEvents.emit('battle-updated', session.snapshot, 'Arena zurückgesetzt.');
    gameEvents.emit('battle-trace-clear');
    expect(button('battle-step').disabled).toBe(false);
    expect(button('battle-pause').disabled).toBe(true);
    expect((snaps.at(-1) as { readOnly: boolean }).readOnly).toBe(false);
  });

  it('markiert die aktive Aktion in beiden Modi auch nach einer Neuformatierung', () => {
    const source = '\nrepeat(2, () => {\n\n  moosling.moveForward();\n});';
    gameEvents.emit('battle-opened', { moosling: source }, 1); click('text-mode'); type(source);
    const session = new BattleSession(1); session.execute({ moosling: source });
    gameEvents.emit('battle-playback', 'running');
    gameEvents.emit('battle-frame', session.frames[0]);
    expect(text().dataset.activeLine).toBe('4');
    expect(document.getElementById('execution-trace')!.textContent).toContain('Durchlauf 1 von 2');
    click('blocks-mode');
    expect((snaps.at(-1) as { highlightedPath?: string }).highlightedPath).toBe('0.body.0');
    click('text-mode'); expect(text().dataset.activeLine).toBe('2');
    expect(document.getElementById('active-code-line')!.textContent).toBe('Aktive Zeile: 2');
    gameEvents.emit('battle-playback', 'idle'); type('moosling.attack();');
    expect(text().dataset.activeLine).toBeUndefined();
    expect(document.getElementById('execution-trace')!.hidden).toBe(true);
  });

  it('wechselt beim Abspielen zum handelnden Arkan und zeigt für den Gegner keine falsche Codezeile', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    const session = new BattleSession(3); session.execute(missionPrograms(3));
    gameEvents.emit('battle-playback', 'running'); gameEvents.emit('battle-frame', session.frames[1]);
    expect(document.getElementById('program-owner')!.textContent).toContain('Glutling');
    click('text-mode'); expect(text().dataset.activeLine).toBe('2');
    gameEvents.emit('battle-frame', { ...session.frames[1], actor: 'konstrukt', trace: undefined });
    expect(text().dataset.activeLine).toBeUndefined();
    expect(document.getElementById('execution-trace')!.textContent).toContain('Konstrukt');
  });
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
