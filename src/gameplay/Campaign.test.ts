import { afterEach, describe, expect, it, vi } from 'vitest';
import { Campaign, normalizeCampaign } from './Campaign';
import { ARKANA_SPECIES, instanceId } from './ArkanaCatalog';
import { LESSON_IDS, getLesson, lessonActors, type LessonId } from './WorldQuests';
import type { ProgramSources } from '../combat/types';
import { LessonSession } from '../combat/LessonSession';
import { BattleSession, missionPrograms } from '../combat/BattleSession';
import { Playback } from '../combat/Playback';

const solutions: Record<LessonId, string> = {
  'q01-glutspur': 'glutling.moveRight(); glutling.moveRight(); glutling.moveUp();',
  'q02-basisangriff': 'glutling.moveRight(); glutling.moveRight(); glutling.attack(); glutling.attack();',
  'q03-wiederkehr': 'repeat(4, () => { glutling.moveRight(); });',
  'q04-musterpfad': 'repeat(3, () => { glutling.moveRight(); glutling.moveUp(); });',
  'q05-aufmerksam': 'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); }',
  'q06-waechter': 'repeat(5, () => { if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); } });',
  'q07-moosling': 'repeat(2, () => { moosling.moveRight(); }); repeat(3, () => { moosling.attack(); });',
  'q08-team': '',
};
const programsFor = (id: LessonId): ProgramSources => id === 'q08-team' ? { moosling: 'repeat(2, () => { moosling.moveRight(); }); repeat(2, () => { moosling.attack(); });', glutling: 'repeat(3, () => { glutling.moveRight(); }); repeat(2, () => { glutling.attack(); });' } : { [lessonActors(getLesson(id))[0]]: solutions[id] };
function introduced(): Campaign {
  const campaign = new Campaign(); campaign.apply('meet-eldren'); campaign.apply('recruit-glutling'); return campaign;
}
function begin(campaign: Campaign, id: LessonId): LessonSession {
  campaign.interact(`lesson:${id}`); const encounter = campaign.prepareMission(id);
  if (typeof encounter === 'string') throw new Error(encounter);
  return new LessonSession(getLesson(id), encounter.skills);
}
function win(campaign: Campaign, id: LessonId): void {
  const session = begin(campaign, id); session.execute(programsFor(id), true);
  expect(session.snapshot.outcome).toBe('victory'); expect(campaign.completeMission(id)).toBeDefined(); campaign.leaveMission();
}
afterEach(() => vi.useRealTimers());

