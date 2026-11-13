// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compileActionPlan, nodesToSource } from '../combat/DecisionProgram';
import type { ArkanId, ProgramNode } from '../combat/types';
import { GameUi } from './GameUi';
import { gameEvents } from '../game/events';
import { BattleSession, missionPrograms } from '../combat/BattleSession';
import { getLesson, lessonActors, lessonPrograms, LESSON_IDS, WORLD_QUESTS } from '../gameplay/WorldQuests';
import { LessonSession } from '../combat/LessonSession';
import { Campaign } from '../gameplay/Campaign';
import { instanceId } from '../gameplay/ArkanaCatalog';
import { Playback } from '../combat/Playback';

const listeners = vi.hoisted(() => new Map<string, ((...args: unknown[]) => void)[]>());
const snaps = vi.hoisted(() => [] as unknown[]);
vi.mock('../game/events', () => ({ gameEvents: {
  on: (name: string, callback: (...args: unknown[]) => void) => listeners.set(name, [...(listeners.get(name) ?? []), callback]),
  emit: (name: string, ...args: unknown[]) => listeners.get(name)?.forEach((callback) => callback(...args)),
} }));
vi.mock('./SnapEditor', () => ({ SnapEditor: class {
  nodes: ProgramNode[] = [];
  actor: ArkanId = 'moosling';
  loose = false;
  readOnly = false;
  highlightedPath?: string;
  constructor(_host: HTMLElement, private changed: () => void) { snaps.push(this); }
  load(nodes: ProgramNode[], actor: ArkanId, _mission: number, saved?: string) {
    const state = saved ? JSON.parse(saved) as { nodes: ProgramNode[]; loose: boolean } : { nodes, loose: false };
    this.nodes = state.nodes; this.loose = state.loose; this.actor = actor;
  }
  source() { return nodesToSource(this.nodes, this.actor); }
  save() { return JSON.stringify({ nodes: this.nodes, loose: this.loose }); }
  hasLooseBlocks() { return this.loose; }
  resizes = 0;
  resize() { this.resizes++; }
  setReadOnly(readOnly: boolean) { this.readOnly = readOnly; }
  highlight(path?: string) { this.highlightedPath = path; }
  mutate(nodes: ProgramNode[], loose = false) { this.nodes = nodes; this.loose = loose; this.changed(); }
} }));

const click = (id: string) => document.getElementById(id)!.click();
const text = () => document.getElementById('program-source') as HTMLTextAreaElement;
const type = (value: string) => { text().value = value; text().dispatchEvent(new Event('input')); };
const editor = () => snaps[snaps.length - 1] as { mutate: (nodes: ProgramNode[], loose?: boolean) => void };
const button = (id: string) => document.getElementById(id) as HTMLButtonElement;
beforeEach(() => {
  listeners.clear(); snaps.length = 0; localStorage.clear();
  document.body.innerHTML = readFileSync('index.html', 'utf8'); new GameUi();
});
afterEach(() => vi.useRealTimers());

