// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Campaign } from '../gameplay/Campaign';
import { instanceId } from '../gameplay/ArkanaCatalog';
import { LESSON_IDS, type LessonId } from '../gameplay/WorldQuests';
import { renderQuestBoard } from './QuestBoardView';

const early: LessonId[] = ['q01-glutspur', 'q02-basisangriff', 'q11-schleifenwache', 'q12-steinrutsch', 'q05-aufmerksam', 'q07-moosling'];
const saved = (completed: readonly LessonId[] = early) => new Campaign({ version: 2, worldVersion: 1, region: 'forest', introduced: true, completed, discovered: LESSON_IDS,
  owned: [{ speciesId: 'glutling' }, { speciesId: 'moosling' }, { speciesId: 'felsbock' }], team: [instanceId('glutling')] });
let content: HTMLDivElement;
beforeEach(() => { document.body.replaceChildren(); content = document.createElement('div'); document.body.append(content); });

describe('Sichtbare Questreihen beim Questgeber', () => {
  it('zeigt Tala als Einstieg, drei parallele Übungen und Rollenkampf mit aktuellem Fortschritt', () => {
    const campaign = saved(); const before = campaign.snapshot; const choose = vi.fn(); renderQuestBoard(content, campaign, choose, 'tala');
    const meter = content.querySelector('progress')!; expect(meter.value).toBe(1); expect(meter.max).toBe(6);
    const stages = content.querySelectorAll<HTMLDetailsElement>('[data-series="moosling-team"] .quest-stage');
    expect(stages[0].open).toBe(false); expect(stages[1].open).toBe(true); expect(stages[2].open).toBe(false);
    expect(Array.from(stages[1].querySelectorAll<HTMLElement>('[data-quest]')).map((card) => card.dataset.quest)).toEqual(['q08-team', 'q15-wurzelschutz', 'q16-heilmoos']);
    expect(stages[1].textContent).toContain('beliebiger Reihenfolge'); expect(content.querySelectorAll('.quest-ready')).toHaveLength(3);
    expect(content.querySelector('.quest-next')?.getAttribute('data-quest')).toBe('q08-team');
    (content.querySelector('.quest-next-summary button') as HTMLButtonElement).click(); expect((document.activeElement as HTMLElement).dataset.quest).toBe('q08-team');
    expect(choose).not.toHaveBeenCalled(); expect(campaign.snapshot).toEqual(before);
  });
  it('zeigt bei fehlenden externen Aufgaben Namen und Questgeber und führt nur zur passenden Übersicht', () => {
    const inspect = vi.fn(); const choose = vi.fn(); renderQuestBoard(content, saved([...early, 'q08-team', 'q15-wurzelschutz', 'q16-heilmoos']), choose, 'tala', inspect);
    const card = content.querySelector('[data-quest="q17-teamrollen"]')!;
    expect(card.querySelector<HTMLDetailsElement>('.quest-requirements')?.open).toBe(true);
    expect(card.querySelector('.quest-requirements summary')?.textContent).toContain('3/4 erfüllt');
    const fire = Array.from(card.querySelectorAll<HTMLButtonElement>('.quest-reference')).find((button) => button.textContent?.includes('Feuerprobe'))!;
    expect(fire.textContent).toContain('Wächter Brann'); expect(fire.textContent).toContain('Tal von Aetheria'); fire.click();
    expect(inspect).toHaveBeenCalledWith('q14-feuerprobe'); expect(choose).not.toHaveBeenCalled();
    expect(content.querySelector('.quest-next')).toBeNull();
  });
  it('zeigt abgeschlossene Reihen kompakt und benennt auch Team-Wiederholungen eindeutig', () => {
    const choose = vi.fn(); renderQuestBoard(content, saved(LESSON_IDS), choose, 'tala');
    expect(content.querySelector('progress')?.value).toBe(6); expect(content.querySelector('.quest-all-complete')?.textContent).toContain('Alle Aufgaben');
    expect(content.querySelector('.quest-next-summary')).toBeNull(); expect(content.querySelectorAll('.quest-complete')).toHaveLength(6);
    expect(Array.from(content.querySelectorAll<HTMLDetailsElement>('.quest-stage')).every((stage) => !stage.open)).toBe(true);
    const replay = content.querySelector<HTMLButtonElement>('#journal-quest-q08-team')!;
    expect(replay.textContent).toBe('Erneut spielen'); replay.click(); expect(choose).toHaveBeenCalledWith('prepare-lesson:q08-team');
  });
  it('kennzeichnet alternative Voraussetzungen als ODER und macht daraus keine drei Pflichtaufgaben', () => {
    const campaign = new Campaign({ ...saved(['q01-glutspur', 'q02-basisangriff', 'q11-schleifenwache']).snapshot, region: 'valley' });
    renderQuestBoard(content, campaign, vi.fn(), 'mira');
    const card = content.querySelector('[data-quest="q12-steinrutsch"]')!;
    expect(card.classList.contains('quest-ready')).toBe(true); expect(card.querySelector('.quest-requirements summary')?.textContent).toContain('2/2 erfüllt');
    expect(card.querySelector('.quest-requirements')?.textContent).toContain('Eine dieser Aufgaben genügt');
  });
});