describe('Gestufte Lernquests und freie Trainingsarena', () => {
  it('verlangt Mooslings Aufnahme vor Q07 und öffnet den zweiten Teamplatz erst mit der Q08-Einführung', () => {
    const campaign = introduced(); for (const id of LESSON_IDS.slice(0, 6)) win(campaign, id);
    const owned = campaign.snapshot.owned;
    expect(campaign.objective).toContain('Moosling');
    const offer = campaign.interact('arkanist-eldren'); expect(offer.action).toBeUndefined(); expect(offer.actionLabel).toContain('Moosling suchen');
    expect(campaign.prepareMission('q07-moosling')).toContain('Finde zuerst Moosling');
    expect(campaign.snapshot.owned).toEqual(owned); expect(campaign.teamLimit).toBe(1);
    campaign.apply('recruit-moosling'); expect(campaign.availableEncounters).toEqual([]);
    expect(campaign.interact('arkanist-eldren').actionLabel).toBe('Moosling wählen & Quest starten');
    const encounter = campaign.prepareMission('q07-moosling');
    expect(encounter).toMatchObject({ kind: 'lesson', team: ['moosling'] }); expect(campaign.teamLimit).toBe(1);
    const session = new LessonSession(getLesson('q07-moosling'), getLesson('q07-moosling').allowed);
    session.execute(programsFor('q07-moosling'), true); expect(session.snapshot.outcome).toBe('victory');
    campaign.finishMission('q07-moosling'); campaign.leaveMission();
    expect(campaign.objective).toContain('Teamstein'); expect(campaign.teamLimit).toBe(1);
    expect(campaign.interact('arkanist-eldren').actionLabel).toBe('Team wählen & Quest starten'); expect(campaign.teamLimit).toBe(1);
    expect(campaign.snapshot.introductions).not.toContain('q08-team');
    const team = campaign.prepareMission('q08-team'); expect(team).toMatchObject({ team: ['moosling', 'glutling'] });
    expect(campaign.teamLimit).toBe(2); expect(campaign.activeTeam.map((item) => item.speciesId)).toEqual(['moosling', 'glutling']);
    expect(campaign.toggleTeam(instanceId('glutling'))).toContain('während');
    campaign.leaveMission();
    const loaded = new Campaign(JSON.parse(JSON.stringify(campaign.snapshot)));
    expect(loaded.teamLimit).toBe(2); expect(loaded.activeTeam.map((item) => item.speciesId)).toEqual(['moosling', 'glutling']);
    expect(loaded.snapshot.completed).not.toContain('q08-team'); win(loaded, 'q08-team');
    expect(loaded.snapshot.completed).toEqual([...LESSON_IDS]); expect(loaded.snapshot.owned).toHaveLength(2);
    loaded.interact('lesson:q01-glutspur'); loaded.prepareMission('q01-glutspur'); loaded.leaveMission();
    expect(loaded.teamLimit).toBe(2); expect(loaded.activeTeam.map((item) => item.speciesId)).toEqual(['glutling']);
    expect(loaded.toggleTeam(instanceId('moosling'))).toContain('aktualisiert'); expect(loaded.activeTeam).toHaveLength(2);
  });
  it('schaltet durch vorzeitige Dialoge und beschädigte Einführungen keinen zweiten Teamplatz frei', () => {
    const campaign = introduced(); expect(campaign.interact('lesson:q08-team').actionLabel).toBe('Zur Spielwelt'); const before = campaign.snapshot;
    expect(campaign.prepareMission('q08-team')).toContain('vorherige'); expect(campaign.snapshot).toEqual(before); expect(campaign.teamLimit).toBe(1);
    const loaded = new Campaign({ version: 2, introduced: true, completed: LESSON_IDS.slice(0, 6), introductions: ['q08-team'], owned: [{ speciesId: 'moosling' }, { speciesId: 'glutling' }], team: [instanceId('moosling'), instanceId('glutling')] });
    expect(loaded.teamLimit).toBe(1); expect(loaded.activeTeam).toHaveLength(1);
  });
  it('startet ohne Arkana, erlaubt zuerst nur Glutling und schaltet Mooslings Begegnung erst nach Q05 frei', () => {
    const campaign = new Campaign();
    expect(campaign.snapshot.owned).toEqual([]); expect(campaign.activeTeam).toEqual([]);
    expect(campaign.availableEncounters.map((encounter) => encounter.id)).toEqual(['glutling']);
    expect(campaign.interact('glutling').action).toBeUndefined(); expect(campaign.apply('recruit-glutling')).toContain('Eldren');
    campaign.apply('meet-eldren'); campaign.apply('recruit-glutling');
    for (const id of LESSON_IDS.slice(0, 5)) {
      expect(campaign.interact('moosling').action).toBeUndefined();
      expect(campaign.apply('recruit-moosling')).toContain('fünf Einführungsquests');
      expect(campaign.availableEncounters.map((encounter) => encounter.id)).not.toContain('moosling');
      win(campaign, id); expect(campaign.snapshot.owned.map((item) => item.speciesId)).toEqual(['glutling']);
    }
    expect(campaign.availableEncounters.map((encounter) => encounter.id)).toEqual(['moosling']);
    expect(campaign.objective).toContain('Wächterstein'); expect(campaign.interact('arkanist-eldren').action).toBe('lesson:q06-waechter');
    win(campaign, 'q06-waechter'); expect(campaign.objective).toContain('südöstlichen Hain');
    expect(campaign.interact('moosling').action).toBe('recruit-moosling');
    campaign.apply('recruit-moosling'); campaign.apply('recruit-moosling');
    expect(campaign.snapshot.owned.map((item) => item.speciesId)).toEqual(['glutling', 'moosling']);
    expect(campaign.snapshot.owned[1].learned).toContain('enemyAdjacent'); expect(campaign.availableEncounters).toEqual([]);
    const loaded = new Campaign(JSON.parse(JSON.stringify(campaign.snapshot))); expect(loaded.availableEncounters).toEqual([]);
    loaded.toggleTeam(instanceId('glutling')); expect(loaded.availableEncounters).toEqual([]);
  });
  it('öffnet Q05 erst nach dem Musterpfad und führt die neue Entscheidung ohne vorzeitige Questbelohnung ein', () => {
    const campaign = introduced();
    for (const id of LESSON_IDS.slice(0, 3)) win(campaign, id);
    campaign.interact('lesson:q05-aufmerksam'); expect(campaign.beginMission('q05-aufmerksam')).toContain('vorherige');
    expect(campaign.snapshot.owned[0].learned).not.toContain('enemyAdjacent');
    win(campaign, 'q04-musterpfad');
    expect(campaign.objective).toContain('Prüfstein'); expect(campaign.interact('arkanist-eldren').action).toBe('lesson:q05-aufmerksam');
    const session = begin(campaign, 'q05-aufmerksam');
    expect(campaign.snapshot.owned[0].learned).toEqual(expect.arrayContaining(['enemyAdjacent', 'moveForward']));
    session.execute({ glutling: solutions['q05-aufmerksam'] }); expect(session.snapshot.outcome).toBe('ongoing');
    expect(campaign.snapshot.completed).not.toContain('q05-aufmerksam');
    session.execute({ glutling: solutions['q05-aufmerksam'] }); expect(session.snapshot.outcome).toBe('victory');
    expect(campaign.finishMission('q05-aufmerksam')).toMatchObject({ repeated: false, title: 'Der aufmerksame Begleiter' });
    expect(campaign.snapshot.completed).toEqual([...LESSON_IDS.slice(0, 5)]); expect(campaign.teamLimit).toBe(1);
  });
  it('öffnet Q06 nach Q05 auch nach dem Laden und vergibt weder das Team noch Arkana automatisch', () => {
    const campaign = introduced();
    for (const id of LESSON_IDS.slice(0, 4)) win(campaign, id);
    campaign.interact('lesson:q06-waechter'); expect(campaign.prepareMission('q06-waechter')).toContain('vorherige');
    win(campaign, 'q05-aufmerksam');
    const loaded = new Campaign(JSON.parse(JSON.stringify(campaign.snapshot)));
    expect(loaded.snapshot.completed).toEqual([...LESSON_IDS.slice(0, 5)]);
    expect(loaded.interact('arkanist-eldren').action).toBe('lesson:q06-waechter');
    const session = begin(loaded, 'q06-waechter'); session.execute({ glutling: solutions['q06-waechter'] });
    expect(session.snapshot.outcome).toBe('ongoing'); expect(loaded.snapshot.completed).not.toContain('q06-waechter');
    loaded.leaveMission(); expect(loaded.snapshot.completed).not.toContain('q06-waechter');
    win(loaded, 'q06-waechter'); expect(loaded.snapshot.completed).toEqual([...LESSON_IDS.slice(0, 6)]);
    expect(loaded.teamLimit).toBe(1); expect(loaded.snapshot.owned.map((item) => item.speciesId)).toEqual(['glutling']);
    expect(loaded.availableEncounters.map((item) => item.id)).toEqual(['moosling']);
  });
  it('erstellt den Arenaabschluss mit nächstem Ziel und kennzeichnet Wiederholungen ohne doppelte Belohnung', () => {
    const campaign = introduced();
    expect(campaign.finishMission(LESSON_IDS[0])).toBeUndefined();
    begin(campaign, LESSON_IDS[0]);
    expect(campaign.finishMission(LESSON_IDS[1])).toBeUndefined();
    const completion = campaign.finishMission(LESSON_IDS[0]);
    expect(completion).toMatchObject({ lesson: LESSON_IDS[0], title: 'Glutlings erste Schritte', text: getLesson(LESSON_IDS[0]).reward, repeated: false });
    expect(completion?.nextObjective).toContain('Übungskonstrukt');
    const saved = campaign.snapshot;
    expect(campaign.finishMission(LESSON_IDS[0])).toMatchObject({ repeated: true });
    expect(campaign.snapshot).toEqual(saved);
    campaign.leaveMission(); expect(campaign.finishMission(LESSON_IDS[0])).toBeUndefined();
    campaign.beginTraining(1, ['glutling']); expect(campaign.finishMission(LESSON_IDS[0])).toBeUndefined();
  });
  it('bietet bei falscher Besetzung einen direkten Queststart an und wählt Glutling allein', () => {
    const campaign = new Campaign({ version: 1, introduced: true, owned: [{ speciesId: 'moosling' }, { speciesId: 'glutling' }], team: [instanceId('moosling'), instanceId('glutling')], completed: [1, 2] });
    const owned = campaign.snapshot.owned;
    const dialog = campaign.interact('lesson:q01-glutspur');
    expect(dialog.action).toBe('prepare-lesson:q01-glutspur');
    expect(dialog.actionLabel).toBe('Glutling wählen & Quest starten');
    expect(dialog.text).toContain('dein einziges aktives Arkana');
    const encounter = campaign.prepareMission(LESSON_IDS[0]);
    if (typeof encounter === 'string') throw new Error(encounter);
    expect(encounter).toMatchObject({ kind: 'lesson', lesson: LESSON_IDS[0], team: ['glutling'] });
    expect(campaign.activeTeam.map((item) => item.speciesId)).toEqual(['glutling']);
    expect(campaign.snapshot.owned).toEqual(owned);
    const session = new LessonSession(getLesson(LESSON_IDS[0]), encounter.skills.glutling ?? []);
    session.execute({ glutling: solutions[LESSON_IDS[0]] }, true); expect(session.snapshot.outcome).toBe('victory');
    expect(campaign.prepareMission(LESSON_IDS[0])).toContain('läuft bereits');
  });
  it('weist ohne Glutling auf den Fundort hin und verändert die vorhandene Sammlung nicht', () => {
    const campaign = new Campaign({ introduced: true, owned: [{ speciesId: 'moosling' }], team: [instanceId('moosling')] });
    const dialog = campaign.interact('lesson:q01-glutspur');
    expect(dialog.action).toBeUndefined(); expect(dialog.actionLabel).toContain('Glutling suchen');
    expect(dialog.text).toContain('westlichen Akademieweg');
    const before = campaign.snapshot;
    expect(campaign.prepareMission(LESSON_IDS[0])).toContain('Finde zuerst Glutling');
    expect(campaign.snapshot).toEqual(before);
  });
  it('umgeht beim vorbereiteten Start weder vorherige Quests noch die Einführung bei Eldren', () => {
    const campaign = introduced(); campaign.toggleTeam(instanceId('glutling'));
    campaign.interact('lesson:q03-wiederkehr'); const before = campaign.snapshot;
    expect(campaign.lessonOffer(LESSON_IDS[2]).action).toBeUndefined();
    expect(campaign.prepareMission(LESSON_IDS[2])).toContain('vorherige'); expect(campaign.snapshot).toEqual(before);
    const unintroduced = new Campaign({ owned: [{ speciesId: 'glutling' }] });
    unintroduced.interact('lesson:q01-glutspur');
    expect(unintroduced.prepareMission(LESSON_IDS[0])).toContain('Eldren');
    expect(unintroduced.activeTeam).toEqual([]);
  });
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
    expect(campaign.snapshot.completed).toEqual([...LESSON_IDS.slice(0, 3)]);
    campaign.apply('recruit-moosling'); expect(campaign.has('moosling')).toBe(false);
    expect(campaign.teamLimit).toBe(1);
  });
  it('führt nach Q03 zum Musterpfad und hält Mooslings späteren Fund noch gesperrt', () => {
    const campaign = introduced();
    campaign.interact('lesson:q04-musterpfad'); expect(campaign.lessonOffer('q04-musterpfad').action).toBeUndefined();
    expect(campaign.prepareMission('q04-musterpfad')).toContain('vorherige');
    for (const id of LESSON_IDS.slice(0, 3)) win(campaign, id);
    expect(campaign.objective).toContain('Musterstein am Nordweg');
    expect(campaign.interact('moosling').action).toBeUndefined();
    expect(campaign.interact('arkanist-eldren').speaker).toBe('DER MUSTERPFAD');
    expect(campaign.lessonOffer('q04-musterpfad').action).toBe('lesson:q04-musterpfad');
    const skills = campaign.snapshot.owned[0].learned;
    win(campaign, 'q04-musterpfad'); expect(campaign.snapshot.completed).toEqual([...LESSON_IDS.slice(0, 4)]);
    expect(campaign.snapshot.owned[0].learned).toEqual(skills); expect(campaign.teamLimit).toBe(1);
    begin(campaign, 'q04-musterpfad'); expect(campaign.completeMission('q04-musterpfad')).toBeUndefined();
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
