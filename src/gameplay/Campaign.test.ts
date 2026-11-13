import { afterEach, describe, expect, it, vi } from 'vitest';
import { Campaign, normalizeCampaign } from './Campaign';
import { ARKANA_SPECIES, instanceId } from './ArkanaCatalog';
import { LESSON_IDS, getLesson, type LessonId } from './WorldQuests';
import { LessonSession } from '../combat/LessonSession';
import { BattleSession, missionPrograms } from '../combat/BattleSession';
import { Playback } from '../combat/Playback';

const solutions: Record<LessonId, string> = {
  'q01-glutspur': 'glutling.moveRight(); glutling.moveRight(); glutling.moveUp();',
  'q02-basisangriff': 'glutling.moveRight(); glutling.moveRight(); glutling.attack(); glutling.attack();',
  'q03-wiederkehr': 'repeat(4, () => { glutling.moveRight(); });',
};
function introduced(): Campaign {
  const campaign = new Campaign(); campaign.apply('meet-eldren'); campaign.apply('recruit-glutling'); return campaign;
}
function begin(campaign: Campaign, id: LessonId): LessonSession {
  campaign.interact(`lesson:${id}`); const encounter = campaign.beginMission(id);
  if (typeof encounter === 'string') throw new Error(encounter);
  return new LessonSession(getLesson(id), encounter.skills.glutling ?? []);
}
function win(campaign: Campaign, id: LessonId): void {
  const session = begin(campaign, id); session.execute({ glutling: solutions[id] }, true);
  expect(session.snapshot.outcome).toBe('victory'); expect(campaign.completeMission(id)).toBeDefined(); campaign.leaveMission();
}
afterEach(() => vi.useRealTimers());

