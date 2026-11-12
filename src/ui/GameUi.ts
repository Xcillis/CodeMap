import { gameEvents, type DialogPayload } from '../game/events';
import { touchInput, type TouchDirection } from '../input/TouchInput';
import { loadProgress, saveProgress } from '../gameplay/LocalProgress';
import { blocksToSource, compileActionPlan } from '../combat/DecisionProgram';
import type { BattleState, CombatAction, LoopBlock } from '../combat/types';

type EditorMode = 'blocks' | 'text';

export class GameUi {
  private readonly questText = this.requiredElement<HTMLParagraphElement>('quest-text');
  private readonly hud = this.requiredElement<HTMLElement>('hud');
  private readonly dialog = this.requiredElement<HTMLElement>('dialog');
  private readonly dialogSpeaker = this.requiredElement<HTMLParagraphElement>('dialog-speaker');
  private readonly dialogText = this.requiredElement<HTMLParagraphElement>('dialog-text');
  private readonly hint = this.requiredElement<HTMLParagraphElement>('interaction-hint');
  private readonly touchControls = this.requiredElement<HTMLElement>('touch-controls');
  private readonly battlePanel = this.requiredElement<HTMLElement>('battle-panel');
  private readonly programSource = this.requiredElement<HTMLTextAreaElement>('program-source');
  private readonly editorTooltip = this.requiredElement<HTMLParagraphElement>('editor-tooltip');
  private readonly blockEditor = this.requiredElement<HTMLElement>('block-editor');
  private readonly loopBlocks = this.requiredElement<HTMLElement>('loop-blocks');
  private readonly blocksModeButton = this.requiredElement<HTMLButtonElement>('blocks-mode');
  private readonly textModeButton = this.requiredElement<HTMLButtonElement>('text-mode');
  private readonly battleFeedback = this.requiredElement<HTMLParagraphElement>('battle-feedback');
  private readonly battleLog = this.requiredElement<HTMLOListElement>('battle-log');
  private readonly battleRound = this.requiredElement<HTMLElement>('battle-round');
  private readonly playerHealth = this.requiredElement<HTMLProgressElement>('player-health');
  private readonly playerHealthText = this.requiredElement<HTMLElement>('player-health-text');
  private readonly enemyHealth = this.requiredElement<HTMLProgressElement>('enemy-health');
  private readonly enemyHealthText = this.requiredElement<HTMLElement>('enemy-health-text');
  private pendingDialogAction: DialogPayload['action'];
  private editorMode: EditorMode = 'blocks';
  private blockModel: LoopBlock[] = [];

