import { describe, expect, it } from 'vitest';
import { Campaign } from './Campaign';
import { learnedTerms } from './LearningTerms';
import { LESSON_IDS } from './WorldQuests';

describe('Gelernte Fachbegriffe', () => {
  it('öffnet Einträge stufenweise durch Questabschlüsse und erhält sie nach dem Laden', () => {
    const campaign = new Campaign(); campaign.apply('meet-eldren'); campaign.apply('recruit-glutling');
    campaign.interact('lesson:q01-glutspur'); campaign.beginMission(LESSON_IDS[0]);
    expect(learnedTerms(campaign.snapshot.completed)).toEqual([]);
    campaign.completeMission(LESSON_IDS[0]); campaign.leaveMission();
    expect(learnedTerms(campaign.snapshot.completed).map((term) => term.id)).toEqual(['instruction', 'sequence']);
    campaign.interact('lesson:q02-basisangriff'); campaign.beginMission(LESSON_IDS[1]);
    expect(learnedTerms(campaign.snapshot.completed).map((term) => term.id)).not.toContain('health');
    campaign.completeMission(LESSON_IDS[1]); campaign.leaveMission();
    expect(learnedTerms(campaign.snapshot.completed).map((term) => term.id)).toEqual(['instruction', 'sequence', 'health']);
    campaign.interact('lesson:q03-wiederkehr'); campaign.beginMission(LESSON_IDS[2]); campaign.completeMission(LESSON_IDS[2]);
    const loaded = new Campaign(JSON.parse(JSON.stringify(campaign.snapshot)));
    expect(learnedTerms(loaded.snapshot.completed).map((term) => term.id)).toEqual(['instruction', 'sequence', 'health', 'loop']);
  });
  it('übernimmt keine Begriffe aus alten Arenasiegen oder freiem Training', () => {
    const campaign = new Campaign({ version: 1, introduced: true, completed: [1, 2, 3], owned: [{ speciesId: 'glutling', learned: ['attack', 'repeat'] }] });
    campaign.beginTraining(1, ['glutling']); campaign.completeMission(LESSON_IDS[0]); campaign.leaveMission();
    expect(learnedTerms(campaign.snapshot.completed)).toEqual([]);
  });
});