describe('Gestufte Lernquests und freie Trainingsarena', () => {
  it('beginnt mit Glutling und ausschließlich Bewegungsanweisungen', () => {
    const campaign = new Campaign(); expect(campaign.snapshot.owned).toEqual([]);
    expect(campaign.interact('arkanist-eldren').action).toBe('meet-eldren');
    expect(campaign.interact('moosling').action).toBeUndefined();
    campaign.apply('meet-eldren'); expect(campaign.objective).toContain('Glutling');
    campaign.apply('recruit-glutling'); campaign.apply('recruit-glutling');
    expect(campaign.snapshot.owned).toHaveLength(1);
    expect(campaign.snapshot.owned[0].learned).toEqual(['moveRight', 'moveUp']);
    expect(campaign.activeTeam[0].speciesId).toBe('glutling');
    expect(campaign.beginMission(LESSON_IDS[0])).toContain('Entdecke');
  });
  it('führt die drei Aufgaben aus und vergibt Angriff und Schleifen erst bei ihrer Einführung', () => {
    const campaign = introduced();
    campaign.interact('lesson:q02-basisangriff'); expect(campaign.beginMission(LESSON_IDS[1])).toContain('vorherige');
    win(campaign, LESSON_IDS[0]);
    expect(campaign.snapshot.owned[0].learned).not.toContain('attack');
    const attack = begin(campaign, LESSON_IDS[1]);
    expect(campaign.snapshot.owned[0].learned).toContain('attack');
    expect(campaign.snapshot.owned[0].learned).not.toContain('repeat');
    attack.execute({ glutling: solutions[LESSON_IDS[1]] }, true); expect(attack.snapshot.outcome).toBe('victory');
    campaign.completeMission(LESSON_IDS[1]); campaign.leaveMission();
    expect(campaign.snapshot.owned[0].learned).not.toContain('repeat');
    win(campaign, LESSON_IDS[2]);
    expect(campaign.snapshot.owned[0].learned).toContain('repeat');
    expect(campaign.snapshot.owned[0].learned).not.toContain('enemyAdjacent');
    expect(campaign.snapshot.completed).toEqual([...LESSON_IDS]);
    campaign.apply('recruit-moosling'); expect(campaign.has('moosling')).toBe(true);
    expect(campaign.snapshot.owned[1].learned).toContain('repeat');
    expect(campaign.teamLimit).toBe(1);
  });
  it('begrenzt Wiederholungsquests auch bei alten Spielständen mit allen Fähigkeiten', () => {
    const campaign = new Campaign({ version: 1, introduced: true, owned: [{ speciesId: 'glutling', learned: [...ARKANA_SPECIES.glutling.supported] }], team: [instanceId('glutling')], completed: [1, 2, 3], discovered: [1, 2, 3] });
    expect(campaign.snapshot.completed).toEqual([]); expect(campaign.snapshot.legacyProgress.completed).toEqual([1, 2, 3]);
    const session = begin(campaign, LESSON_IDS[0]); const before = session.snapshot;
    expect(session.execute({ glutling: 'repeat(2, () => { glutling.moveRight(); });' }, true)).toContain('nicht freigegeben');
    expect(session.snapshot).toEqual(before);
    expect(campaign.snapshot.owned[0].learned).toContain('enemyAdjacent');
  });
  it('stellt alle Befehle im Training bereit, ohne Lernfortschritt oder Team zu ändern', () => {
    const campaign = introduced(); const before = campaign.snapshot;
    const encounter = campaign.beginTraining(2, ['glutling']);
    if (typeof encounter === 'string') throw new Error(encounter);
    expect(encounter.kind).toBe('training'); expect(encounter.skills.glutling).toEqual(ARKANA_SPECIES.glutling.supported);
    const session = new BattleSession(2, encounter.team, encounter.skills);
    session.execute(missionPrograms(2, encounter.team), true); expect(session.snapshot.outcome).toBe('victory');
    expect(campaign.completeMission(LESSON_IDS[0])).toBeUndefined();
    expect(campaign.toggleTeam(instanceId('glutling'))).toContain('während');
    campaign.leaveMission(); expect(campaign.snapshot).toEqual(before);
    expect(campaign.beginTraining(3, ['glutling', 'moosling'])).toContain('gesammelte');
  });
  it('ermöglicht Duo-Training und erhält die Besetzung alter Teams', () => {
    const campaign = new Campaign({ version: 1, introduced: true, owned: [{ speciesId: 'moosling' }, { speciesId: 'glutling' }], team: [instanceId('moosling'), instanceId('glutling')], completed: [1, 2, 3] });
    expect(campaign.activeTeam).toHaveLength(2); expect(campaign.teamLimit).toBe(2);
    expect(campaign.beginTraining(3, ['glutling', 'glutling'])).toContain('unterschiedliche');
    const encounter = campaign.beginTraining(3, ['glutling', 'moosling']);
    if (typeof encounter === 'string') throw new Error(encounter);
    const session = new BattleSession(3, encounter.team, encounter.skills);
    session.execute(missionPrograms(3, encounter.team), true); expect(session.snapshot.outcome).toBe('victory');
    expect(session.frames[0].actor).toBe('glutling');
  });
  it('belohnt erst den sichtbar abgeschlossenen Lauf und verwirft einen abgebrochenen Timerlauf', () => {
    vi.useFakeTimers(); const campaign = introduced(); const session = begin(campaign, LESSON_IDS[0]);
    session.execute({ glutling: solutions[LESSON_IDS[0]] }, true);
    const playback = new Playback(() => {}, () => {});
    playback.play(session.frames, () => campaign.completeMission(LESSON_IDS[0])); playback.stop(); vi.runAllTimers();
    expect(campaign.snapshot.completed).toEqual([]);
    playback.play(session.frames, () => campaign.completeMission(LESSON_IDS[0])); vi.runAllTimers();
    expect(campaign.snapshot.completed).toEqual([LESSON_IDS[0]]); expect(campaign.completeMission(LESSON_IDS[0])).toBeUndefined();
    campaign.leaveMission(); expect(campaign.completeMission(LESSON_IDS[1])).toBeUndefined();
  });
  it('bewahrt Zustände unabhängig von Teamwahl und normalisiert beschädigte Einträge', () => {
    const campaign = introduced(); const saved = campaign.snapshot; saved.owned.length = 0;
    expect(campaign.has('glutling')).toBe(true);
    campaign.toggleTeam(instanceId('glutling')); expect(campaign.activeTeam).toEqual([]); expect(campaign.has('glutling')).toBe(true);
    const loaded = new Campaign(JSON.parse(JSON.stringify(campaign.snapshot))); expect(loaded.snapshot).toEqual(campaign.snapshot);
    expect(normalizeCampaign({ version: 2, owned: [null, { speciesId: 'water' }, { speciesId: 'glutling' }, { speciesId: 'glutling' }], team: ['unknown'], completed: [LESSON_IDS[2]] })).toMatchObject({ completed: [], team: [] });
    expect(new Campaign(undefined, true).snapshot.introduced).toBe(true);
  });
});
