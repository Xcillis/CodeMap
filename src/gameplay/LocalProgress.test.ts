// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Campaign } from './Campaign';
const key = 'codemap-m2-progress';
beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); localStorage.clear(); });

describe('Lokaler Weltfortschritt', () => {
  it('migriert bestehende Editorentwürfe und das Eldren-Gespräch ohne vorzeitig Arkana zu vergeben', async () => {
    const programs = { '1:moosling': 'moosling.', '3:glutling': 'glutling.attack();' };
    const blockWorkspaces = { '1:moosling': '{"draft":"loose blocks"}' };
    localStorage.setItem(key, JSON.stringify({ programVersion: 3, questCompleted: true, programs, blockWorkspaces, editorMode: 'text' }));
    const { loadProgress, saveProgress } = await import('./LocalProgress');
    expect(loadProgress()).toMatchObject({ programs, blockWorkspaces, editorMode: 'text', campaign: { introduced: true, owned: [], completed: [] } });
    const campaign = new Campaign(loadProgress().campaign); campaign.apply('recruit-moosling');
    saveProgress({ campaign: campaign.snapshot });
    expect(loadProgress()).toMatchObject({ programs, blockWorkspaces, campaign: { team: campaign.snapshot.team, owned: campaign.snapshot.owned } });
    vi.resetModules(); const reloaded = await import('./LocalProgress');
    expect(reloaded.loadProgress().campaign).toEqual(campaign.snapshot);
  });

  it('behält bei gesperrtem Browser-Speicher den Fortschritt für die laufende Sitzung', async () => {
    const { loadProgress, saveProgress, saveProgramDraft } = await import('./LocalProgress');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('disabled'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('disabled'); });
    const campaign = new Campaign(); campaign.apply('meet-eldren'); campaign.apply('recruit-moosling');
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
