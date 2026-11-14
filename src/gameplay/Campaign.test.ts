import { afterEach, describe, expect, it, vi } from 'vitest';
import { Campaign, normalizeCampaign } from './Campaign';
import { ARKANA_SPECIES, instanceId } from './ArkanaCatalog';
import { LESSON_IDS, getLesson, type LessonId } from './WorldQuests';
import { QUEST_ROUTES, giverLessons, requirementsMet } from './QuestNetwork';
import { LessonSession } from '../combat/LessonSession';
import { BattleSession, missionPrograms } from '../combat/BattleSession';
import { Playback } from '../combat/Playback';
import { QUEST_SOLUTIONS } from '../test/questSolutions';

function start(): Campaign { const c = new Campaign(); c.apply('meet-eldren'); c.apply('recruit-glutling'); return c; }
function begin(c: Campaign, id: LessonId): LessonSession {
  c.interact(`lesson:${id}`); const encounter = c.prepareMission(id);
  if (typeof encounter === 'string') throw new Error(encounter);
  return new LessonSession(getLesson(id), encounter.skills);
}
function win(c: Campaign, id: LessonId): void {
  const s = begin(c, id); s.execute(QUEST_SOLUTIONS[id], true); expect(s.snapshot.outcome, id).toBe('victory');
  expect(c.finishMission(id)).toBeDefined(); c.leaveMission();
}
function tutorial(): Campaign { const c = start(); win(c, 'q01-glutspur'); win(c, 'q02-basisangriff'); return c; }
function forest(): Campaign { const c = tutorial(); win(c, 'q11-schleifenwache'); win(c, 'q12-steinrutsch'); c.apply('travel-forest'); return c; }
afterEach(() => vi.useRealTimers());

