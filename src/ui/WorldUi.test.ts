// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorldUi } from './WorldUi';
import { Campaign } from '../gameplay/Campaign';
import { gameEvents } from '../game/events';

const listeners = vi.hoisted(() => new Map<string, ((...args: unknown[]) => void)[]>());
vi.mock('../game/events', () => ({ gameEvents: {
  on: (name: string, callback: (...args: unknown[]) => void) => listeners.set(name, [...(listeners.get(name) ?? []), callback]),
  emit: (name: string, ...args: unknown[]) => listeners.get(name)?.forEach((callback) => callback(...args)),
} }));
let campaign: Campaign;
const click = (id: string) => document.getElementById(id)!.click();
const el = (id: string) => document.getElementById(id)!;
let domListeners: [string, EventListenerOrEventListenerObject][];
beforeEach(() => {
  listeners.clear(); document.body.innerHTML = readFileSync('index.html', 'utf8');
  domListeners = [];
  const addListener = document.addEventListener.bind(document);
  vi.spyOn(document, 'addEventListener').mockImplementation((name, callback, options) => {
    domListeners.push([name, callback]); addListener(name, callback, options);
  });
  campaign = new Campaign(); new WorldUi();
  gameEvents.on('team-toggle', (id: string) => { gameEvents.emit('world-notice', campaign.toggleTeam(id)); gameEvents.emit('campaign-updated', campaign.snapshot); });
});
afterEach(() => { for (const [name, callback] of domListeners) document.removeEventListener(name, callback); vi.restoreAllMocks(); });

describe('Sammlung und Questjournal', () => {
  it('bietet im Journal den direkten Start mit Glutling bei einer ungeeigneten Weltbesetzung an', () => {
    campaign = new Campaign({ introduced: true, owned: [{ speciesId: 'glutling' }], team: [] });
    campaign.interact('lesson:q01-glutspur'); gameEvents.emit('campaign-updated', campaign.snapshot); click('open-journal');
    const button = el('journal-quest-q01-glutspur') as HTMLButtonElement;
    expect(button.disabled).toBe(false); expect(button.textContent).toBe('Glutling wählen & starten');
    let action = ''; gameEvents.on('campaign-action', (value: string) => { action = value; });
    button.click(); expect(action).toBe('prepare-lesson:q01-glutspur'); expect(el('world-panel').hidden).toBe(true);
  });
  it('trennt die freie Trainingsvorbereitung von Lernquests und validiert die Besetzung', () => {
    campaign.apply('meet-eldren'); campaign.apply('recruit-glutling');
    gameEvents.emit('campaign-updated', campaign.snapshot); click('open-training');
    expect(el('world-panel-title').textContent).toBe('Freie Trainingsarena');
    expect(el('world-panel-intro').textContent).toContain('Alle implementierten Befehle');
    const select = el('training-preset') as HTMLSelectElement;
    select.value = '3'; click('training-launch');
    expect(el('world-panel').hidden).toBe(false); expect(el('world-panel-content').textContent).toContain('Wähle zwei');
    let selected: unknown; gameEvents.on('training-start', (mission: number, team: string[]) => { selected = { mission, team }; });
    select.value = '2'; click('training-launch');
    expect(selected).toEqual({ mission: 2, team: ['glutling'] }); expect(el('world-panel').hidden).toBe(true);
    expect(campaign.snapshot.completed).toEqual([]); expect(campaign.snapshot.owned[0].learned).not.toContain('repeat');
  });
  it('zeigt nur gefundene Arkana mit Typ, Stärken, Schwächen und tatsächlichen Teamplätzen', () => {
    click('open-collection'); expect(el('world-panel-content').textContent).toContain('noch leer');
    campaign.apply('meet-eldren'); campaign.apply('recruit-glutling');
    gameEvents.emit('campaign-updated', campaign.snapshot);
    const content = el('world-panel-content').textContent!;
    expect(content).toContain('Glutling · Feuer'); expect(content).toContain('Stärke:'); expect(content).toContain('Schwäche:');
    expect(content).toContain('noch nicht freigeschaltet'); expect(content).not.toContain('Moosling · Natur');
    expect(el('active-team-summary').textContent).toContain('Team 1/1: Glutling');
    click('team-glutling'); expect(campaign.activeTeam).toEqual([]);
    expect(el('world-panel-content').textContent).toContain('In der Sammlung');
    click('team-glutling'); expect(campaign.activeTeam).toHaveLength(1);
    expect(document.activeElement?.id).toBe('team-glutling');
  });

  it('sperrt unentdeckte Quests und startet eine entdeckte Quest mit gültigem Team', () => {
    campaign.apply('meet-eldren'); campaign.apply('recruit-glutling');
    gameEvents.emit('campaign-updated', campaign.snapshot); click('open-journal');
    expect((el('journal-quest-q01-glutspur') as HTMLButtonElement).disabled).toBe(true);
    campaign.interact('lesson:q01-glutspur'); gameEvents.emit('campaign-updated', campaign.snapshot);
    expect((el('journal-quest-q01-glutspur') as HTMLButtonElement).disabled).toBe(false);
    expect((el('journal-quest-q02-basisangriff') as HTMLButtonElement).disabled).toBe(true);
    let submitted = ''; let overlay = true;
    gameEvents.on('campaign-action', (action: string) => { submitted = action; });
    gameEvents.on('world-overlay', (open: boolean) => { overlay = open; });
    click('journal-quest-q01-glutspur'); expect(submitted).toBe('lesson:q01-glutspur'); expect(overlay).toBe(false); expect(el('world-panel').hidden).toBe(true);
  });

  it('verhindert Sammlung und Teamänderungen über die Oberfläche während Dialog und Kampf', () => {
    gameEvents.emit('dialog-opened'); click('open-collection'); expect(el('world-panel').hidden).toBe(true);
    gameEvents.emit('dialog-closed'); click('open-collection'); expect(el('world-panel').hidden).toBe(false);
    gameEvents.emit('battle-opened'); expect(el('world-panel').hidden).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' })); expect(el('world-panel').hidden).toBe(true);
    expect((el('open-collection') as HTMLButtonElement).disabled).toBe(true);
    gameEvents.emit('battle-closed'); click('open-collection'); expect(el('world-panel').hidden).toBe(false);
  });

  it('unterstützt Tastaturkürzel, Fokusbegrenzung und Schließen mit Escape', () => {
    el('open-journal').focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    expect(el('world-panel').hidden).toBe(false); expect(document.activeElement?.id).toBe('world-panel-close');
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(tab); expect(tab.defaultPrevented).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(el('world-panel').hidden).toBe(true); expect(document.activeElement?.id).toBe('open-journal');
  });
});
