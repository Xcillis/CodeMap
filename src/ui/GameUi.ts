import { gameEvents, type DialogPayload } from '../game/events';
import { touchInput, type TouchDirection } from '../input/TouchInput';

export class GameUi {
  private readonly questText = this.requiredElement<HTMLParagraphElement>('quest-text');
  private readonly dialog = this.requiredElement<HTMLElement>('dialog');
  private readonly dialogSpeaker = this.requiredElement<HTMLParagraphElement>('dialog-speaker');
  private readonly dialogText = this.requiredElement<HTMLParagraphElement>('dialog-text');
  private readonly hint = this.requiredElement<HTMLParagraphElement>('interaction-hint');

  constructor() {
    gameEvents.on('quest-updated', (objective: string, complete: boolean) => {
      this.questText.textContent = objective;
      this.questText.parentElement?.classList.toggle('complete', complete);
    });
    gameEvents.on('dialog-opened', (dialog: DialogPayload) => this.openDialog(dialog));
    gameEvents.on('interaction-hint', (text: string) => (this.hint.textContent = text));

    this.requiredElement<HTMLButtonElement>('dialog-close').addEventListener('click', () => this.closeDialog());
    this.requiredElement<HTMLButtonElement>('interact-button').addEventListener('click', () => touchInput.requestInteraction());
    document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => this.bindDirection(button));
  }

  private openDialog(dialog: DialogPayload): void {
    this.dialogSpeaker.textContent = dialog.speaker;
    this.dialogText.textContent = dialog.text;
    this.dialog.hidden = false;
    this.requiredElement<HTMLButtonElement>('dialog-close').focus();
  }

  private closeDialog(): void {
    this.dialog.hidden = true;
    gameEvents.emit('dialog-closed');
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