describe('Platz für das Programm bei allen Aufgaben', () => {
  const details = (id: string) => document.getElementById(id) as HTMLDetailsElement;
  const openLesson = (index: number) => {
    const lesson = WORLD_QUESTS[index];
    gameEvents.emit('battle-opened', lessonPrograms(lesson), lesson.id, Object.fromEntries(lessonActors(lesson).map((actor) => [actor, lesson.allowed])), {
      title: lesson.title, mode: 'lesson', instructions: lesson.introduction, objective: lesson.objective, hints: lesson.hints,
    });
    return lesson;
  };
  for (const [index, lesson] of WORLD_QUESTS.entries()) it(`${lesson.id}: zeigt Ziele zuerst und minimiert sie nur einmal beim tatsächlichen Start`, () => {
    openLesson(index);
    const goals = details('encounter-goals'); const tips = details('lesson-hints');
    expect(goals.open).toBe(true); expect(tips.open).toBe(false);
    expect(document.getElementById('encounter-objective')!.textContent).toBe(lesson.objective);
    // Editing, validation errors and state updates must not prematurely hide the task.
    click('text-mode'); type('glutling.'); click('battle-step');
    expect(goals.open).toBe(true);
    gameEvents.emit('battle-playback', 'running'); expect(goals.open).toBe(false);
    goals.open = true; tips.open = true;
    gameEvents.emit('battle-playback', 'paused'); gameEvents.emit('battle-playback', 'running');
    gameEvents.emit('battle-playback', 'idle'); gameEvents.emit('battle-playback', 'running');
    expect(goals.open).toBe(true); expect(tips.open).toBe(true);
    gameEvents.emit('battle-playback', 'idle'); click('battle-restart');
    expect(goals.open).toBe(true);
    gameEvents.emit('battle-closed'); openLesson(index);
    expect(goals.open).toBe(true); expect(tips.open).toBe(false);
  });
  it('hält Tipps getrennt, bewahrt den gelesenen Tipp beim Zuklappen und beginnt die nächste Quest frisch', () => {
    const lesson = openLesson(0); const tips = details('lesson-hints');
    tips.open = true; tips.dispatchEvent(new Event('toggle'));
    expect(document.getElementById('lesson-hint')!.textContent).toBe(lesson.hints[0]);
    click('lesson-hint-button'); expect(document.getElementById('lesson-hint')!.textContent).toBe(lesson.hints[1]);
    tips.open = false; tips.dispatchEvent(new Event('toggle')); tips.open = true; tips.dispatchEvent(new Event('toggle'));
    expect(document.getElementById('lesson-hint')!.textContent).toBe(lesson.hints[1]);
    expect(details('encounter-goals').open).toBe(true);
    openLesson(1); expect(tips.open).toBe(false); expect(document.getElementById('lesson-hint')!.hidden).toBe(true);
    tips.open = true; tips.dispatchEvent(new Event('toggle'));
    expect(document.getElementById('lesson-hint')!.textContent).toBe(WORLD_QUESTS[1].hints[0]);
    for (let index = 1; index < WORLD_QUESTS[1].hints.length; index++) click('lesson-hint-button');
    expect(button('lesson-hint-button').disabled).toBe(true);
    expect(document.getElementById('lesson-hint-count')!.textContent).toBe(`(${WORLD_QUESTS[1].hints.length}/${WORLD_QUESTS[1].hints.length})`);
  });
  it('minimiert per Button ohne Ausführung, fokussiert den Editor und erhält beide Darstellungen', () => {
    openLesson(0); click('text-mode'); type('glutling.moveRight();');
    let executions = 0; gameEvents.on('battle-run-program', () => { executions++; });
    click('briefing-ready');
    expect(details('encounter-goals').open).toBe(false); expect(document.activeElement).toBe(text());
    expect(text().value).toBe('glutling.moveRight();'); expect(executions).toBe(0);
    click('blocks-mode'); details('encounter-goals').open = true; click('briefing-ready');
    expect(document.activeElement?.id).toBe('program-area-title');
    click('text-mode'); expect(text().value).toBe('glutling.moveRight();');
  });
  it('vergrößert die Arbeitsfläche ohne Entwurfsverlust und zeigt die Arena beim Abspielen wieder', () => {
    openLesson(0); click('text-mode'); type('glutling.');
    const panel = document.getElementById('battle-panel')!;
    click('editor-expand'); expect(panel.classList.contains('editor-expanded')).toBe(true);
    expect(button('editor-expand').getAttribute('aria-pressed')).toBe('true');
    expect(text().value).toBe('glutling.');
    click('editor-expand'); expect(panel.classList.contains('editor-expanded')).toBe(false);
    click('editor-expand'); gameEvents.emit('battle-playback', 'running');
    expect(panel.classList.contains('editor-expanded')).toBe(false);
    expect(button('editor-expand').getAttribute('aria-pressed')).toBe('false'); expect(text().value).toBe('glutling.');
  });
  it('passt Blockly bei aufgeklappten Bereichen an und behandelt freies Training ebenso', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1);
    expect(details('encounter-goals').open).toBe(true); expect(details('lesson-hints').hidden).toBe(true);
    const snap = snaps.at(-1) as { resizes: number }; const before = snap.resizes;
    details('editor-help').open = true; details('editor-help').dispatchEvent(new Event('toggle'));
    expect(snap.resizes).toBeGreaterThan(before);
    gameEvents.emit('battle-playback', 'running');
    expect(details('editor-help').open).toBe(false); expect(details('encounter-goals').open).toBe(false);
    details('editor-help').open = true;
    gameEvents.emit('battle-playback', 'idle'); gameEvents.emit('battle-playback', 'running');
    expect(details('editor-help').open).toBe(true);
  });
});

