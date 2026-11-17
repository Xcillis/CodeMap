import { afterEach, describe, expect, it, vi } from 'vitest';
import { Campaign, normalizeCampaign } from './Campaign';
import { ARKANA_SPECIES, BASIC_MOVEMENT, instanceId } from './ArkanaCatalog';
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
  it('entfernt Mooslings alte Tankfreigabe beim Laden ohne abgeschlossene Quests zu verlieren', () => {
    const campaign = new Campaign({ version: 2, worldVersion: 1, region: 'forest', introduced: true,
      completed: LESSON_IDS.slice(0, 17), owned: [{ speciesId: 'moosling', learned: ['barkGuard', 'healingMoss', 'vineSnare'] }] });
    expect(campaign.snapshot.owned[0].learned).toEqual(expect.arrayContaining(['healingMoss', 'vineSnare']));
    expect(campaign.snapshot.owned[0].learned).not.toContain('barkGuard'); expect(campaign.snapshot.completed).toContain('q15-wurzelschutz');
    expect(campaign.snapshot.completed).toContain('q17-teamrollen'); expect(campaign.teamLimit).toBe(2);
  });
  it('startet nach bestätigtem Erfolg eine Folgequest desselben Gebers ohne Welt-Rückkehr', () => {
    const c = start(); const session = begin(c, 'q01-glutspur'); const before = c.snapshot;
    expect(c.continueMission('q02-basisangriff')).toContain('noch nicht verfügbar'); expect(c.snapshot).toEqual(before);
    session.execute(QUEST_SOLUTIONS['q01-glutspur'], true);
    expect(c.followUpQuests('q01-glutspur')).toEqual([]); // Simulation alone is not the saved visible success.
    const completion = c.finishMission('q01-glutspur');
    expect(completion?.followUps).toEqual([{ lesson: 'q02-basisangriff', title: getLesson('q02-basisangriff').title }]);
    const saved = c.snapshot; expect(saved.introductions).not.toContain('q02-basisangriff');
    expect(c.continueMission('q14-feuerprobe')).toContain('noch nicht verfügbar'); expect(c.snapshot).toEqual(saved);
    const next = c.continueMission('q02-basisangriff');
    expect(next).toMatchObject({ kind: 'lesson', lesson: 'q02-basisangriff', team: ['glutling'] });
    expect(c.snapshot.completed).toEqual(['q01-glutspur']); expect(c.snapshot.introductions).toContain('q02-basisangriff');
    expect(c.snapshot.owned[0].learned).toContain('attack'); expect(c.snapshot.region).toBe(saved.region);
    const active = c.snapshot; expect(c.continueMission('q03-wiederkehr')).toContain('noch nicht verfügbar'); expect(c.snapshot).toEqual(active);
  });
  it('bietet mehrere offene Aufgaben des Gebers an, auch wenn sie noch nicht einzeln entdeckt wurden', () => {
    const c = tutorial(); const session = begin(c, 'q09-schachtelpfad'); session.execute(QUEST_SOLUTIONS['q09-schachtelpfad'], true);
    expect(c.snapshot.discovered).not.toContain('q10-schachtelkampf');
    const options = c.finishMission('q09-schachtelpfad')?.followUps?.map((quest) => quest.lesson);
    expect(options).toEqual(['q10-schachtelkampf', 'q12-steinrutsch']);
    expect(c.continueMission('q12-steinrutsch')).toMatchObject({ kind: 'lesson', lesson: 'q12-steinrutsch' });
    expect(c.snapshot.discovered).toContain('q12-steinrutsch'); expect(c.snapshot.completed).not.toContain('q12-steinrutsch');
  });
  it('bereitet für die Folgequest das nötige Team vor und vergibt keine Wiederholung als neue Quest', () => {
    const c = forest(); win(c, 'q05-aufmerksam'); c.apply('recruit-moosling');
    const solo = begin(c, 'q07-moosling'); solo.execute(QUEST_SOLUTIONS['q07-moosling'], true);
    const options = c.finishMission('q07-moosling')?.followUps?.map((quest) => quest.lesson);
    expect(options).toEqual(['q08-team', 'q15-wurzelschutz', 'q16-heilmoos']); expect(c.teamLimit).toBe(1);
    expect(c.continueMission('q08-team')).toMatchObject({ team: ['moosling', 'glutling'] }); expect(c.teamLimit).toBe(2);
    expect(c.snapshot.completed).not.toContain('q08-team');
    c.leaveMission(); const repeat = begin(c, 'q07-moosling');
    expect(c.followUpQuests('q07-moosling')).toEqual([]); expect(c.continueMission('q15-wurzelschutz')).toContain('noch nicht verfügbar');
    repeat.execute(QUEST_SOLUTIONS['q07-moosling'], true);
    expect(c.finishMission('q07-moosling')?.followUps?.some((quest) => quest.lesson === 'q07-moosling')).toBe(false);
  });
  it('überspringt weder Gebiet, fehlende Arkana noch Voraussetzungen und bietet im Training keine Fortsetzung', () => {
    const c = forest(); const session = begin(c, 'q05-aufmerksam'); session.execute(QUEST_SOLUTIONS['q05-aufmerksam'], true);
    expect(c.finishMission('q05-aufmerksam')?.followUps?.map((quest) => quest.lesson)).toEqual(['q06-waechter']);
    expect(c.continueMission('q07-moosling')).toContain('noch nicht verfügbar');
    c.leaveMission(); c.beginTraining(1, ['glutling']); expect(c.followUpQuests('q05-aufmerksam')).toEqual([]);
    expect(c.continueMission('q06-waechter')).toContain('noch nicht verfügbar');
    const withoutFelsbock = new Campaign({ version: 2, worldVersion: 1, region: 'valley', introduced: true, completed: LESSON_IDS.slice(0, 17), owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }] });
    begin(withoutFelsbock, 'q12-steinrutsch'); expect(withoutFelsbock.finishMission('q12-steinrutsch')?.followUps).toEqual([]);
  });
  it('findet Felsbock am freien Pass und verdient den dritten Platz erst mit dem Koordinationsabschluss', () => {
    const fresh = tutorial(); expect(fresh.availableEncounters.some((item) => item.id === 'felsbock')).toBe(false);
    expect(fresh.apply('recruit-felsbock')).toContain('Steinrutsch');
    const c = new Campaign({ version: 2, worldVersion: 1, region: 'valley', introduced: true,
      completed: LESSON_IDS.slice(0, 17), owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }], team: [instanceId('glutling'), instanceId('moosling')] });
    expect(c.teamLimit).toBe(2); expect(c.availableEncounters.map((item) => item.id)).toEqual(['felsbock']);
    c.interact('lesson:q18-steinpanzer'); expect(c.prepareMission('q18-steinpanzer')).toContain('Finde Felsbock');
    expect(c.interact('felsbock').action).toBe('recruit-felsbock'); c.apply('recruit-felsbock'); c.apply('recruit-felsbock');
    expect(c.snapshot.owned).toHaveLength(3); expect(c.availableEncounters).toEqual([]);
    expect(c.activeTeam.map((unit) => unit.speciesId)).toEqual(['glutling', 'moosling']);
    expect(c.snapshot.owned[2].learned).not.toContain('stoneArmor'); expect(c.snapshot.owned[2].learned).not.toContain('healingMoss');
    expect(c.beginTraining(3, ['glutling', 'moosling', 'felsbock'])).toContain('dritten Teamplatz');
    win(c, 'q18-steinpanzer'); expect(c.teamLimit).toBe(2);
    const session = begin(c, 'q19-deckung'); expect(c.teamLimit).toBe(2); expect(new Campaign(c.snapshot).teamLimit).toBe(2);
    session.execute(QUEST_SOLUTIONS['q19-deckung'], true); expect(session.snapshot.outcome).toBe('victory');
    expect(c.teamLimit).toBe(2); c.finishMission('q19-deckung'); c.leaveMission(); expect(c.teamLimit).toBe(3);
    expect(new Campaign(c.snapshot).teamLimit).toBe(3);
    expect(c.snapshot.owned.find((unit) => unit.speciesId === 'felsbock')!.learned).toContain('coverAlly');
    expect(c.snapshot.owned.find((unit) => unit.speciesId === 'glutling')!.learned).not.toContain('coverAlly');
    c.apply('travel-forest'); win(c, 'q20-dreiklang');
    const loaded = new Campaign(c.snapshot); expect(loaded.activeTeam.map((unit) => unit.speciesId)).toEqual(['glutling', 'moosling', 'felsbock']);
    expect(new Set(loaded.snapshot.completed)).toEqual(new Set(c.snapshot.completed));
    loaded.apply('travel-valley'); expect(loaded.availableEncounters).toEqual([]);
    const before = loaded.snapshot; expect(loaded.beginTraining(3, ['felsbock', 'glutling', 'moosling'])).toMatchObject({ kind: 'training', team: ['felsbock', 'glutling', 'moosling'] });
    loaded.leaveMission(); expect(loaded.snapshot).toEqual(before);
  });
  it('lehrt artspezifische Rollen schrittweise und erlaubt den aktiven Teamkampf erst nach den Einführungen', () => {
    const c = forest(); c.apply('travel-valley'); c.visitGiver('brann'); win(c, 'q14-feuerprobe');
    expect(c.snapshot.owned[0].learned).toContain('ignite'); expect(c.snapshot.owned[0].learned).not.toContain('healingMoss');
    c.apply('travel-forest'); win(c, 'q05-aufmerksam'); c.apply('recruit-moosling'); c.visitGiver('tala');
    const moosling = () => c.snapshot.owned.find((unit) => unit.speciesId === 'moosling')!;
    expect(moosling().learned).not.toContain('ignite'); expect(moosling().learned).not.toContain('barkGuard');
    win(c, 'q07-moosling'); expect(c.prepareMission('q17-teamrollen')).toContain('Voraussetzung');
    win(c, 'q16-heilmoos'); expect(moosling().learned).toContain('healingMoss'); expect(moosling().learned).not.toContain('barkGuard');
    win(c, 'q15-wurzelschutz'); win(c, 'q08-team'); win(c, 'q17-teamrollen');
    expect(c.activeTeam.map((unit) => unit.speciesId)).toEqual(['glutling', 'moosling']);
    expect(c.snapshot.owned.find((unit) => unit.speciesId === 'glutling')!.learned).not.toContain('barkGuard');
    expect(moosling().learned).not.toContain('enemyBurning'); expect(moosling().learned).toContain('allyInjured');
    const loaded = new Campaign(c.snapshot).snapshot;
    expect(loaded.owned).toEqual(c.snapshot.owned); expect(loaded.team).toEqual(c.snapshot.team);
    expect(new Set(loaded.completed)).toEqual(new Set(c.snapshot.completed));
  });
  it('ergänzt fehlende Grundbewegungen bei beiden Arkana in bestehenden Spielständen', () => {
    const campaign = new Campaign({ version: 2, introduced: true, owned: [
      { speciesId: 'glutling', learned: ['moveRight', 'moveUp', 'attack'] }, { speciesId: 'moosling', learned: ['moveRight'] },
    ] });
    for (const owned of campaign.snapshot.owned) {
      expect(owned.learned).toEqual(expect.arrayContaining([...BASIC_MOVEMENT])); expect(owned.learned).not.toContain('repeat');
    }
    expect(campaign.snapshot.owned[0].learned).toContain('attack');
    expect(new Campaign(campaign.snapshot).snapshot).toEqual(campaign.snapshot); expect(campaign.snapshot.completed).toEqual([]);
  });
  it('beginnt im Tal ohne Arkana und führt Bewegung vor Angriff ein', () => {
    const c = new Campaign(); expect(c.region).toBe('valley'); expect(c.snapshot.owned).toEqual([]); expect(c.forestUnlocked).toBe(false);
    expect(c.availableEncounters.map((e) => e.id)).toEqual(['glutling']); expect(c.interact('giver:eldren').action).toBe('meet-eldren');
    expect(c.apply('recruit-glutling')).toContain('Eldren'); c.apply('meet-eldren'); c.apply('recruit-glutling'); c.apply('recruit-glutling'); expect(c.snapshot.owned).toHaveLength(1);
    expect(c.snapshot.owned[0].learned).toEqual(['moveForward', 'moveBackward', 'turnLeft', 'turnRight']); expect(c.prepareMission('q03-wiederkehr')).toContain('Voraussetzung');
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
    c.toggleTeam(instanceId('glutling')); expect(c.availableEncounters).toEqual([]); expect(new Campaign(c.snapshot).availableEncounters).toEqual([]); c.apply('travel-valley'); expect(c.availableEncounters.map((encounter) => encounter.id)).toEqual(['felsbock']);
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
