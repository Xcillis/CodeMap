import { afterEach, describe, expect, it, vi } from 'vitest';
import { Campaign, normalizeCampaign, type WorldEncounter } from './Campaign';
import { instanceId } from './ArkanaCatalog';
import { BattleSession, missionPrograms } from '../combat/BattleSession';
import { Playback } from '../combat/Playback';
import type { MissionId } from '../combat/BattleSession';

function introduced(): Campaign {
  const campaign = new Campaign(); campaign.apply('meet-eldren'); campaign.apply('recruit-moosling'); return campaign;
}
function begin(campaign: Campaign, mission: MissionId): WorldEncounter {
  campaign.interact(`quest-${mission}`);
  const result = campaign.beginMission(mission);
  if (typeof result === 'string') throw new Error(result);
  return result;
}
function win(campaign: Campaign, mission: MissionId): void {
  const encounter = begin(campaign, mission);
  const session = new BattleSession(mission, encounter.team, encounter.skills);
  session.execute(missionPrograms(mission, encounter.team), true);
  expect(session.snapshot.outcome).toBe('victory');
  expect(campaign.completeMission(mission)).toBeDefined();
  campaign.leaveMission();
}
afterEach(() => vi.useRealTimers());

describe('Weltquests und Arkana-Sammlung', () => {
  it('startet ohne geschenkte Arkana und führt über Eldren zu einer garantierten Fundbegegnung', () => {
    const campaign = new Campaign();
    expect(campaign.snapshot.owned).toEqual([]); expect(campaign.activeTeam).toEqual([]);
    expect(campaign.interact('arkanist-eldren').action).toBe('meet-eldren');
    expect(campaign.interact('glutling').action).toBeUndefined();
    expect(campaign.apply('recruit-glutling')).toContain('zuerst');
    campaign.apply('meet-eldren'); expect(campaign.objective).toContain('Moosling');
    expect(campaign.interact('moosling').action).toBe('recruit-moosling');
    campaign.apply('recruit-moosling'); campaign.apply('recruit-moosling');
    expect(campaign.snapshot.owned).toHaveLength(1);
    expect(campaign.activeTeam[0].speciesId).toBe('moosling');
    expect(campaign.beginMission(1)).toContain('Entdecke');
    expect(campaign.interact('quest-1').action).toBe('quest-1');
  });

  it('sichert Voraussetzungen, Teamgröße und das Freischalten gelernter Befehle', () => {
    const campaign = introduced();
    expect(campaign.interact('quest-2').action).toBeUndefined();
    expect(campaign.beginMission(2)).toContain('vorherige');
    expect(campaign.snapshot.owned[0].learned).not.toContain('enemyAdjacent');
    win(campaign, 1);
    expect(campaign.snapshot.owned[0].learned).toContain('enemyAdjacent');
    expect(campaign.teamLimit).toBe(1);
    campaign.apply('recruit-glutling');
    expect(campaign.snapshot.owned[1].learned).toContain('enemyAdjacent');
    expect(campaign.activeTeam.map((item) => item.speciesId)).toEqual(['moosling']);
    campaign.toggleTeam(instanceId('glutling'));
    expect(campaign.activeTeam.map((item) => item.speciesId)).toEqual(['glutling']);
    win(campaign, 2);
    expect(campaign.teamLimit).toBe(2);
    expect(campaign.interact('quest-3').text).toContain('zwei aktive');
    campaign.toggleTeam(instanceId('moosling'));
    expect(campaign.activeTeam.map((item) => item.speciesId)).toEqual(['glutling', 'moosling']);
    win(campaign, 3);
    expect(campaign.snapshot.completed).toEqual([1, 2, 3]);
    expect(campaign.objective).toContain('abgeschlossen');
  });

  it('belohnt weder Abbruch noch fremde Siege und verändert das Team nicht während einer Begegnung', () => {
    const campaign = introduced(); const encounter = begin(campaign, 1);
    expect(campaign.completeMission(2)).toBeUndefined();
    expect(campaign.toggleTeam(instanceId('moosling'))).toContain('während');
    expect(campaign.apply('recruit-moosling')).toContain('Beende');
    expect(campaign.activeTeam.map((item) => item.speciesId)).toEqual(encounter.team);
    campaign.leaveMission(); expect(campaign.completeMission(1)).toBeUndefined();
    expect(campaign.snapshot.completed).toEqual([]);
    campaign.toggleTeam(instanceId('moosling'));
    expect(campaign.beginMission(1)).toContain('ein aktives');
    expect(campaign.toggleTeam('not-owned')).toContain('nicht gefunden');
  });

  it('vergibt die Questbelohnung erst nach der sichtbaren Wiedergabe und verwirft abgebrochene Läufe', () => {
    vi.useFakeTimers();
    const campaign = introduced(); const encounter = begin(campaign, 1);
    const session = new BattleSession(1, encounter.team, encounter.skills);
    session.execute(missionPrograms(1, encounter.team), true);
    const playback = new Playback(() => {}, () => {});
    playback.play(session.frames, () => campaign.completeMission(1));
    expect(campaign.snapshot.completed).toEqual([]);
    playback.stop(); vi.runAllTimers(); expect(campaign.snapshot.completed).toEqual([]);
    playback.play(session.frames, () => campaign.completeMission(1)); vi.runAllTimers();
    expect(campaign.snapshot.completed).toEqual([1]);
    expect(campaign.completeMission(1)).toBeUndefined();
  });

  it('ermöglicht Wiederholungen mit passendem Team ohne doppelte Belohnungen', () => {
    const campaign = introduced(); win(campaign, 1);
    const after = campaign.snapshot;
    const encounter = begin(campaign, 1);
    const session = new BattleSession(1, encounter.team, encounter.skills);
    session.execute(missionPrograms(1, encounter.team), true);
    expect(session.snapshot.outcome).toBe('victory'); expect(campaign.completeMission(1)).toBeUndefined();
    campaign.leaveMission(); expect(campaign.snapshot).toEqual(after);
  });

  it('normalisiert alte oder beschädigte Spielstände und gibt keine veränderbaren Zustandsreferenzen heraus', () => {
    const legacy = new Campaign(undefined, true);
    expect(legacy.snapshot.introduced).toBe(true); expect(legacy.snapshot.owned).toEqual([]);
    expect(normalizeCampaign({ owned: [null, { speciesId: 'water' }, { speciesId: 'moosling' }, { speciesId: 'moosling' }], team: ['unknown', instanceId('moosling'), instanceId('moosling')], completed: [3], discovered: [3, 9] })).toMatchObject({ completed: [], team: [instanceId('moosling')], discovered: [3] });
    const campaign = introduced(); const snapshot = campaign.snapshot;
    snapshot.owned[0].learned.length = 0; snapshot.team.length = 0;
    expect(campaign.activeTeam).toHaveLength(1); expect(campaign.snapshot.owned[0].learned).toContain('repeat');
    const loaded = new Campaign(JSON.parse(JSON.stringify(campaign.snapshot)));
    expect(loaded.snapshot).toEqual(campaign.snapshot);
    const trained = normalizeCampaign({ owned: [{ speciesId: 'glutling', learned: ['enemyAdjacent', 'eval', 4] }] });
    expect(trained.owned[0].learned).toContain('enemyAdjacent');
    expect(trained.owned[0].learned).not.toContain('eval');
  });
});
