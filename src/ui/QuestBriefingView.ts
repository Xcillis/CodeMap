import type { EncounterPresentation } from '../gameplay/WorldQuests';
import { setLearningText } from './LearningText';

/** Shared disclosure behavior for every quest and free training; no automatic reading timer. */
export class QuestBriefingView {
  private readonly goals = this.el<HTMLDetailsElement>('encounter-goals');
  private readonly tips = this.el<HTMLDetailsElement>('lesson-hints');
  private readonly help = this.el<HTMLDetailsElement>('editor-help');
  private hints: readonly string[] = [];
  private hintIndex = -1;
  private minimized = false;
  constructor(private readonly layoutChanged: () => void, focusProgram: () => void) {
    for (const details of [this.goals, this.tips, this.help, this.el('encounter-guide')]) details.addEventListener('toggle', () => this.layoutChanged());
    this.tips.addEventListener('toggle', () => { if (this.tips.open && this.hintIndex < 0) this.showHint(0); });
    this.el('lesson-hint-button').addEventListener('click', () => { this.tips.open = true; this.showHint(this.hintIndex + 1); });
    this.el('briefing-ready').addEventListener('click', () => { this.workStarted(); focusProgram(); });
  }
  open(presentation?: EncounterPresentation): void {
    this.minimized = false; this.goals.open = true; this.tips.open = false; this.help.open = false;
    this.el<HTMLDetailsElement>('encounter-guide').open = false;
    setLearningText(this.el('encounter-objective'), presentation?.objective ?? 'Probiere dein Programm auf dem Raster aus.');
    setLearningText(this.el('encounter-instructions'), presentation?.instructions ?? '');
    this.el('encounter-guide').hidden = !presentation?.instructions;
    this.hints = presentation?.hints ?? []; this.hintIndex = -1;
    this.tips.hidden = !this.hints.length;
    const hint = this.el('lesson-hint'); hint.replaceChildren(); hint.hidden = true;
    this.el('lesson-hint-count').textContent = '';
    this.el<HTMLButtonElement>('lesson-hint-button').disabled = false;
    this.el('lesson-hint-button').textContent = 'Nächster Tipp';
    this.layoutChanged();
  }
  workStarted(): void {
    if (this.minimized) return;
    this.minimized = true; this.goals.open = false; this.tips.open = false; this.help.open = false; this.layoutChanged();
  }
  private showHint(index: number): void {
    if (!this.hints.length) return;
    this.hintIndex = Math.min(index, this.hints.length - 1);
    setLearningText(this.el('lesson-hint'), this.hints[this.hintIndex]); this.el('lesson-hint').hidden = false;
    this.el('lesson-hint-count').textContent = `(${this.hintIndex + 1}/${this.hints.length})`;
    const last = this.hintIndex === this.hints.length - 1;
    this.el<HTMLButtonElement>('lesson-hint-button').disabled = last;
    this.el('lesson-hint-button').textContent = last ? 'Alle Tipps angezeigt' : 'Nächster Tipp'; this.layoutChanged();
  }
  private el<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id); if (!element) throw new Error(`UI-Element #${id} fehlt.`); return element as T;
  }
}