describe('Gebiete und unabhängige Aufgabenreihen', () => {
  it('beginnt im Tal ohne Arkana und führt Bewegung vor Angriff ein', () => {
    const c = new Campaign(); expect(c.region).toBe('valley'); expect(c.snapshot.owned).toEqual([]); expect(c.forestUnlocked).toBe(false);
    expect(c.availableEncounters.map((e) => e.id)).toEqual(['glutling']); expect(c.interact('giver:eldren').action).toBe('meet-eldren');
    expect(c.apply('recruit-glutling')).toContain('Eldren'); c.apply('meet-eldren'); c.apply('recruit-glutling'); c.apply('recruit-glutling'); expect(c.snapshot.owned).toHaveLength(1);
    expect(c.snapshot.owned[0].learned).toEqual(['moveRight', 'moveUp']); expect(c.prepareMission('q03-wiederkehr')).toContain('Voraussetzung');
    win(c, 'q01-glutspur'); const s = begin(c, 'q02-basisangriff'); expect(c.snapshot.owned[0].learned).toContain('attack'); expect(c.snapshot.owned[0].learned).not.toContain('repeat');
    s.execute(QUEST_SOLUTIONS['q02-basisangriff'], true); c.finishMission('q02-basisangriff'); c.leaveMission(); expect(c.objective).toContain('Wähle');
  });
  for (const order of [['q03-wiederkehr', 'q09-schachtelpfad', 'q11-schleifenwache'], ['q11-schleifenwache', 'q09-schachtelpfad', 'q03-wiederkehr']] as const) it(`erlaubt ${order.join(' → ')}`, () => {
    const c = tutorial(); expect(c.prepareMission('q04-musterpfad')).toContain('Voraussetzung'); expect(c.prepareMission('q10-schachtelkampf')).toContain('Voraussetzung');
    for (const id of order) { expect(c.questReady(id)).toBe(true); win(c, id); }
    expect(c.questReady('q04-musterpfad')).toBe(true); expect(c.questReady('q10-schachtelkampf')).toBe(true);
    const loaded = new Campaign(c.snapshot); expect(new Set(loaded.snapshot.completed)).toEqual(new Set(c.snapshot.completed)); expect(loaded.forestUnlocked).toBe(false);
    win(loaded, 'q10-schachtelkampf'); win(loaded, 'q04-musterpfad');
  });
  it('öffnet den Pass nach einer Einstiegsaufgabe und nur durch die abgeschlossene Runenwinde', () => {
    const c = tutorial(); expect(c.prepareMission('q12-steinrutsch')).toContain('eine dieser Aufgaben'); expect(c.apply('travel-forest')).toContain('blockiert');
    win(c, 'q03-wiederkehr'); expect(c.questReady('q12-steinrutsch')).toBe(true);
    const s = begin(c, 'q12-steinrutsch'); s.execute({ glutling: 'glutling.moveRight();' }, true); expect(c.forestUnlocked).toBe(false); expect(c.apply('travel-forest')).toContain('Beende'); c.leaveMission();
    win(c, 'q12-steinrutsch'); expect(c.forestUnlocked).toBe(true); expect(c.snapshot.completed).not.toContain('q09-schachtelpfad');
    expect(c.interact('travel').action).toBe('travel-forest'); c.apply('travel-forest'); expect(c.region).toBe('forest'); expect(new Campaign(c.snapshot).region).toBe('forest');
  });
  it('verlangt die Waldeinführung und lässt danach Rätsel und Kampf unabhängig offen', () => {
    const c = forest(); expect(c.objective).toContain('Lyra');
    for (const id of ['q06-waechter', 'q07-moosling', 'q13-lichtpfad'] as const) expect(c.prepareMission(id)).toContain('Voraussetzung');
    const s = begin(c, 'q05-aufmerksam'); s.execute(QUEST_SOLUTIONS['q05-aufmerksam']); expect(s.snapshot.outcome).toBe('ongoing'); expect(c.snapshot.completed).not.toContain('q05-aufmerksam');
    s.execute(QUEST_SOLUTIONS['q05-aufmerksam']); expect(s.snapshot.outcome).toBe('victory'); c.finishMission('q05-aufmerksam'); c.leaveMission();
    expect(c.questReady('q06-waechter')).toBe(true); expect(c.questReady('q13-lichtpfad')).toBe(true); win(c, 'q13-lichtpfad'); expect(c.snapshot.completed).not.toContain('q06-waechter');
    const loaded = new Campaign(c.snapshot); expect(loaded.snapshot.completed).toContain('q13-lichtpfad'); loaded.apply('travel-valley'); win(loaded, 'q09-schachtelpfad'); expect(loaded.forestUnlocked).toBe(true); loaded.apply('travel-forest'); win(loaded, 'q06-waechter');
  });
  it('bietet Menüs mit lokalen Folgequests und entdeckt keine entfernten Personen', () => {
    const c = new Campaign(); expect(c.visitGiver('eldren')).toBe(false); c.apply('meet-eldren'); c.apply('recruit-glutling');
    expect(c.interact('giver:eldren').action).toBe('quests:eldren'); expect(c.visitGiver('eldren')).toBe(true); expect(c.snapshot.discovered).toEqual(giverLessons('eldren'));
    expect(c.visitGiver('lyra')).toBe(false); const before = c.snapshot; expect(c.interact('lesson:q05-aufmerksam').action).toBeUndefined(); expect(c.snapshot).toEqual(before);
    expect(c.interact('giver:lyra').text).toContain('Aetherwald');
  });
  it('sammelt Moosling erst im Wald nach Lyra und entfernt es dauerhaft aus der Welt', () => {
    const c = forest(); expect(c.availableEncounters).toEqual([]); expect(c.apply('recruit-moosling')).toContain('Wald');
    win(c, 'q05-aufmerksam'); expect(c.availableEncounters.map((e) => e.id)).toEqual(['moosling']); expect(c.interact('moosling').action).toBe('recruit-moosling');
    c.apply('recruit-moosling'); c.apply('recruit-moosling'); expect(c.snapshot.owned).toHaveLength(2); expect(c.snapshot.owned[1].learned).toEqual(expect.arrayContaining(['repeat', 'attack', 'enemyAdjacent']));
    c.toggleTeam(instanceId('glutling')); expect(c.availableEncounters).toEqual([]); expect(new Campaign(c.snapshot).availableEncounters).toEqual([]); c.apply('travel-valley'); expect(c.availableEncounters).toEqual([]);
  });
  it('öffnet zwei Teamplätze erst mit der Team-Einführung nach Mooslings Soloquest', () => {
    const c = forest(); win(c, 'q05-aufmerksam'); c.visitGiver('tala'); expect(c.prepareMission('q07-moosling')).toContain('Finde zuerst Moosling'); c.apply('recruit-moosling');
    c.interact('lesson:q07-moosling'); expect(c.lessonOffer('q07-moosling').actionLabel).toContain('Moosling wählen'); win(c, 'q07-moosling'); expect(c.teamLimit).toBe(1);
    c.interact('lesson:q08-team'); expect(c.teamLimit).toBe(1); expect(c.prepareMission('q08-team')).toMatchObject({ team: ['moosling', 'glutling'] }); expect(c.teamLimit).toBe(2);
    expect(c.toggleTeam(instanceId('glutling'))).toContain('während'); c.leaveMission(); const loaded = new Campaign(c.snapshot); expect(loaded.teamLimit).toBe(2);
    expect(loaded.activeTeam.map((a) => a.speciesId)).toEqual(['moosling', 'glutling']); win(loaded, 'q08-team'); loaded.apply('travel-valley'); win(loaded, 'q01-glutspur'); expect(loaded.teamLimit).toBe(2);
  });
  it('bewahrt alte Abschlüsse und Waldzugang ohne eine neue Aufgabe als bestanden zu markieren', () => {
    const old = LESSON_IDS.slice(0, 8); const c = new Campaign({ version: 2, introduced: true, completed: old, owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }], team: [instanceId('moosling'), instanceId('glutling')] });
    expect(c.snapshot.completed).toEqual(old); expect(c.region).toBe('forest'); expect(c.forestUnlocked).toBe(true); expect(c.teamLimit).toBe(2); expect(c.snapshot.completed).not.toContain('q12-steinrutsch');
    expect(c.snapshot.legacyForestAccess).toBe(true); c.apply('travel-valley'); expect(new Campaign(c.snapshot).snapshot).toEqual(c.snapshot);
  });
  it('archiviert numerische Trainingssiege und erhält deren Teams', () => {
    const c = new Campaign({ version: 1, introduced: true, owned: [{ speciesId: 'moosling' }, { speciesId: 'glutling' }], team: [instanceId('moosling'), instanceId('glutling')], completed: [1, 2, 3] });
    expect(c.snapshot.completed).toEqual([]); expect(c.snapshot.legacyProgress.completed).toEqual([1, 2, 3]); expect(c.activeTeam).toHaveLength(2); expect(c.forestUnlocked).toBe(false);
    c.interact('lesson:q01-glutspur'); c.prepareMission('q01-glutspur'); expect(c.activeTeam.map((a) => a.speciesId)).toEqual(['glutling']);
  });
  it('normalisiert defekte Daten, erhält aber unabhängige Abschlüsse ohne Katalogreihenfolge', () => {
    expect(normalizeCampaign({ version: 2, worldVersion: 1, region: 'forest', completed: ['q03-wiederkehr'], owned: [null, { speciesId: 'water' }] })).toMatchObject({ region: 'valley', completed: [], owned: [] });
    const c = new Campaign({ version: 2, worldVersion: 1, completed: ['q11-schleifenwache', 'q02-basisangriff', 'q01-glutspur'], introductions: ['q08-team'], owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }], team: [instanceId('moosling'), instanceId('glutling')] });
    expect(c.snapshot.completed).toContain('q11-schleifenwache'); expect(c.teamLimit).toBe(1); expect(c.activeTeam).toHaveLength(1); const snapshot = c.snapshot; snapshot.completed.length = 0; expect(c.snapshot.completed).toHaveLength(3);
  });
  it('stellt im Training alle Befehle bereit, ohne Fortschritt zu vergeben', () => {
    const c = tutorial(); const before = c.snapshot; const encounter = c.beginTraining(2, ['glutling']); if (typeof encounter === 'string') throw new Error(encounter);
    expect(encounter.skills.glutling).toEqual(ARKANA_SPECIES.glutling.supported); const s = new BattleSession(2, encounter.team, encounter.skills); s.execute(missionPrograms(2, encounter.team), true); expect(s.snapshot.outcome).toBe('victory');
    expect(c.finishMission('q12-steinrutsch')).toBeUndefined(); expect(c.apply('travel-forest')).toContain('Beende'); c.leaveMission(); expect(c.snapshot).toEqual(before);
  });
  it('sperrt Waldsensoren im Tal auch bei alten vollständig gelernten Arkana', () => {
    const c = new Campaign({ version: 2, introduced: true, owned: [{ speciesId: 'glutling', learned: ARKANA_SPECIES.glutling.supported }], team: [instanceId('glutling')] });
    const s = begin(c, 'q01-glutspur'); const before = s.snapshot; expect(s.execute({ glutling: 'if (glutling.pathRightClear) { glutling.moveRight(); }' }, true)).toContain('nicht freigegeben'); expect(s.snapshot).toEqual(before);
  });
  it('bestätigt den Pass erst nach Wiedergabe, nicht nach abgebrochener Simulation', () => {
    vi.useFakeTimers(); const c = tutorial(); win(c, 'q03-wiederkehr'); const s = begin(c, 'q12-steinrutsch'); s.execute(QUEST_SOLUTIONS['q12-steinrutsch'], true);
    const playback = new Playback(() => {}, () => {}); playback.play(s.frames, () => c.finishMission('q12-steinrutsch')); playback.stop(); vi.runAllTimers(); expect(c.forestUnlocked).toBe(false);
    playback.play(s.frames, () => c.finishMission('q12-steinrutsch')); vi.runAllTimers(); expect(c.forestUnlocked).toBe(true); const before = c.snapshot;
    expect(c.finishMission('q12-steinrutsch')).toMatchObject({ repeated: true }); expect(c.snapshot).toEqual(before);
  });
  it('beschreibt alle Voraussetzungen ausdrücklich', () => {
    for (const id of LESSON_IDS) for (const prior of [...QUEST_ROUTES[id].all, ...(QUEST_ROUTES[id].any ?? [])]) expect(LESSON_IDS).toContain(prior);
    expect(requirementsMet('q11-schleifenwache', ['q01-glutspur', 'q02-basisangriff'])).toBe(true);
  });
});