describe('Editorzustand und Arkan-Zuordnung', () => {
  it('führt Q07 mit Moosling allein und Q08 mit zwei getrennten Entwürfen und sichtbarem Abschluss aus', () => {
    vi.useFakeTimers(); const solo = getLesson('q07-moosling'); const duo = getLesson('q08-team');
    gameEvents.emit('battle-opened', lessonPrograms(solo), solo.id, { moosling: solo.allowed }, { title: solo.title, mode: 'lesson', instructions: solo.introduction, objective: solo.objective, hints: solo.hints });
    expect(button('select-glutling').hidden).toBe(true); expect(button('select-moosling').hidden).toBe(false);
    expect(document.getElementById('program-owner')!.textContent).toContain('Moosling');
    click('text-mode'); type('moosling.'); gameEvents.emit('battle-closed');
    const campaign = new Campaign({ version: 2, introduced: true, completed: LESSON_IDS.slice(0, 7), owned: [{ speciesId: 'moosling' }, { speciesId: 'glutling' }], team: [instanceId('moosling')] });
    campaign.interact('arkanist-eldren'); const encounter = campaign.prepareMission(duo.id);
    if (typeof encounter === 'string') throw new Error(encounter);
    const programs = { moosling: 'repeat(2, () => { moosling.moveRight(); }); repeat(2, () => { moosling.attack(); });', glutling: 'repeat(3, () => { glutling.moveRight(); }); repeat(2, () => { glutling.attack(); });' };
    gameEvents.emit('battle-opened', lessonPrograms(duo), duo.id, encounter.skills, { title: duo.title, mode: 'lesson', instructions: duo.introduction, objective: duo.objective, hints: duo.hints });
    click('text-mode'); type(programs.moosling); click('select-glutling'); type(programs.glutling); click('blocks-mode'); click('select-moosling'); click('text-mode');
    expect(compileActionPlan(text().value, 'moosling').nodes).toEqual(compileActionPlan(programs.moosling, 'moosling').nodes); expect(button('select-glutling').hidden).toBe(false);
    const session = new LessonSession(duo, encounter.skills); session.execute(programs, true);
    const playback = new Playback<typeof session.frames[number]>((frame) => { gameEvents.emit('battle-frame', frame); gameEvents.emit('battle-updated', frame.after, 'Teamaktion'); }, (state) => gameEvents.emit('battle-playback', state));
    playback.play(session.frames, () => gameEvents.emit('quest-completed', campaign.finishMission(duo.id)));
    expect(document.getElementById('program-owner')!.textContent).toContain('Moosling'); vi.advanceTimersByTime(850);
    expect(document.getElementById('program-owner')!.textContent).toContain('Glutling');
    vi.advanceTimersByTime((session.frames.length - 2) * 850);
    expect(document.getElementById('quest-completion')!.hidden).toBe(true);
    vi.advanceTimersByTime(850); expect(document.getElementById('quest-completion')!.hidden).toBe(false);
    expect(document.getElementById('quest-completion-text')!.textContent).toBe(duo.reward);
    gameEvents.emit('battle-closed'); gameEvents.emit('battle-opened', lessonPrograms(solo), solo.id, { moosling: solo.allowed });
    expect(text().value).toBe('moosling.'); expect(button('select-glutling').hidden).toBe(true);
  });
  it('spielt Q06 mit getrennten Wächteraktionen ab und bestätigt erst den sichtbaren zweiten Sieg', () => {
    vi.useFakeTimers(); const lesson = getLesson('q06-waechter');
    const campaign = new Campaign({ version: 2, introduced: true, completed: LESSON_IDS.slice(0, 5), owned: [{ speciesId: 'glutling' }], team: [instanceId('glutling')] });
    campaign.interact(`lesson:${lesson.id}`); campaign.beginMission(lesson.id);
    gameEvents.emit('battle-opened', { glutling: lesson.starter }, lesson.id, { glutling: lesson.allowed }, { title: lesson.title, mode: 'lesson', instructions: lesson.introduction, objective: lesson.objective, hints: lesson.hints });
    const source = 'repeat(5, () => { if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); } });';
    click('text-mode'); type(source); click('blocks-mode');
    const session = new LessonSession(lesson, lesson.allowed); session.execute({ glutling: source }, true);
    const playback = new Playback<typeof session.frames[number]>((frame) => { gameEvents.emit('battle-frame', frame); gameEvents.emit('battle-updated', frame.after, 'Wächterprüfung'); }, (state) => gameEvents.emit('battle-playback', state));
    playback.play(session.frames, () => gameEvents.emit('quest-completed', campaign.finishMission(lesson.id)));
    expect(document.getElementById('encounter-goals')!.hasAttribute('open')).toBe(false);
    expect((snaps.at(-1) as { highlightedPath?: string }).highlightedPath).toBe('0.body.0.otherwise.0');
    expect(document.getElementById('execution-trace')!.textContent).toContain('Durchlauf 1 von 5');
    vi.advanceTimersByTime(850);
    expect(document.getElementById('execution-trace')!.textContent).toContain('Konstrukt');
    expect((snaps.at(-1) as { highlightedPath?: string }).highlightedPath).toBeUndefined();
    vi.advanceTimersByTime(5 * 850);
    expect(document.getElementById('lesson-trial-summary')!.textContent).toContain('1/2 geschafft');
    expect(document.getElementById('quest-completion')!.hidden).toBe(true);
    vi.advanceTimersByTime(850);
    expect(document.getElementById('lesson-trial-summary')!.textContent).toContain('Situation 2/2');
    vi.advanceTimersByTime(8 * 850);
    expect(document.getElementById('quest-completion')!.hidden).toBe(true); expect(campaign.snapshot.completed).not.toContain(lesson.id);
    vi.advanceTimersByTime(850);
    expect(document.getElementById('quest-completion')!.hidden).toBe(false); expect(campaign.snapshot.completed).toContain(lesson.id);
    expect(document.querySelector('#quest-completion-text strong[data-term="condition"]')?.textContent).toBe('Bedingung');
  });
  it('zeigt Q05 mit beiden Situationen, passender Palette und Abschluss erst nach der zweiten Animation', () => {
    vi.useFakeTimers(); const lesson = getLesson('q05-aufmerksam');
    const campaign = new Campaign({ version: 2, introduced: true, completed: LESSON_IDS.slice(0, 4), owned: [{ speciesId: 'glutling' }], team: [instanceId('glutling')] });
    campaign.interact(`lesson:${lesson.id}`); campaign.beginMission(lesson.id);
    gameEvents.emit('battle-opened', { glutling: lesson.starter }, lesson.id, { glutling: lesson.allowed }, { title: lesson.title, mode: 'lesson', instructions: lesson.introduction, objective: lesson.objective, hints: lesson.hints });
    expect(document.getElementById('category-senses')).not.toBeNull(); expect(document.getElementById('category-flow')).toBeNull();
    expect(document.querySelector('#encounter-instructions strong[data-term="condition"]')?.textContent).toBe('Bedingung');
    const session = new LessonSession(lesson, lesson.allowed); gameEvents.emit('battle-updated', session.snapshot, lesson.objective);
    expect(document.getElementById('lesson-trial')!.textContent).toContain('Situation 1/2');
    const source = 'if (glutling.enemyAdjacent) {\n  glutling.attack();\n} else {\n  glutling.moveForward();\n}';
    click('text-mode'); type(source); click('blocks-mode'); click('text-mode'); expect(text().value).toBe(source);
    session.execute({ glutling: source }, true);
    const playback = new Playback<typeof session.frames[number]>((frame) => { gameEvents.emit('battle-frame', frame); gameEvents.emit('battle-updated', frame.after, 'Entscheidung'); }, (state) => gameEvents.emit('battle-playback', state));
    playback.play(session.frames, () => gameEvents.emit('quest-completed', campaign.finishMission(lesson.id)));
    expect(document.getElementById('execution-trace')!.textContent).toContain('Gegner direkt daneben: ja');
    vi.advanceTimersByTime(850);
    expect(document.getElementById('lesson-trial')!.textContent).toContain('Situation 2/2');
    expect(document.getElementById('execution-trace')!.textContent).toContain('Gegner direkt daneben: nein');
    expect(document.getElementById('quest-completion')!.hidden).toBe(true); expect(campaign.snapshot.completed).not.toContain(lesson.id);
    vi.advanceTimersByTime(850); expect(document.getElementById('quest-completion')!.hidden).toBe(false); expect(campaign.snapshot.completed).toContain(lesson.id);
    gameEvents.emit('battle-closed');
    gameEvents.emit('battle-opened', { glutling: getLesson('q01-glutspur').starter }, 'q01-glutspur', { glutling: getLesson('q01-glutspur').allowed });
    expect(document.getElementById('lesson-trial')!.hidden).toBe(true);
  });
  for (const [index, lesson] of WORLD_QUESTS.entries()) it(`${lesson.id}: zeigt den bestätigten Abschluss in der Arena und kehrt ohne Welt-Abschlussdialog zurück`, () => {
    const campaign = new Campaign({ version: 2, introduced: true, completed: LESSON_IDS.slice(0, index), owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }], team: [] });
    campaign.interact(`lesson:${lesson.id}`); campaign.prepareMission(lesson.id);
    const presentation = { title: lesson.title, mode: 'lesson', instructions: lesson.introduction, objective: lesson.objective, hints: lesson.hints };
    gameEvents.emit('battle-opened', lessonPrograms(lesson), lesson.id, Object.fromEntries(lessonActors(lesson).map((actor) => [actor, lesson.allowed])), presentation);
    gameEvents.emit('quest-completed', campaign.finishMission(lesson.id));
    const dialog = document.getElementById('quest-completion')!;
    expect(dialog.hidden).toBe(false); expect(dialog.closest('#battle-panel')).not.toBeNull();
    expect(document.getElementById('quest-completion-heading')!.textContent).toBe('Quest abgeschlossen!');
    expect(document.getElementById('quest-completion-text')!.textContent).toBe(lesson.reward);
    expect(document.getElementById('quest-completion-next')!.textContent).toBe(campaign.objective);
    expect(document.getElementById('dialog')!.hidden).toBe(true);
    expect(document.activeElement?.id).toBe('quest-completion-exit'); expect(document.getElementById('battle-card')!.inert).toBe(true);
    let exits = 0; gameEvents.on('battle-exit', () => { exits++; gameEvents.emit('battle-closed'); });
    click('quest-completion-exit'); expect(exits).toBe(1); expect(document.getElementById('battle-panel')!.hidden).toBe(true);
    expect(dialog.hidden).toBe(true); expect(document.getElementById('game')!.inert).toBe(false);
    expect(document.getElementById('dialog')!.hidden).toBe(true);
  });
  it('wartet bis nach der letzten Animation und zeigt bei Abbruch keinen Questabschluss', () => {
    vi.useFakeTimers();
    const lesson = getLesson('q04-musterpfad');
    const campaign = new Campaign({ version: 2, introduced: true, completed: LESSON_IDS.slice(0, 3), owned: [{ speciesId: 'glutling' }], team: [instanceId('glutling')] });
    campaign.interact(`lesson:${lesson.id}`); campaign.beginMission(lesson.id);
    const presentation = { title: lesson.title, mode: 'lesson', instructions: lesson.introduction, objective: lesson.objective, hints: lesson.hints };
    gameEvents.emit('battle-opened', { glutling: lesson.starter }, lesson.id, { glutling: lesson.allowed }, presentation);
    const session = new LessonSession(lesson, lesson.allowed);
    session.execute({ glutling: 'repeat(3, () => { glutling.moveRight(); glutling.moveUp(); });' }, true);
    const playback = new Playback<typeof session.frames[number]>((frame) => gameEvents.emit('battle-updated', frame.after, 'Bewegung'), (state) => gameEvents.emit('battle-playback', state));
    const completed = () => { gameEvents.emit('quest-completed', campaign.finishMission(lesson.id)); };
    playback.play(session.frames, completed); vi.advanceTimersByTime(5 * 850);
    // Even the last displayed frame carries victory before its animation finishes.
    expect(document.getElementById('quest-completion')!.hidden).toBe(true);
    expect(campaign.snapshot.completed).not.toContain(lesson.id);
    playback.stop(); vi.runAllTimers(); expect(document.getElementById('quest-completion')!.hidden).toBe(true);
    playback.play(session.frames, completed); vi.advanceTimersByTime(6 * 850);
    expect(document.getElementById('quest-completion')!.hidden).toBe(false);
    expect(campaign.snapshot.completed).toContain(lesson.id);
    expect(document.querySelector('#quest-completion-text strong[data-term="loop-body"]')?.textContent).toBe('Schleifenrumpf');
  });
  it('hält den Fokus im Abschluss, erlaubt die Programmprüfung und zeigt Wiederholungen erneut', () => {
    const lesson = getLesson('q01-glutspur');
    const presentation = { title: lesson.title, mode: 'lesson', instructions: lesson.introduction, objective: lesson.objective, hints: lesson.hints };
    const campaign = new Campaign({ version: 2, introduced: true, owned: [{ speciesId: 'glutling' }], team: [instanceId('glutling')] });
    campaign.interact(`lesson:${lesson.id}`); campaign.beginMission(lesson.id);
    gameEvents.emit('battle-opened', { glutling: lesson.starter }, lesson.id, { glutling: lesson.allowed }, presentation);
    button('battle-run-program').focus(); gameEvents.emit('quest-completed', campaign.finishMission(lesson.id));
    const tab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    button('quest-completion-exit').dispatchEvent(tab); expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('quest-completion-review');
    click('quest-completion-review'); expect(document.getElementById('quest-completion')!.hidden).toBe(true);
    expect(document.getElementById('quest-completion-status')!.hidden).toBe(false);
    expect(document.activeElement?.id).toBe('battle-run-program'); expect(document.getElementById('battle-card')!.inert).toBe(false);
    gameEvents.emit('quest-completed', campaign.finishMission(lesson.id));
    expect(document.getElementById('quest-completion-heading')!.textContent).toBe('Quest erneut geschafft!');
    button('quest-completion-exit').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.getElementById('quest-completion')!.hidden).toBe(true);
    const session = new LessonSession(lesson, lesson.allowed); gameEvents.emit('battle-updated', session.snapshot, 'Neu gestartet');
    expect(document.getElementById('quest-completion-status')!.hidden).toBe(true);
  });
  it('zeigt weder bei einer offenen Lernübung noch im freien Training einen Questabschluss', () => {
    const lesson = getLesson('q04-musterpfad');
    const presentation = { title: lesson.title, mode: 'lesson', instructions: lesson.introduction, objective: lesson.objective, hints: lesson.hints };
    gameEvents.emit('battle-opened', { glutling: lesson.starter }, lesson.id, { glutling: lesson.allowed }, presentation);
    const session = new LessonSession(lesson, lesson.allowed);
    const feedback = session.execute({ glutling: 'glutling.moveRight(); glutling.moveUp(); glutling.moveRight(); glutling.moveUp(); glutling.moveRight(); glutling.moveUp();' }, true);
    expect(session.snapshot.outcome).toBe('incomplete'); gameEvents.emit('battle-updated', session.snapshot, feedback);
    expect(document.getElementById('quest-completion')!.hidden).toBe(true);
    gameEvents.emit('battle-opened', missionPrograms(1), 1);
    gameEvents.emit('quest-completed', { lesson: lesson.id, title: lesson.title, text: lesson.reward, nextObjective: '', repeated: false });
    expect(document.getElementById('quest-completion')!.hidden).toBe(true);
  });
  it('zeigt Q04 mit Bewegung und Ablauf, erklärt den Rumpf und behält das Programm beim Moduswechsel', () => {
    const lesson = getLesson('q04-musterpfad');
    const presentation = { title: lesson.title, mode: 'lesson', instructions: lesson.introduction, objective: lesson.objective, hints: lesson.hints };
    gameEvents.emit('battle-opened', { glutling: lesson.starter }, lesson.id, { glutling: lesson.allowed }, presentation);
    expect(document.getElementById('category-combat')).toBeNull(); expect(document.getElementById('category-senses')).toBeNull();
    expect(document.getElementById('category-flow')).not.toBeNull();
    expect(document.querySelector('#encounter-instructions .learning-term[data-term="loop-body"]')?.textContent).toBe('Schleifenrumpf');
    click('text-mode'); expect(text().value).toBe(lesson.starter);
    const source = 'repeat(3, () => {\n  glutling.moveRight();\n  glutling.moveUp();\n});';
    type(source); click('blocks-mode'); click('text-mode'); expect(text().value).toBe(source);
    click('lesson-hint-button'); expect(document.getElementById('lesson-hint')!.textContent).toBe(lesson.hints[0]);
  });
  it('hebt Fachbegriffe im Questabschluss hervor und ersetzt sie sauber beim nächsten Dialog', () => {
    const reward = getLesson('q01-glutspur').reward;
    gameEvents.emit('dialog-opened', { speaker: 'QUEST ABGESCHLOSSEN', text: reward });
    const content = document.getElementById('dialog-text')!;
    expect(content.textContent).toBe(reward);
    expect(content.querySelector('strong.learning-term[data-term="sequence"]')?.textContent).toBe('Sequenz');
    gameEvents.emit('dialog-opened', { speaker: 'ELDREN', text: 'Willkommen zurück.' });
    expect(content.querySelector('strong')).toBeNull(); expect(content.textContent).toBe('Willkommen zurück.');
  });
  it('sendet vom gesperrten Questdialog die Aktion zum Auswählen und Starten statt nur zu schließen', () => {
    const campaign = new Campaign({ introduced: true, owned: [{ speciesId: 'glutling' }], team: [] });
    gameEvents.emit('dialog-opened', campaign.interact('lesson:q01-glutspur'));
    expect(document.getElementById('dialog-close')!.textContent).toBe('Glutling wählen & Quest starten');
    let action = ''; gameEvents.on('campaign-action', (value: string) => { action = value; });
    click('dialog-close'); expect(action).toBe('prepare-lesson:q01-glutspur');
    expect(document.getElementById('dialog')!.hidden).toBe(true);
  });
  it('zeigt in der ersten Lernquest nur Bewegung, einen unvollständigen Start und gestufte Hinweise', () => {
    const lesson = getLesson('q01-glutspur');
    const presentation = { title: lesson.title, mode: 'lesson', instructions: lesson.introduction, objective: lesson.objective, hints: lesson.hints };
    gameEvents.emit('battle-opened', { glutling: lesson.starter }, lesson.id, { glutling: lesson.allowed }, presentation);
    expect(document.getElementById('battle-title')!.textContent).toContain('LERNQUEST');
    expect(document.getElementById('category-combat')).toBeNull();
    expect(document.getElementById('category-flow')).toBeNull();
    expect(document.getElementById('category-senses')).toBeNull();
    expect(Array.from(document.querySelectorAll<HTMLElement>('[data-command]')).map((entry) => entry.dataset.command)).toEqual(['moveRight', 'moveUp']);
    click('text-mode'); expect(text().value).toBe('glutling.moveRight();');
    const session = new LessonSession(lesson, lesson.allowed);
    gameEvents.emit('battle-updated', session.snapshot, 'Bereit');
    expect(document.getElementById('enemy-health-status')!.hidden).toBe(true);
    expect(document.getElementById('battle-status')!.classList.contains('puzzle-status')).toBe(true);
    click('lesson-hint-button'); expect(document.getElementById('lesson-hint')!.textContent).toBe(lesson.hints[0]);
    click('lesson-hint-button'); expect(document.getElementById('lesson-hint')!.textContent).toBe(lesson.hints[1]);
  });

  it('hält neue Lernprogramme getrennt von alten Arena-Entwürfen desselben Arkanas', () => {
    gameEvents.emit('battle-opened', missionPrograms(1, ['glutling']), 1);
    click('text-mode'); type('glutling.attack();');
    const lesson = getLesson('q01-glutspur');
    gameEvents.emit('battle-opened', { glutling: lesson.starter }, lesson.id, { glutling: lesson.allowed });
    expect(text().value).toBe(lesson.starter); type('glutling.moveUp();');
    gameEvents.emit('battle-opened', missionPrograms(1, ['glutling']), 1); expect(text().value).toBe('glutling.attack();');
    gameEvents.emit('battle-opened', { glutling: lesson.starter }, lesson.id, { glutling: lesson.allowed });
    expect(text().value).toBe('glutling.moveUp();');
  });
  it('programmiert ein gewähltes Glutling-Soloteam mit dessen tatsächlich erlernten Befehlen', () => {
    const programs = missionPrograms(2, ['glutling']);
    gameEvents.emit('battle-opened', programs, 2, { glutling: ['moveForward', 'attack', 'repeat', 'enemyAdjacent'] });
    expect(document.getElementById('select-moosling')!.hidden).toBe(true);
    expect(document.getElementById('program-owner')!.textContent).toContain('Glutling');
    click('text-mode'); expect(text().value).toContain('glutling.enemyAdjacent');
    expect(document.getElementById('category-senses')).not.toBeNull();
    const session = new BattleSession(2, ['glutling']);
    gameEvents.emit('battle-updated', session.snapshot, 'Bereit');
    expect(document.getElementById('player-health-name')!.textContent).toBe('Glutling');
    expect(document.getElementById('player-health-text')!.textContent).toBe('4/4');
    expect(document.getElementById('companion-health-status')!.hidden).toBe(true);
    gameEvents.emit('battle-opened', programs, 2, {});
    click('text-mode'); expect(document.querySelectorAll('[data-command]')).toHaveLength(0);
  });

  it('führt Fund- und Questaktionen nur nach Annahme eines Dialogs aus', () => {
    let action = ''; gameEvents.on('campaign-action', (value: string) => { action = value; });
    const dialog = { speaker: 'MOOSLING', text: 'Ein Fund.', action: 'recruit-moosling', actionLabel: 'In Sammlung aufnehmen' };
    gameEvents.emit('dialog-opened', dialog);
    expect(document.getElementById('dialog-close')!.textContent).toBe('In Sammlung aufnehmen');
    click('dialog-dismiss'); expect(action).toBe('');
    gameEvents.emit('dialog-opened', dialog); click('dialog-close'); expect(action).toBe('recruit-moosling');
    expect(document.getElementById('dialog')!.hidden).toBe(true);
  });
  it('sperrt Änderungen während der Wiedergabe, erlaubt Pause und gibt den Editor nach Abbruch frei', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1); click('text-mode');
    const source = text().value;
    let pause = 0; let steps = 0; let speed = 0;
    gameEvents.on('battle-pause', () => { pause++; });
    gameEvents.on('battle-step', () => { steps++; });
    gameEvents.on('battle-speed', (value: number) => { speed = value; });
    gameEvents.emit('battle-playback', 'running');
    expect(text().readOnly).toBe(true);
    expect(button('battle-step').disabled).toBe(true);
    expect(button('battle-run-program').disabled).toBe(true);
    click('category-combat');
    const attack = document.querySelector('[data-command="attack"]') as HTMLButtonElement;
    expect(attack.disabled).toBe(true); attack.click(); expect(text().value).toBe(source);
    click('battle-pause'); expect(pause).toBe(1);
    gameEvents.emit('battle-playback', 'paused');
    expect(button('battle-pause').textContent).toBe('Fortsetzen');
    click('battle-step'); expect(steps).toBe(1);
    const tempo = document.getElementById('battle-speed') as HTMLSelectElement;
    tempo.value = '2'; tempo.dispatchEvent(new Event('change')); expect(speed).toBe(2);
    click('blocks-mode');
    expect((snaps.at(-1) as { readOnly: boolean }).readOnly).toBe(true);
    gameEvents.emit('battle-playback', 'idle');
    const session = new BattleSession(1);
    gameEvents.emit('battle-updated', session.snapshot, 'Arena zurückgesetzt.');
    gameEvents.emit('battle-trace-clear');
    expect(button('battle-step').disabled).toBe(false);
    expect(button('battle-pause').disabled).toBe(true);
    expect((snaps.at(-1) as { readOnly: boolean }).readOnly).toBe(false);
  });

  it('markiert die aktive Aktion in beiden Modi auch nach einer Neuformatierung', () => {
    const source = '\nrepeat(2, () => {\n\n  moosling.moveForward();\n});';
    gameEvents.emit('battle-opened', { moosling: source }, 1); click('text-mode'); type(source);
    const session = new BattleSession(1); session.execute({ moosling: source });
    gameEvents.emit('battle-playback', 'running');
    gameEvents.emit('battle-frame', session.frames[0]);
    expect(text().dataset.activeLine).toBe('4');
    expect(document.getElementById('execution-trace')!.textContent).toContain('Durchlauf 1 von 2');
    click('blocks-mode');
    expect((snaps.at(-1) as { highlightedPath?: string }).highlightedPath).toBe('0.body.0');
    click('text-mode'); expect(text().dataset.activeLine).toBe('2');
    expect(document.getElementById('active-code-line')!.textContent).toBe('Aktive Zeile: 2');
    gameEvents.emit('battle-playback', 'idle'); type('moosling.attack();');
    expect(text().dataset.activeLine).toBeUndefined();
    expect(document.getElementById('execution-trace')!.hidden).toBe(true);
  });

  it('wechselt beim Abspielen zum handelnden Arkan und zeigt für den Gegner keine falsche Codezeile', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    const session = new BattleSession(3); session.execute(missionPrograms(3));
    gameEvents.emit('battle-playback', 'running'); gameEvents.emit('battle-frame', session.frames[1]);
    expect(document.getElementById('program-owner')!.textContent).toContain('Glutling');
    click('text-mode'); expect(text().dataset.activeLine).toBe('2');
    gameEvents.emit('battle-frame', { ...session.frames[1], actor: 'konstrukt', trace: undefined });
    expect(text().dataset.activeLine).toBeUndefined();
    expect(document.getElementById('execution-trace')!.textContent).toContain('Konstrukt');
  });
  it('zeigt das ausgewählte Objekt eindeutig an und wechselt dessen Programm', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    expect(document.getElementById('program-owner')!.textContent).toBe('Du programmierst gerade: Moosling');
    expect(document.getElementById('select-moosling')!.getAttribute('aria-pressed')).toBe('true');
    click('select-glutling');
    expect(document.getElementById('program-owner')!.textContent).toBe('Du programmierst gerade: Glutling');
    expect(document.getElementById('select-glutling')!.getAttribute('aria-pressed')).toBe('true');
    expect(document.getElementById('select-moosling')!.getAttribute('aria-pressed')).toBe('false');
    click('text-mode');
    expect(text().value).toContain('glutling.moveForward()');
    expect(text().value).not.toContain('moosling');
  });
  it('behält eigene Programme, auch unvollständige Texte, beim Arkan-Wechsel und Neuladen', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3); click('text-mode');
    type('repeat(2, () => { moosling.attack(); });'); click('select-glutling');
    expect(text().value).toContain('glutling.moveForward'); type('glutling.');
    click('select-moosling'); expect(text().value).toContain('repeat(2');
    click('select-glutling'); expect(text().value).toBe('glutling.');
    listeners.clear(); new GameUi(); gameEvents.emit('battle-opened', missionPrograms(3), 3);
    click('select-glutling'); expect(text().value).toBe('glutling.');
  });
  it('überschreibt einen Textentwurf weder bei erneutem Textmodus-Klick noch bei fehlgeschlagener Konvertierung', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1); click('text-mode'); type('moosling.');
    click('text-mode'); click('blocks-mode'); expect(text().value).toBe('moosling.'); expect(text().hidden).toBe(false);
  });
  it('erhält verschachtelte Programme und leere Programme in beiden Modi', () => {
    gameEvents.emit('battle-opened', missionPrograms(1), 1); click('text-mode');
    type('repeat(2, () => { moosling.moveForward(); moosling.attack(); });');
    click('blocks-mode'); click('text-mode'); expect(text().value).toContain('moosling.attack();');
    click('blocks-mode'); editor().mutate([]); click('text-mode'); expect(text().value).toBe('');
    click('blocks-mode'); expect(document.getElementById('block-editor')!.hidden).toBe(false);
  });
  it('bewahrt lose Blockentwürfe und verhindert deren versehentlichen Verlust oder Ausführung', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3);
    editor().mutate([{ kind: 'action', action: 'ATTACK' }], true);
    click('text-mode'); expect(text().hidden).toBe(true);
    let ran = false; gameEvents.on('battle-run-program', () => { ran = true; }); click('battle-run-program'); expect(ran).toBe(false);
    click('select-glutling'); click('select-moosling'); click('text-mode'); expect(text().hidden).toBe(true);
    editor().mutate([{ kind: 'action', action: 'ATTACK' }]); click('text-mode'); expect(text().value).toBe('moosling.attack();');
  });
  it('sendet beim Ausführen beide Programme und hält Missionsentwürfe getrennt', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3); click('select-glutling'); click('text-mode'); type('glutling.attack();');
    let submitted: unknown; gameEvents.on('battle-run-program', (programs: unknown) => { submitted = programs; }); click('battle-run-program');
    expect(submitted).toMatchObject({ glutling: 'glutling.attack();' });
    gameEvents.emit('battle-opened', missionPrograms(1), 1); expect(document.getElementById('select-glutling')!.hidden).toBe(true);
    expect(text().value).not.toContain('glutling');
  });
  it('filtert im Textmodus Bibliothek und Kategorien und fügt eigene Arkan-Befehle ein', () => {
    gameEvents.emit('battle-opened', missionPrograms(3), 3); click('text-mode'); click('category-senses');
    expect(document.querySelector('[data-command="condition"] code')?.textContent).toBe('moosling.enemyAdjacent');
    click('select-glutling'); expect(document.getElementById('category-senses')).toBeNull();
    click('category-combat'); type(''); (document.querySelector('[data-command="attack"]') as HTMLButtonElement).click();
    expect(text().value).toContain('glutling.attack()');
  });
});
