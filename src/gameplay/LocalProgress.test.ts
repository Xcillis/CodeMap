// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Campaign } from './Campaign';
import { instanceId } from './ArkanaCatalog';
import { LESSON_IDS } from './WorldQuests';
const key = 'codemap-m2-progress';
beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); localStorage.clear(); });

describe('Lokaler Weltfortschritt', () => {
  it('führt einen Q05-Spielstand ohne Reset zu Q06 und speichert den neuen Entwurf unabhängig', async () => {
    const programs = { 'q05-aufmerksam:glutling': 'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); }', '2:glutling': 'glutling.' };
    const blockWorkspaces = { 'q05-aufmerksam:glutling': '{"draft":true}' };
    localStorage.setItem(key, JSON.stringify({ programVersion: 3, campaign: { version: 2, introduced: true, completed: LESSON_IDS.slice(0, 5), owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }], team: [instanceId('glutling')] }, programs, blockWorkspaces }));
    const storage = await import('./LocalProgress'); const campaign = new Campaign(storage.loadProgress().campaign);
    expect(campaign.objective).toContain('Wächterstein'); expect(campaign.has('moosling')).toBe(true);
    expect(campaign.interact('arkanist-eldren').action).toBe('lesson:q06-waechter'); campaign.beginMission('q06-waechter');
    storage.saveProgress({ campaign: campaign.snapshot }); storage.saveProgramDraft('q06-waechter', 'glutling', 'repeat(5, () => { glutling.');
    vi.resetModules(); const loaded = (await import('./LocalProgress')).loadProgress();
    expect(loaded.campaign.completed).toEqual([...LESSON_IDS.slice(0, 5)]);
    expect(loaded.programs).toEqual({ ...programs, 'q06-waechter:glutling': 'repeat(5, () => { glutling.' });
    expect(loaded.blockWorkspaces).toEqual(blockWorkspaces);
  });
  it('sichert beim bewussten Neustart Sammlung, Team, Quests und Entwürfe und kann zwischen beiden Ständen wechseln', async () => {
    const saved = { version: 2, introduced: true, completed: LESSON_IDS, owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }], team: [instanceId('glutling')] };
    localStorage.setItem(key, JSON.stringify({ programVersion: 3, campaign: saved, programs: { 'q05-aufmerksam:glutling': 'glutling.' }, blockWorkspaces: { 'q04-musterpfad:glutling': '{"draft":true}' }, editorMode: 'text' }));
    const storage = await import('./LocalProgress'); const before = storage.loadProgress();
    expect(storage.startNewAdventure()).toEqual({ ok: true });
    const fresh = storage.loadProgress(); expect(fresh).toMatchObject({ campaign: { introduced: false, owned: [], team: [], completed: [], introductions: [] }, programs: {}, blockWorkspaces: {}, editorMode: 'blocks' });
    expect(storage.adventureBackup()).toEqual({ arkana: 2, quests: LESSON_IDS.length });
    expect(storage.startNewAdventure()).toEqual({ ok: true }); expect(storage.adventureBackup()).toEqual({ arkana: 2, quests: LESSON_IDS.length });
    vi.resetModules(); const reloaded = await import('./LocalProgress');
    expect(reloaded.restoreAdventure()).toEqual({ ok: true }); expect(reloaded.loadProgress()).toEqual(before);
    expect(reloaded.restoreAdventure()).toEqual({ ok: true }); expect(reloaded.loadProgress()).toEqual(fresh);
  });
  it('bricht einen Neustart ab, wenn die Sicherung nicht geschrieben werden kann', async () => {
    const storage = await import('./LocalProgress'); const campaign = new Campaign(); campaign.apply('meet-eldren'); campaign.apply('recruit-glutling');
    storage.saveProgress({ campaign: campaign.snapshot }); const before = localStorage.getItem(key);
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, name, value) {
      if (name === `${key}-backup`) throw new Error('quota'); setItem.call(this, name, value);
    });
    expect(storage.startNewAdventure().ok).toBe(false); expect(localStorage.getItem(key)).toBe(before);
    expect(storage.loadProgress().campaign).toEqual(campaign.snapshot);
  });
  it('stellt die frühere Sicherung wieder her, wenn das Schreiben des neuen Hauptstands fehlschlägt', async () => {
    const storage = await import('./LocalProgress'); const campaign = new Campaign(); campaign.apply('meet-eldren');
    storage.saveProgress({ campaign: campaign.snapshot }); const before = localStorage.getItem(key);
    const backup = JSON.stringify({ programVersion: 3, campaign: { owned: [{ speciesId: 'moosling' }] } }); localStorage.setItem(`${key}-backup`, backup);
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, name, value) {
      if (name === key) throw new Error('quota'); setItem.call(this, name, value);
    });
    expect(storage.startNewAdventure().ok).toBe(false); expect(localStorage.getItem(key)).toBe(before); expect(localStorage.getItem(`${key}-backup`)).toBe(backup);
  });
  it('lädt keine beschädigte Sicherung über einen vorhandenen Spielstand', async () => {
    const storage = await import('./LocalProgress'); const campaign = new Campaign(); campaign.apply('meet-eldren');
    storage.saveProgress({ campaign: campaign.snapshot }); const before = localStorage.getItem(key);
    for (const invalid of ['{broken', 'null', '{"programVersion":999}']) {
      localStorage.setItem(`${key}-backup`, invalid); expect(storage.adventureBackup()).toBeUndefined(); expect(storage.restoreAdventure().ok).toBe(false); expect(localStorage.getItem(key)).toBe(before);
    }
  });
  it('erhält den Q04-Spielstand und Q05-Entwürfe, ohne eine begonnene Prüfung als bestanden zu speichern', async () => {
    const programs = { 'q04-musterpfad:glutling': 'repeat(3, () => { glutling.moveRight(); glutling.moveUp(); });' };
    localStorage.setItem(key, JSON.stringify({ programVersion: 3, campaign: { version: 2, introduced: true, owned: [{ speciesId: 'glutling' }], team: [instanceId('glutling')], completed: LESSON_IDS.slice(0, 4) }, programs }));
    const { loadProgress, saveProgress, saveProgramDraft } = await import('./LocalProgress');
    const campaign = new Campaign(loadProgress().campaign); expect(campaign.objective).toContain('Prüfstein');
    expect(campaign.interact('arkanist-eldren').action).toBe('lesson:q05-aufmerksam');
    campaign.beginMission('q05-aufmerksam'); saveProgress({ campaign: campaign.snapshot });
    const source = 'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); }';
    saveProgramDraft('q05-aufmerksam', 'glutling', source);
    vi.resetModules(); const reloaded = await import('./LocalProgress');
    expect(reloaded.loadProgress().campaign.completed).toEqual([...LESSON_IDS.slice(0, 4)]);
    expect(reloaded.loadProgress().campaign.owned[0].learned).toContain('enemyAdjacent');
    expect(reloaded.loadProgress().programs).toEqual({ ...programs, 'q05-aufmerksam:glutling': source });
  });
  it('öffnet Q04 für einen bestehenden Q03-Spielstand und speichert dessen Entwurf separat', async () => {
    const campaign = { version: 2, introduced: true, owned: [{ speciesId: 'glutling', learned: ['moveRight', 'moveUp', 'attack', 'repeat'] }, { speciesId: 'moosling' }],
      team: [instanceId('glutling')], completed: ['q01-glutspur', 'q02-basisangriff', 'q03-wiederkehr'] };
    const programs = { 'q03-wiederkehr:glutling': 'repeat(4, () => { glutling.moveRight(); });', '1:glutling': 'glutling.attack();' };
    localStorage.setItem(key, JSON.stringify({ programVersion: 3, campaign, programs }));
    const { loadProgress, saveProgress, saveProgramDraft } = await import('./LocalProgress');
    const loaded = new Campaign(loadProgress().campaign);
    expect(loaded.snapshot.completed).toHaveLength(3); expect(loaded.snapshot.owned).toHaveLength(2);
    expect(loaded.objective).toContain('Musterstein');
    expect(loaded.interact('arkanist-eldren').action).toBe('lesson:q04-musterpfad');
    expect(loaded.beginMission('q04-musterpfad')).toMatchObject({ kind: 'lesson', lesson: 'q04-musterpfad' });
    loaded.completeMission('q04-musterpfad'); saveProgress({ campaign: loaded.snapshot });
    const source = 'repeat(3, () => { glutling.moveRight(); glutling.moveUp(); });';
    saveProgramDraft('q04-musterpfad', 'glutling', source);
    vi.resetModules(); const reloaded = await import('./LocalProgress');
    expect(reloaded.loadProgress().campaign.completed).toContain('q04-musterpfad');
    expect(reloaded.loadProgress().programs).toEqual({ ...programs, 'q04-musterpfad:glutling': source });
  });
  it('archiviert alte Questabschlüsse und erhält Sammlung, Teams und alle Programmplätze', async () => {
    const programs = { '1:glutling': 'repeat(3, () => { glutling.attack(); });' };
    const workspaces = { '1:glutling': '{"blocks":{"blocks":[]}}' };
    localStorage.setItem(key, JSON.stringify({ programVersion: 3, questCompleted: true, programs, blockWorkspaces: workspaces,
      campaign: { version: 1, introduced: true, owned: [{ speciesId: 'moosling', learned: ['attack', 'repeat'] }, { speciesId: 'glutling', learned: ['attack', 'repeat', 'enemyAdjacent'] }], team: ['aetheria-moosling-01', 'aetheria-glutling-01'], completed: [1, 2, 3], discovered: [1, 2, 3] } }));
    const { loadProgress, saveProgramDraft } = await import('./LocalProgress');
    const loaded = loadProgress();
    expect(loaded.campaign).toMatchObject({ version: 2, completed: [], legacyProgress: { completed: [1, 2, 3] } });
    expect(loaded.campaign.owned).toHaveLength(2); expect(loaded.campaign.team).toHaveLength(2);
    saveProgramDraft('q01-glutspur', 'glutling', 'glutling.moveRight();');
    expect(loadProgress().programs).toEqual({ ...programs, 'q01-glutspur:glutling': 'glutling.moveRight();' });
    expect(loadProgress().blockWorkspaces).toEqual(workspaces);
  });
  it('migriert bestehende Editorentwürfe und das Eldren-Gespräch ohne vorzeitig Arkana zu vergeben', async () => {
    const programs = { '1:moosling': 'moosling.', '3:glutling': 'glutling.attack();' };
    const blockWorkspaces = { '1:moosling': '{"draft":"loose blocks"}' };
    localStorage.setItem(key, JSON.stringify({ programVersion: 3, questCompleted: true, programs, blockWorkspaces, editorMode: 'text' }));
    const { loadProgress, saveProgress } = await import('./LocalProgress');
    expect(loadProgress()).toMatchObject({ programs, blockWorkspaces, editorMode: 'text', campaign: { introduced: true, owned: [], completed: [] } });
    const campaign = new Campaign(loadProgress().campaign); campaign.apply('recruit-glutling');
    saveProgress({ campaign: campaign.snapshot });
    expect(loadProgress()).toMatchObject({ programs, blockWorkspaces, campaign: { team: campaign.snapshot.team, owned: campaign.snapshot.owned } });
    vi.resetModules(); const reloaded = await import('./LocalProgress');
    expect(reloaded.loadProgress().campaign).toEqual(campaign.snapshot);
  });

  it('behält bei gesperrtem Browser-Speicher den Fortschritt für die laufende Sitzung', async () => {
    const { loadProgress, saveProgress, saveProgramDraft } = await import('./LocalProgress');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('disabled'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('disabled'); });
    const campaign = new Campaign(); campaign.apply('meet-eldren'); campaign.apply('recruit-glutling');
    saveProgress({ campaign: campaign.snapshot }); saveProgramDraft(1, 'moosling', 'moosling.');
    expect(loadProgress().campaign).toEqual(campaign.snapshot);
    expect(loadProgress().programs['1:moosling']).toBe('moosling.');
  });

  it('fällt bei ungültigem JSON sicher auf den Startzustand zurück', async () => {
    localStorage.setItem(key, '{broken');
    const { loadProgress } = await import('./LocalProgress');
    expect(loadProgress().campaign.owned).toEqual([]);
    localStorage.setItem(key, 'null'); expect(loadProgress().campaign.completed).toEqual([]);
  });
});
