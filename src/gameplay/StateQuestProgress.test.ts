import { describe, expect, it } from 'vitest';
import { Campaign } from './Campaign';
import { LESSON_IDS, getLesson } from './WorldQuests';
import { instanceId } from './ArkanaCatalog';
import { learnedTerms } from './LearningTerms';
import { LessonSession } from '../combat/LessonSession';
import { QUEST_SOLUTIONS } from '../test/questSolutions';

describe('Neue Schleifen und Zustände im bestehenden Abenteuer', () => {
  it('erhält alte Abschlüsse, verlangt den Fund und speichert neue Fähigkeiten und Erfolge ohne Reset', () => {
    const old = { version: 2, worldVersion: 1, region: 'forest', introduced: true, completed: LESSON_IDS.slice(0, 20),
      owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }, { speciesId: 'felsbock' }], team: [instanceId('glutling')] };
    const campaign = new Campaign(old);
    expect(campaign.snapshot.completed).toHaveLength(20);
    expect(campaign.snapshot.owned).toHaveLength(3);
    expect(campaign.availableEncounters.map((encounter) => encounter.id)).toContain('frostmolch');
    campaign.interact('lesson:q24-frostfolge');
    expect(campaign.prepareMission('q24-frostfolge')).toContain('Frostmolch');
    campaign.apply('recruit-frostmolch'); campaign.apply('recruit-frostmolch');
    expect(campaign.snapshot.owned).toHaveLength(4);
    expect(campaign.availableEncounters.map((encounter) => encounter.id)).not.toContain('frostmolch');
    expect(campaign.snapshot.owned.find((unit) => unit.speciesId === 'frostmolch')?.learned).not.toContain('chill');
    for (const id of ['q21-solangeweg', 'q22-solangekampf', 'q24-frostfolge', 'q26-eisbruecke', 'q25-loeschen'] as const) {
      campaign.interact(`lesson:${id}`);
      const encounter = campaign.prepareMission(id);
      expect(typeof encounter, id).not.toBe('string');
      if (typeof encounter === 'string') throw new Error(encounter);
      const session = new LessonSession(getLesson(id), encounter.skills);
      session.execute(QUEST_SOLUTIONS[id], true); expect(session.snapshot.outcome, id).toBe('victory');
      expect(campaign.finishMission(id), id).toBeDefined(); campaign.leaveMission();
    }
    const reloaded = new Campaign(campaign.snapshot);
    expect([...reloaded.snapshot.completed].sort()).toEqual([...campaign.snapshot.completed].sort());
    expect(reloaded.snapshot.owned.find((unit) => unit.speciesId === 'frostmolch')?.learned).toEqual(expect.arrayContaining(['chill', 'extinguishAlly', 'while']));
    expect(learnedTerms(reloaded.snapshot.completed).map((term) => term.id)).toEqual(expect.arrayContaining(['while-loop', 'freezing', 'extinguishing', 'surface']));
    expect(reloaded.snapshot.completed).not.toContain('q23-brandfolge');
  });
  it('vergibt weder Frostmolch noch fortgeschrittene Befehle vor ihren Einführungen', () => {
    const campaign = new Campaign(); campaign.apply('meet-eldren'); campaign.apply('recruit-glutling');
    expect(campaign.apply('recruit-frostmolch')).toContain('Lichtpfad');
    expect(campaign.availableEncounters.some((encounter) => encounter.id === 'frostmolch')).toBe(false);
    expect(campaign.snapshot.owned[0].learned).not.toContain('while');
    expect(campaign.prepareMission('q22-solangekampf')).toEqual(expect.any(String));
    expect(learnedTerms(campaign.snapshot.completed).map((term) => term.id)).not.toContain('while-loop');
  });
});
