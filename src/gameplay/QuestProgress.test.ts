import { describe, expect, it } from 'vitest';
import { Campaign } from './Campaign';
import { QUEST_SERIES, giverHasAvailableQuest, giverProgress } from './QuestProgress';
import { QUEST_ROUTES } from './QuestNetwork';
import { LESSON_IDS, type LessonId } from './WorldQuests';
import { instanceId } from './ArkanaCatalog';

const early: LessonId[] = ['q01-glutspur', 'q02-basisangriff', 'q11-schleifenwache', 'q12-steinrutsch', 'q05-aufmerksam', 'q07-moosling'];
const saved = (completed: readonly LessonId[] = early) => new Campaign({ version: 2, worldVersion: 1, region: 'forest', introduced: true, completed, discovered: LESSON_IDS,
  owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }], team: [instanceId('glutling')] });

describe('Questreihen und tatsächlicher Fortschritt', () => {
  it('ordnet jede Quest genau einmal ihrem Geber zu und erfindet keine Reihenfolge zwischen gleichzeitigen Übungen', () => {
    const ids = QUEST_SERIES.flatMap((series) => series.stages.flatMap((stage) => stage.quests));
    expect(new Set(ids).size).toBe(LESSON_IDS.length); expect(ids).toHaveLength(LESSON_IDS.length);
    for (const series of QUEST_SERIES) {
      const earlier: LessonId[] = [];
      for (const stage of series.stages) {
        for (const id of stage.quests) {
          expect(QUEST_ROUTES[id].giver).toBe(series.giver);
          const local = QUEST_ROUTES[id].all.filter((prior) => series.stages.some((candidate) => candidate.quests.includes(prior)));
          expect(local.every((prior) => earlier.includes(prior))).toBe(true);
        }
        earlier.push(...stage.quests);
      }
    }
  });
  it('bietet nach Mooslings Einstieg alle drei Übungen frei an und zählt Erledigtes nicht als nächsten Schritt', () => {
    const campaign = saved(); const before = campaign.snapshot;
    expect(giverProgress(campaign, 'tala')).toMatchObject({ completed: 1, total: 7, ready: ['q08-team', 'q15-wurzelschutz', 'q16-heilmoos'], next: 'q08-team' });
    const rankenFirst = saved([...early, 'q15-wurzelschutz']);
    expect(giverProgress(rankenFirst, 'tala').ready).toEqual(['q08-team', 'q16-heilmoos']); expect(campaign.snapshot).toEqual(before);
  });
  it('fordert Branns externe Feuerprobe, bevor Talas Rollenkampf als bereit markiert wird', () => {
    const done: LessonId[] = [...early, 'q08-team', 'q15-wurzelschutz', 'q16-heilmoos'];
    expect(giverProgress(saved(done), 'tala')).toMatchObject({ completed: 4, total: 7, ready: [], pending: 'q17-teamrollen' });
    expect(giverProgress(saved(done), 'tala').next).toBeUndefined();
    expect(giverProgress(saved([...done, 'q14-feuerprobe']), 'tala').next).toBe('q17-teamrollen');
  });
  it('empfiehlt nach vollständigem Abschluss keine Wiederholung als neue Quest und überspringt keine Besitzprüfung', () => {
    const completed = saved(LESSON_IDS); expect(giverProgress(completed, 'tala')).toMatchObject({ completed: 7, total: 7, ready: [] });
    expect(giverProgress(completed, 'tala').next).toBeUndefined(); expect(giverProgress(completed, 'tala').pending).toBeUndefined();
    const missing = new Campaign({ ...saved().snapshot, completed: early.slice(0, -1), owned: [{ speciesId: 'glutling' }] });
    expect(giverProgress(missing, 'tala').next).toBeUndefined(); expect(missing.missionError('q07-moosling')).toContain('Finde zuerst Moosling');
  });
});

describe('Questmarker in der Spielwelt', () => {
  it('zeigt den Einstieg bei Eldren und erst nach Glutlings Aufnahme neue Lernquests', () => {
    const campaign = new Campaign();
    expect(giverHasAvailableQuest(campaign, 'eldren')).toBe(true);
    expect(giverHasAvailableQuest(campaign, 'brann')).toBe(false);
    campaign.apply('meet-eldren');
    expect(giverHasAvailableQuest(campaign, 'eldren')).toBe(false);
    campaign.apply('recruit-glutling');
    expect(giverHasAvailableQuest(campaign, 'eldren')).toBe(true);
    expect(giverHasAvailableQuest(campaign, 'brann')).toBe(false);
    expect(campaign.snapshot.discovered).toEqual([]);
  });

  it('behält den Marker bei einer freigeschalteten Folgequest und ignoriert bloße Wiederholungen', () => {
    const first = saved(early.slice(0, 5));
    expect(giverHasAvailableQuest(first, 'lyra')).toBe(true);
    const after = saved([...early, 'q06-waechter']);
    expect(giverHasAvailableQuest(after, 'lyra')).toBe(false);
    after.visitGiver('lyra');
    expect(after.lessonOffer('q06-waechter').action).toBeTruthy();
    expect(giverHasAvailableQuest(after, 'lyra')).toBe(false);
    const unlocked = saved([...after.snapshot.completed, 'q13-lichtpfad', 'q21-solangeweg']);
    expect(giverHasAvailableQuest(unlocked, 'lyra')).toBe(true);
  });

  it('markiert nach vollständigem Abschluss keinen Questgeber und verändert den Spielstand nicht', () => {
    const campaign = saved(LESSON_IDS); const before = campaign.snapshot;
    for (const giver of ['lyra', 'neria', 'tala'] as const) expect(giverHasAvailableQuest(campaign, giver)).toBe(false);
    expect(campaign.snapshot).toEqual(before);
  });

  it('zeigt keine Angebote aus einem anderen Gebiet', () => {
    const campaign = saved();
    expect(giverHasAvailableQuest(campaign, 'eldren')).toBe(false);
    expect(giverHasAvailableQuest(campaign, 'tala')).toBe(true);
    const village = new Campaign({ ...campaign.snapshot, region: 'village' });
    expect(giverHasAvailableQuest(village, 'tala')).toBe(false);
  });
});
