import { describe, expect, it } from 'vitest';
import { Campaign } from './Campaign';
import { learnedTerms } from './LearningTerms';
import { LESSON_IDS } from './WorldQuests';

describe('Gelernte Fachbegriffe', () => {
  it('öffnet Zustände und Rollen erst nach der jeweiligen Fähigkeitseinführung mit konkretem Beispiel', () => {
    expect(learnedTerms(['q02-basisangriff']).some((term) => term.id === 'cooldown')).toBe(false);
    expect(learnedTerms(['q14-feuerprobe']).map((term) => term.id)).toEqual(expect.arrayContaining(['status', 'cooldown']));
    expect(learnedTerms(['q15-wurzelschutz']).some((term) => term.id === 'tank')).toBe(false);
    expect(learnedTerms(['q18-steinpanzer']).find((term) => term.id === 'tank')?.code).toContain('felsbock.stoneArmor()');
    expect(learnedTerms(['q16-heilmoos']).find((term) => term.id === 'regeneration')?.code).toContain('moosling.healingMoss()');
  });
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
    expect(learnedTerms(loaded.snapshot.completed).find((term) => term.id === 'loop')?.furtherExamples).toEqual([]);
    loaded.leaveMission(); loaded.interact('lesson:q04-musterpfad'); loaded.beginMission('q04-musterpfad');
    expect(learnedTerms(loaded.snapshot.completed).map((term) => term.id)).not.toContain('loop-body');
    loaded.completeMission('q04-musterpfad');
    const terms = learnedTerms(new Campaign(JSON.parse(JSON.stringify(loaded.snapshot))).snapshot.completed);
    expect(terms.map((term) => term.id)).toEqual(['instruction', 'sequence', 'health', 'loop', 'loop-body']);
    expect(terms.find((term) => term.id === 'loop')?.furtherExamples?.[0].code).toContain('glutling.turnLeft();');
    loaded.leaveMission(); loaded.visitGiver('mira'); loaded.prepareMission('q12-steinrutsch'); loaded.completeMission('q12-steinrutsch'); loaded.leaveMission(); loaded.apply('travel-forest');
    loaded.visitGiver('lyra'); loaded.beginMission('q05-aufmerksam');
    expect(learnedTerms(loaded.snapshot.completed).map((term) => term.id)).not.toContain('condition');
    loaded.completeMission('q05-aufmerksam');
    const completed = new Campaign(JSON.parse(JSON.stringify(loaded.snapshot)));
    expect(learnedTerms(completed.snapshot.completed).map((term) => term.id)).toEqual(['instruction', 'sequence', 'health', 'loop', 'loop-body', 'condition', 'branch']);
  });
  it('bewahrt die früher an der Runenwinde gelernten Begriffe nur für entsprechende alte Abschlüsse', () => {
    const completed = ['q01-glutspur', 'q02-basisangriff', 'q03-wiederkehr', 'q12-steinrutsch'];
    const old = new Campaign({ version: 2, worldVersion: 1, introduced: true, completed });
    expect(old.snapshot.legacyPassKnowledge).toBe(true);
    expect(learnedTerms(old.snapshot.completed, old.snapshot.legacyPassKnowledge).map((term) => term.id)).toEqual(expect.arrayContaining(['nested-loop', 'loop-body']));
    const loaded = new Campaign(old.snapshot); expect(loaded.snapshot.legacyPassKnowledge).toBe(true);
    const current = new Campaign({ version: 2, worldVersion: 1, lessonRevision: 2, introduced: true, completed });
    expect(current.snapshot.legacyPassKnowledge).toBeUndefined();
    expect(learnedTerms(current.snapshot.completed, current.snapshot.legacyPassKnowledge).map((term) => term.id)).not.toContain('nested-loop');
    expect(current.forestUnlocked).toBe(true); expect(old.forestUnlocked).toBe(true);
    expect(new Campaign({ version: 2, lessonRevision: 2, legacyPassKnowledge: true }).snapshot.legacyPassKnowledge).toBeUndefined();
  });
  it('übernimmt keine Begriffe aus alten Arenasiegen oder freiem Training', () => {
    const campaign = new Campaign({ version: 1, introduced: true, completed: [1, 2, 3], owned: [{ speciesId: 'glutling', learned: ['attack', 'repeat'] }] });
    campaign.beginTraining(1, ['glutling']); campaign.completeMission(LESSON_IDS[0]); campaign.leaveMission();
    expect(learnedTerms(campaign.snapshot.completed)).toEqual([]);
  });
  it('öffnet das Schleifenwissen auch über die frei gewählten Einstiegsreihen', () => {
    for (const id of ['q09-schachtelpfad', 'q11-schleifenwache'] as const) {
      const campaign = new Campaign(); campaign.apply('meet-eldren'); campaign.apply('recruit-glutling');
      for (const tutorial of ['q01-glutspur', 'q02-basisangriff'] as const) {
        campaign.interact(`lesson:${tutorial}`); campaign.prepareMission(tutorial); campaign.completeMission(tutorial); campaign.leaveMission();
      }
      campaign.interact(`lesson:${id}`); campaign.prepareMission(id);
      expect(learnedTerms(campaign.snapshot.completed).map((term) => term.id)).not.toContain('loop');
      campaign.completeMission(id); campaign.leaveMission();
      const terms = learnedTerms(new Campaign(campaign.snapshot).snapshot.completed).map((term) => term.id);
      expect(terms).toContain('loop');
      if (id === 'q09-schachtelpfad') expect(terms).toEqual(expect.arrayContaining(['loop-body', 'nested-loop']));
      expect(campaign.snapshot.completed).not.toContain('q03-wiederkehr');
    }
  });
});
