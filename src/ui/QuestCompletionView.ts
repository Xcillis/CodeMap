import type { QuestCompletion } from '../gameplay/WorldQuests';
import { setLearningText } from './LearningText';

/** Arena-local completion dialog; never interprets simulation frames as a saved victory. */
export class QuestCompletionView {
  private readonly dialog = this.el('quest-completion');
  private returnFocus?: HTMLElement;
  constructor(onExit: () => void) {
    this.el('quest-completion-exit').addEventListener('click', onExit);
    this.el('quest-completion-review').addEventListener('click', () => this.hide(true));
    this.dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.hide(true); }
      if (event.key !== 'Tab') return;
      const first = this.el('quest-completion-exit'); const last = this.el('quest-completion-review');
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }
  show(completion: QuestCompletion): void {
    if (this.dialog.hidden) this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.el('quest-completion-heading').textContent = completion.repeated ? 'Quest erneut geschafft!' : 'Quest abgeschlossen!';
    this.el('quest-completion-title').textContent = completion.title;
    setLearningText(this.el('quest-completion-text'), completion.text);
    setLearningText(this.el('quest-completion-next'), completion.nextObjective);
    const status = this.el('quest-completion-status'); status.textContent = `✓ Quest abgeschlossen · ${completion.title}`; status.hidden = false;
    this.el('battle-exit').textContent = 'Zur Spielwelt';
    this.el('battle-card').inert = true; this.el('game').inert = true;
    this.dialog.hidden = false; this.dialog.scrollTop = 0;
    this.el('quest-completion-exit').focus();
  }
  hide(restoreFocus = false): void {
    const wasOpen = !this.dialog.hidden;
    this.dialog.hidden = true; this.el('battle-card').inert = false; this.el('game').inert = false;
    if (wasOpen && restoreFocus) {
      const target = this.returnFocus?.closest('#battle-card') ? this.returnFocus : this.el('battle-exit');
      target.focus();
    }
  }
  clear(): void { this.hide(); this.el('quest-completion-status').hidden = true; }
  private el(id: string): HTMLElement { const element = document.getElementById(id); if (!element) throw new Error(`UI-Element #${id} fehlt.`); return element; }
}
