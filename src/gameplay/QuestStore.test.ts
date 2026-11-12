import { describe, expect, it } from 'vitest';
import { QuestStore } from './QuestStore';

describe('QuestStore', () => {
  it('schließt die Startquest beim Gespräch mit dem Arkanisten ab', () => {
    const store = new QuestStore({ id: 'm1', title: 'Sprich mit dem Arkanisten', objective: 'Sprich mit dem Arkanisten.', status: 'active' });

    expect(store.completeForInteraction('arkanist-eldren')).toBe(true);
    expect(store.current.status).toBe('complete');
    expect(store.current.objective).toContain('abgeschlossen');
  });

  it('ignoriert fremde oder wiederholte Interaktionen', () => {
    const store = new QuestStore({ id: 'm1', title: 'Sprich mit dem Arkanisten', objective: 'Sprich mit dem Arkanisten.', status: 'active' });

    expect(store.completeForInteraction('dorfbewohnerin')).toBe(false);
    expect(store.completeForInteraction('arkanist-eldren')).toBe(true);
    expect(store.completeForInteraction('arkanist-eldren')).toBe(false);
  });
});
