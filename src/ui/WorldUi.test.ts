// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorldUi } from './WorldUi';
import { Campaign } from '../gameplay/Campaign';
import { gameEvents } from '../game/events';
import { LESSON_IDS } from '../gameplay/WorldQuests';
import { instanceId } from '../gameplay/ArkanaCatalog';
import { loadProgress } from '../gameplay/LocalProgress';

const listeners = vi.hoisted(() => new Map<string, ((...args: unknown[]) => void)[]>());
vi.mock('../game/events', () => ({ gameEvents: {
  on: (name: string, callback: (...args: unknown[]) => void) => listeners.set(name, [...(listeners.get(name) ?? []), callback]),
  emit: (name: string, ...args: unknown[]) => listeners.get(name)?.forEach((callback) => callback(...args)),
} }));
let campaign: Campaign;
let restartGame: ReturnType<typeof vi.fn>;
const click = (id: string) => document.getElementById(id)!.click();
const el = (id: string) => document.getElementById(id)!;
let domListeners: [string, EventListenerOrEventListenerObject][];
beforeEach(() => {
  listeners.clear(); localStorage.clear(); document.body.innerHTML = readFileSync('index.html', 'utf8');
  domListeners = [];
  const addListener = document.addEventListener.bind(document);
  vi.spyOn(document, 'addEventListener').mockImplementation((name, callback, options) => {
    domListeners.push([name, callback]); addListener(name, callback, options);
  });
  campaign = new Campaign(); restartGame = vi.fn(); new WorldUi(restartGame);
  gameEvents.on('team-toggle', (id: string) => { gameEvents.emit('world-notice', campaign.toggleTeam(id)); gameEvents.emit('campaign-updated', campaign.snapshot); });
});
afterEach(() => { for (const [name, callback] of domListeners) document.removeEventListener(name, callback); vi.restoreAllMocks(); });

