// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Campaign } from './Campaign';
import { instanceId } from './ArkanaCatalog';
const key = 'codemap-m2-progress';
beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); localStorage.clear(); });

describe('Lokaler Weltfortschritt', () => {
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
