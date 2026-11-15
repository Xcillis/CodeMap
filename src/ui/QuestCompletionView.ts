import type { LessonId, QuestCompletion } from '../gameplay/WorldQuests';
import { setLearningText } from './LearningText';

/** Arena-local completion dialog; never interprets simulation frames as a saved victory. */
export class QuestCompletionView {
  private readonly dialog = this.el('quest-completion');
  private returnFocus?: HTMLElement;
  constructor(onExit: () => void, private readonly onContinue: (id: LessonId) => void) {
    this.el('quest-completion-exit').addEventListener('click', onExit);
    this.el('quest-completion-review').addEventListener('click', () => this.hide(true));
    this.dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.hide(true); }
      if (event.key !== 'Tab') return;
      const buttons = this.buttons(); const first = buttons[0]; const last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  }
  show(completion: QuestCompletion): void {
    if (this.dialog.hidden) this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.el('quest-completion-heading').textContent = completion.repeated ? 'Quest erneut geschafft!' : 'Quest abgeschlossen!';
    this.el('quest-completion-title').textContent = completion.title;
    setLearningText(this.el('quest-completion-text'), completion.text);
    setLearningText(this.el('quest-completion-next'), completion.nextObjective);
    const followUps = this.el('quest-completion-follow-ups');
    followUps.replaceChildren(...(completion.followUps ?? []).map((quest) => {
      const button = document.createElement('button'); button.type = 'button'; button.id = `quest-continue-${quest.lesson}`;
      button.textContent = `Quest starten: ${quest.title}`;
      button.addEventListener('click', () => this.onContinue(quest.lesson)); return button;
    }));
    followUps.hidden = !followUps.childElementCount; this.el('quest-completion-feedback').hidden = true;
    const status = this.el('quest-completion-status'); status.textContent = `✓ Quest abgeschlossen · ${completion.title}`; status.hidden = false;
    this.el('battle-exit').textContent = 'Zur Spielwelt';
    this.el('battle-card').inert = true; this.el('game').inert = true;
    this.dialog.hidden = false; this.dialog.scrollTop = 0;
    this.buttons()[0]?.focus();
  }
  error(message: string): void { const feedback = this.el('quest-completion-feedback'); feedback.textContent = message; feedback.hidden = false; }
  hide(restoreFocus = false): void {
    const wasOpen = !this.dialog.hidden;
    this.dialog.hidden = true; this.el('battle-card').inert = false; this.el('game').inert = false;
    if (wasOpen && restoreFocus) {
      const target = this.returnFocus?.closest('#battle-card') ? this.returnFocus : this.el('battle-exit');
      target.focus();
    }
  }
  clear(): void { this.hide(); this.el('quest-completion-status').hidden = true; this.el('quest-completion-follow-ups').replaceChildren(); this.el('quest-completion-follow-ups').hidden = true; this.el('quest-completion-feedback').hidden = true; }
  private buttons(): HTMLButtonElement[] { return Array.from(this.dialog.querySelectorAll<HTMLButtonElement>('button')).filter((button) => !button.hidden && !button.disabled); }
  private el(id: string): HTMLElement { const element = document.getElementById(id); if (!element) throw new Error(`UI-Element #${id} fehlt.`); return element; }
}