describe('Sammlung und Questjournal', () => {
  it('beginnt erst nach Bestätigung ein neues Abenteuer und bietet die Sicherung zum Laden an', () => {
    campaign = new Campaign({ version: 2, introduced: true, owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }], completed: LESSON_IDS });
    const saved = JSON.stringify({ programVersion: 3, campaign: campaign.snapshot }); localStorage.setItem('codemap-m2-progress', saved);
    gameEvents.emit('campaign-updated', campaign.snapshot); click('open-collection'); click('adventure-new');
    expect(el('adventure-confirmation').hidden).toBe(false); expect(restartGame).not.toHaveBeenCalled();
    click('adventure-cancel'); expect(el('adventure-confirmation').hidden).toBe(true); expect(localStorage.getItem('codemap-m2-progress')).toBe(saved);
    click('adventure-new'); click('adventure-confirm'); expect(restartGame).toHaveBeenCalledTimes(1); expect(loadProgress().campaign.owned).toEqual([]);
    click('world-panel-close'); click('open-collection'); expect(el('world-panel-content').textContent).toContain('Gesichert: 2 Arkana');
    click('adventure-restore'); click('adventure-confirm'); expect(restartGame).toHaveBeenCalledTimes(2); expect(loadProgress().campaign.owned).toHaveLength(2);
  });
  it('wechselt bei einer zwischenzeitlich gestarteten Begegnung keinen Spielstand', () => {
    click('open-collection'); click('adventure-new'); gameEvents.emit('battle-opened'); click('adventure-confirm');
    expect(restartGame).not.toHaveBeenCalled(); expect(localStorage.getItem('codemap-m2-progress')).toBeNull();
  });
  it('bietet Q05 nach dem Musterpfad an und trägt Bedingung und Verzweigung erst nach dem Abschluss ein', () => {
    campaign = new Campaign({ version: 2, introduced: true, completed: LESSON_IDS.slice(0, 4), owned: [{ speciesId: 'glutling' }], team: [] });
    campaign.interact('arkanist-eldren'); gameEvents.emit('campaign-updated', campaign.snapshot); click('open-journal');
    const button = el('journal-quest-q05-aufmerksam') as HTMLButtonElement;
    expect(button.disabled).toBe(false); expect(button.textContent).toBe('Glutling wählen & starten');
    expect(el('world-panel-content').textContent).toContain('Prüfstein südlich der Akademie');
    let action = ''; gameEvents.on('campaign-action', (value: string) => { action = value; }); button.click();
    expect(action).toBe('prepare-lesson:q05-aufmerksam'); campaign.prepareMission('q05-aufmerksam');
    gameEvents.emit('campaign-updated', campaign.snapshot); click('open-collection'); click('character-tab-glossary');
    expect(document.querySelector('.glossary-card[data-term="condition"]')).toBeNull();
    campaign.finishMission('q05-aufmerksam'); gameEvents.emit('campaign-updated', campaign.snapshot);
    expect(document.querySelector('.glossary-card[data-term="condition"] h3')?.textContent).toBe('Bedingung');
    expect(document.querySelector('.glossary-card[data-term="branch"] pre')?.textContent).toContain('else');
  });
  it('öffnet den Musterpfad nach Q03 im Journal und erweitert das Nachschlagebuch erst nach Q04', () => {
    campaign = new Campaign({ version: 2, introduced: true, completed: LESSON_IDS.slice(0, 3), owned: [{ speciesId: 'glutling' }], team: [instanceId('glutling')] });
    gameEvents.emit('campaign-updated', campaign.snapshot); click('open-journal');
    expect((el('journal-quest-q04-musterpfad') as HTMLButtonElement).disabled).toBe(true);
    campaign.interact('arkanist-eldren'); gameEvents.emit('campaign-updated', campaign.snapshot);
    expect((el('journal-quest-q04-musterpfad') as HTMLButtonElement).disabled).toBe(false);
    expect(el('world-panel-content').textContent).toContain('Musterstein am Nordweg');
    let action = ''; gameEvents.on('campaign-action', (value: string) => { action = value; });
    click('journal-quest-q04-musterpfad'); expect(action).toBe('lesson:q04-musterpfad');
    campaign.beginMission('q04-musterpfad'); gameEvents.emit('campaign-updated', campaign.snapshot);
    click('open-collection'); click('character-tab-glossary');
    expect(document.querySelector('.glossary-card[data-term="loop-body"]')).toBeNull();
    expect(document.querySelectorAll('.glossary-card[data-term="loop"] pre')).toHaveLength(1);
    campaign.completeMission('q04-musterpfad'); gameEvents.emit('campaign-updated', campaign.snapshot);
    expect(document.querySelector('.glossary-card[data-term="loop-body"] h3')?.textContent).toBe('Schleifenrumpf');
    expect(document.querySelectorAll('.glossary-card[data-term="loop"] pre')).toHaveLength(2);
  });
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
    expect(document.getElementById('team-glutling')).toBeNull();
    click('character-tab-team');
    expect(el('team-active-members').textContent).toContain('Platz 1: Glutling');
    click('team-glutling'); expect(campaign.activeTeam).toEqual([]);
    expect(el('world-panel-content').textContent).toContain('In der Sammlung');
    click('team-glutling'); expect(campaign.activeTeam).toHaveLength(1);
    expect(document.activeElement?.id).toBe('team-glutling');
  });

  it('zeigt nur gelernte Begriffe samt Beispielen und behält den gewählten Charakterreiter', () => {
    click('open-collection'); click('character-tab-glossary');
    expect(el('world-panel-content').textContent).toContain('noch leer');
    expect(document.querySelectorAll('.glossary-card')).toHaveLength(0);
    campaign = new Campaign({ version: 2, completed: ['q01-glutspur'] });
    gameEvents.emit('campaign-updated', campaign.snapshot);
    expect(Array.from(document.querySelectorAll('.glossary-card h3')).map((h) => h.textContent)).toEqual(['Anweisung', 'Sequenz']);
    expect(document.querySelector('[data-term="sequence"] pre code')?.textContent).toBe('glutling.moveRight();\nglutling.moveRight();\nglutling.moveUp();');
    expect(el('world-panel-content').textContent).toContain('Beispiel');
    expect(el('world-panel-content').textContent).not.toContain('Schleife');
    click('world-panel-close'); click('open-journal'); expect(el('character-tabs').hidden).toBe(true);
    click('world-panel-close');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
    expect(el('world-panel-title').textContent).toBe('Charakter'); expect(el('character-tabs').hidden).toBe(false);
    expect(el('character-tab-glossary').getAttribute('aria-selected')).toBe('true');
    expect(el('world-panel-content').getAttribute('aria-labelledby')).toBe('character-tab-glossary');
  });

  it('bedient Charakterreiter mit Pfeiltasten und hält nur den aktiven Reiter in der Tabfolge', () => {
    click('open-collection'); click('character-tab-collection');
    el('character-tab-collection').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    expect(document.activeElement?.id).toBe('character-tab-glossary');
    expect(el('character-tab-glossary').tabIndex).toBe(0); expect(el('character-tab-collection').tabIndex).toBe(-1);
    expect(el('character-tab-glossary').getAttribute('aria-selected')).toBe('true');
    el('character-tab-glossary').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement?.id).toBe('character-tab-collection');
    el('character-tab-collection').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement?.id).toBe('character-tab-team');
    el('character-tab-team').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    el('world-panel-content').focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    el('world-panel-content').dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true); expect(document.activeElement?.id).toBe('world-panel-close');
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