  constructor() {
    gameEvents.on('quest-updated', (objective: string, complete: boolean) => {
      this.questText.textContent = objective;
      this.questText.parentElement?.classList.toggle('complete', complete);
    });
    gameEvents.on('dialog-opened', (dialog: DialogPayload) => this.openDialog(dialog));
    gameEvents.on('interaction-hint', (text: string) => (this.hint.textContent = text));
    gameEvents.on('battle-opened', (program: string) => this.openBattle(program));
    gameEvents.on('battle-updated', (state: BattleState, feedback: string) => this.updateBattle(state, feedback));
    gameEvents.on('battle-closed', () => {
      this.battlePanel.hidden = true;
      this.setExplorationUiVisible(true);
    });

    this.requiredElement<HTMLButtonElement>('dialog-close').addEventListener('click', () => this.closeDialog());
    this.requiredElement<HTMLButtonElement>('interact-button').addEventListener('click', () => touchInput.requestInteraction());
    this.requiredElement<HTMLButtonElement>('battle-step').addEventListener('click', () => gameEvents.emit('battle-step', this.getProgramSource()));
    this.requiredElement<HTMLButtonElement>('battle-run-program').addEventListener('click', () => gameEvents.emit('battle-run-program', this.getProgramSource()));
    this.requiredElement<HTMLButtonElement>('battle-restart').addEventListener('click', () => gameEvents.emit('battle-restart'));
    this.requiredElement<HTMLButtonElement>('battle-exit').addEventListener('click', () => gameEvents.emit('battle-exit'));
    this.programSource.addEventListener('input', () => saveProgress({ lastProgram: this.programSource.value }));
    this.blocksModeButton.addEventListener('click', () => this.setEditorMode('blocks'));
    this.textModeButton.addEventListener('click', () => this.setEditorMode('text'));
    this.requiredElement<HTMLButtonElement>('add-loop-block').addEventListener('click', () => {
      this.blockModel.push({ count: 1, action: 'MOVE_TOWARD' });
      this.syncBlocksToSource();
    });
    this.attachTooltip(this.blocksModeButton, () => 'Baue den Ablauf aus Wiederholungsblöcken. Die Blöcke werden in denselben Aktionsplan wie der Textmodus übersetzt.');
    this.attachTooltip(this.textModeButton, () => 'Bearbeite den gleichen Aktionsplan als begrenzten JavaScript-ähnlichen Text. Freier Browser-Code wird nicht ausgeführt.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-step'), () => 'Führt nur die nächste Aktion des Plans aus. So kannst du jede Wiederholung beobachten.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-run-program'), () => 'Setzt die Arena zurück und führt den gesamten Aktionsplan vom Anfang bis zum Ende aus.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-restart'), () => 'Setzt Positionen, Lebenspunkte und die bisher ausgeführten Schritte zurück. Dein Programm bleibt erhalten.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-exit'), () => 'Kehrt ohne Datenverlust zur Erkundung zurück.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('add-loop-block'), () => 'Fügt eine weitere Wiederholung an das Ende des Aktionsplans an.');
    document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => this.bindDirection(button));
  }

  private openDialog(dialog: DialogPayload): void {
    this.pendingDialogAction = dialog.action;
    this.dialogSpeaker.textContent = dialog.speaker;
    this.dialogText.textContent = dialog.text;
    this.requiredElement<HTMLButtonElement>('dialog-close').textContent = dialog.action ? 'Zur Trainingsarena' : 'Verstanden';
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
    this.setExplorationUiVisible(false);
    this.battlePanel.hidden = false;
    this.programSource.value = loadProgress().lastProgram || program;
    const parsed = compileActionPlan(this.programSource.value);
    this.blockModel = parsed.blocks ?? [];
    this.setEditorMode(parsed.blocks ? loadProgress().editorMode : 'text');
    this.battleFeedback.textContent = '';
  }

  private updateBattle(state: BattleState, feedback: string): void {
    this.battleFeedback.textContent = feedback;
    this.battleRound.textContent = String(state.tick);
    this.updateHealth(this.playerHealth, this.playerHealthText, state.player.hp, state.player.maxHp);
    this.updateHealth(this.enemyHealth, this.enemyHealthText, state.enemy.hp, state.enemy.maxHp);
    this.requiredElement<HTMLButtonElement>('battle-step').disabled = state.outcome !== 'ongoing';
    this.requiredElement<HTMLButtonElement>('battle-run-program').disabled = state.outcome !== 'ongoing';
    this.battleLog.replaceChildren(...state.log.map((entry) => {
      const item = document.createElement('li');
      item.textContent = entry;
      return item;
    }));
  }

  private updateHealth(bar: HTMLProgressElement, label: HTMLElement, hp: number, maxHp: number): void {
    bar.max = maxHp;
    bar.value = hp;
    bar.textContent = `${hp} von ${maxHp}`;
    label.textContent = `${hp}/${maxHp}`;
  }

  private setEditorMode(mode: EditorMode): void {
    if (mode === 'blocks' && this.editorMode === 'text') {
      const parsed = compileActionPlan(this.programSource.value);
      if (!parsed.blocks) {
        this.battleFeedback.textContent = 'Dieser Text kann nicht in Wiederholungsblöcke umgewandelt werden.';
        return;
      }
      this.blockModel = parsed.blocks;
    }
    if (mode === 'text') this.programSource.value = blocksToSource(this.blockModel);
    this.editorMode = mode;
    this.blockEditor.hidden = mode !== 'blocks';
    this.programSource.hidden = mode !== 'text';
    this.blocksModeButton.classList.toggle('editor-mode-active', mode === 'blocks');
    this.textModeButton.classList.toggle('editor-mode-active', mode === 'text');
    this.blocksModeButton.setAttribute('aria-pressed', String(mode === 'blocks'));
    this.textModeButton.setAttribute('aria-pressed', String(mode === 'text'));
    if (mode === 'blocks') this.renderBlocks();
    saveProgress({ lastProgram: this.programSource.value, editorMode: mode });
  }

  private renderBlocks(): void {
    this.loopBlocks.replaceChildren(...this.blockModel.map((block, index) => this.createLoopBlock(block, index)));
  }

  private createLoopBlock(block: LoopBlock, index: number): HTMLElement {
    const row = document.createElement('div');
    row.className = 'loop-block';
    const prefix = document.createElement('span');
    prefix.textContent = 'Wiederhole';
    const count = document.createElement('select');
    count.setAttribute('aria-label', `Wiederholungen für Block ${index + 1}`);
    for (let value = 1; value <= 6; value += 1) {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = String(value);
      option.selected = value === block.count;
      count.append(option);
    }
    const times = document.createElement('span');
    times.textContent = 'mal';
    const action = document.createElement('select');
    action.setAttribute('aria-label', `Aktion für Block ${index + 1}`);
    this.addActionOption(action, 'MOVE_TOWARD', 'zum Konstrukt gehen', block.action);
    this.addActionOption(action, 'ATTACK', 'angreifen', block.action);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Entfernen';
    remove.disabled = this.blockModel.length === 1;
    count.addEventListener('change', () => {
      this.blockModel[index].count = Number(count.value);
      this.syncBlocksToSource();
      this.showTooltip(`Diese Schleife führt ihre Aktion ${count.value} Mal aus.`);
    });
    action.addEventListener('change', () => {
      this.blockModel[index].action = action.value as CombatAction;
      this.syncBlocksToSource();
      this.showTooltip(this.actionHelp(action.value as CombatAction));
    });
    remove.addEventListener('click', () => {
      this.blockModel.splice(index, 1);
      this.syncBlocksToSource();
    });
    row.append(prefix, count, times, action, remove);
    this.attachTooltip(count, () => 'Bestimmt, wie oft die Aktion in diesem Block wiederholt wird. Erlaubt sind 1 bis 6 Wiederholungen.');
    this.attachTooltip(action, () => this.actionHelp(action.value as CombatAction));
    this.attachTooltip(remove, () => 'Entfernt diesen Wiederholungsblock aus dem Aktionsplan.');
    return row;
  }

  private addActionOption(select: HTMLSelectElement, value: CombatAction, label: string, selectedAction: CombatAction): void {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = value === selectedAction;
    select.append(option);
  }

  private syncBlocksToSource(): void {
    this.programSource.value = blocksToSource(this.blockModel);
    saveProgress({ lastProgram: this.programSource.value, editorMode: 'blocks' });
    this.renderBlocks();
  }

  private getProgramSource(): string {
    return this.editorMode === 'blocks' ? blocksToSource(this.blockModel) : this.programSource.value;
  }

  private actionHelp(action: CombatAction): string {
    return action === 'MOVE_TOWARD'
      ? 'Zum Konstrukt gehen: Moosling bewegt sich ein Feld in Richtung des Konstrukts. Wiederhole diese Aktion, um die Distanz zu verringern.'
      : 'Angreifen: Moosling verursacht ein Schadenspunkt, wenn er neben dem Konstrukt steht. Außerhalb der Reichweite hat der Angriff keine Wirkung.';
  }

  private attachTooltip(element: HTMLElement, getMessage: () => string): void {
    element.title = getMessage();
    element.addEventListener('mouseenter', () => this.showTooltip(getMessage()));
    element.addEventListener('focus', () => this.showTooltip(getMessage()));
    element.addEventListener('mouseleave', () => this.hideTooltip());
    element.addEventListener('blur', () => this.hideTooltip());
  }

  private showTooltip(message: string): void {
    this.editorTooltip.textContent = message;
    this.editorTooltip.hidden = false;
  }

  private hideTooltip(): void {
    this.editorTooltip.hidden = true;
  }

  private setExplorationUiVisible(visible: boolean): void {
    [this.hud, this.hint, this.touchControls].forEach((element) => element.classList.toggle('screen-hidden', !visible));
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
