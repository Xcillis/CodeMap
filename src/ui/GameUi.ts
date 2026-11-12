import { gameEvents, type DialogPayload } from '../game/events';
import { touchInput, type TouchDirection } from '../input/TouchInput';

export class GameUi {
  private readonly questText = this.requiredElement<HTMLParagraphElement>('quest-text');
  private readonly dialog = this.requiredElement<HTMLElement>('dialog');
  private readonly dialogSpeaker = this.requiredElement<HTMLParagraphElement>('dialog-speaker');
  private readonly dialogText = this.requiredElement<HTMLParagraphElement>('dialog-text');
  private readonly hint = this.requiredElement<HTMLParagraphElement>('interaction-hint');
  private readonly battlePanel = this.requiredElement<HTMLElement>('battle-panel');
  private readonly programSource = this.requiredElement<HTMLTextAreaElement>('program-source');
  private readonly battleFeedback = this.requiredElement<HTMLParagraphElement>('battle-feedback');
  private readonly battleLog = this.requiredElement<HTMLOListElement>('battle-log');
  private pendingDialogAction: DialogPayload['action'];

  constructor() {
    gameEvents.on('quest-updated', (objective: string, complete: boolean) => {
      this.questText.textContent = objective;
      this.questText.parentElement?.classList.toggle('complete', complete);
    });
    gameEvents.on('dialog-opened', (dialog: DialogPayload) => this.openDialog(dialog));
    gameEvents.on('interaction-hint', (text: string) => (this.hint.textContent = text));
    gameEvents.on('battle-opened', (program: string) => this.openBattle(program));
    gameEvents.on('battle-updated', (state: { log: string[] }, feedback: string) => this.updateBattle(state, feedback));
    gameEvents.on('battle-closed', () => (this.battlePanel.hidden = true));

    this.requiredElement<HTMLButtonElement>('dialog-close').addEventListener('click', () => this.closeDialog());
    this.requiredElement<HTMLButtonElement>('interact-button').addEventListener('click', () => touchInput.requestInteraction());
    this.requiredElement<HTMLButtonElement>('battle-step').addEventListener('click', () => gameEvents.emit('battle-step', this.programSource.value));
    this.requiredElement<HTMLButtonElement>('battle-restart').addEventListener('click', () => gameEvents.emit('battle-restart'));
    this.requiredElement<HTMLButtonElement>('battle-exit').addEventListener('click', () => gameEvents.emit('battle-exit'));
    document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => this.bindDirection(button));
  }

  private openDialog(dialog: DialogPayload): void {
    this.pendingDialogAction = dialog.action;
    this.dialogSpeaker.textContent = dialog.speaker;
    this.dialogText.textContent = dialog.text;
    this.dialog.hidden = false;
    this.requiredElement<HTMLButtonElement>('dialog-close').focus();
  }

  private closeDialog(): void {
    this.dialog.hidden = true;
    gameEvents.emit('dialog-closed');
    if (this.pendingDialogAction) gameEvents.emit(this.pendingDialogAction);
    this.pendingDialogAction = undefined;
  }

  private openBattle(program: string): void {
    this.battlePanel.hidden = false;
    this.programSource.value = program;
    this.battleFeedback.textContent = '';
    this.programSource.focus();
  }

  private updateBattle(state: { log: string[] }, feedback: string): void {
    this.battleFeedback.textContent = feedback;
    this.battleLog.replaceChildren(...state.log.map((entry) => {
      const item = document.createElement('li');
      item.textContent = entry;
      return item;
    }));
  }

  private bindDirection(button: HTMLButtonElement): void {
    const direction = button.dataset.direction as TouchDirection;
    const setHeld = (pressed: boolean) => touchInput.setDirection(direction, pressed);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      setHeld(true);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => button.addEventListener(eventName, () => setHeld(false)));
  }

  private requiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`UI-Element #${id} fehlt.`);
    return element as T;
  }
}
