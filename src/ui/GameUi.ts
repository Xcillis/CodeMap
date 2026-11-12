import { gameEvents, type DialogPayload } from '../game/events';
import { touchInput, type TouchDirection } from '../input/TouchInput';
import { loadProgress, saveProgress, saveProgramDraft } from '../gameplay/LocalProgress';
import { blocksToSource, compileActionPlan } from '../combat/DecisionProgram';
import type { ArkanId, BattleState, CombatAction, ProgramBlock, ProgramSources } from '../combat/types';

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
  private readonly battleTitle = this.requiredElement<HTMLElement>('battle-title');
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
  private readonly companionHealthStatus = this.requiredElement<HTMLElement>('companion-health-status');
  private readonly companionHealth = this.requiredElement<HTMLProgressElement>('companion-health');
  private readonly companionHealthText = this.requiredElement<HTMLElement>('companion-health-text');
  private readonly enemyHealth = this.requiredElement<HTMLProgressElement>('enemy-health');
  private readonly enemyHealthText = this.requiredElement<HTMLElement>('enemy-health-text');
  private pendingDialogAction: DialogPayload['action'];
  private editorMode: EditorMode = 'blocks';
  private blockModel: ProgramBlock[] = [];
  private mission = 1;
  private selectedActor: ArkanId = 'moosling';
  private sources: ProgramSources = {};
  private readonly drafts: Record<string, string> = {};

  constructor() {
    gameEvents.on('quest-updated', (objective: string, complete: boolean) => {
      this.questText.textContent = objective;
      this.questText.parentElement?.classList.toggle('complete', complete);
    });
    gameEvents.on('dialog-opened', (dialog: DialogPayload) => this.openDialog(dialog));
    gameEvents.on('interaction-hint', (text: string) => (this.hint.textContent = text));
    gameEvents.on('battle-opened', (programs: ProgramSources, mission: number) => this.openBattle(programs, mission));
    gameEvents.on('battle-updated', (state: BattleState, feedback: string) => this.updateBattle(state, feedback));
    gameEvents.on('battle-closed', () => {
      this.battlePanel.hidden = true;
      this.setExplorationUiVisible(true);
    });
    gameEvents.on('battle-next-available', (available: boolean) => (this.requiredElement<HTMLButtonElement>('battle-next-mission').hidden = !available));

    this.requiredElement<HTMLButtonElement>('dialog-close').addEventListener('click', () => this.closeDialog());
    this.requiredElement<HTMLButtonElement>('interact-button').addEventListener('click', () => touchInput.requestInteraction());
    this.requiredElement<HTMLButtonElement>('battle-step').addEventListener('click', () => gameEvents.emit('battle-step', this.getPrograms()));
    this.requiredElement<HTMLButtonElement>('battle-run-program').addEventListener('click', () => gameEvents.emit('battle-run-program', this.getPrograms()));
    this.requiredElement<HTMLButtonElement>('battle-restart').addEventListener('click', () => gameEvents.emit('battle-restart'));
    this.requiredElement<HTMLButtonElement>('battle-next-mission').addEventListener('click', () => gameEvents.emit('battle-next-mission'));
    this.requiredElement<HTMLButtonElement>('battle-exit').addEventListener('click', () => gameEvents.emit('battle-exit'));
    this.programSource.addEventListener('input', () => this.captureDraft());
    this.requiredElement<HTMLButtonElement>('select-moosling').addEventListener('click', () => this.selectActor('moosling'));
    this.requiredElement<HTMLButtonElement>('select-glutling').addEventListener('click', () => this.selectActor('glutling'));
    gameEvents.on('arkan-selected', (actor: ArkanId) => this.selectActor(actor));
    this.blocksModeButton.addEventListener('click', () => this.setEditorMode('blocks'));
    this.textModeButton.addEventListener('click', () => this.setEditorMode('text'));
    this.requiredElement<HTMLButtonElement>('add-loop-block').addEventListener('click', () => {
      this.blockModel.push(this.mission === 2
        ? { kind: 'condition', count: 1, whenTrue: 'ATTACK', whenFalse: 'MOVE_TOWARD' }
        : { kind: 'action', count: 1, action: 'MOVE_TOWARD' });
      this.syncBlocksToSource();
    });
    document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach((button) => button.addEventListener('click', () => this.addLibraryCommand(button.dataset.command)));
    this.attachTooltip(this.blocksModeButton, () => 'Baue den Ablauf aus Wiederholungsblöcken. Die Blöcke werden in denselben Aktionsplan wie der Textmodus übersetzt.');
    this.attachTooltip(this.textModeButton, () => 'Bearbeite den gleichen Aktionsplan als begrenzten JavaScript-ähnlichen Text. Freier Browser-Code wird nicht ausgeführt.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-step'), () => 'Führt nur die nächste Aktion des Plans aus. So kannst du jede Wiederholung beobachten.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-run-program'), () => 'Setzt die Arena zurück und führt den gesamten Aktionsplan vom Anfang bis zum Ende aus.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-restart'), () => 'Setzt Positionen, Lebenspunkte und die bisher ausgeführten Schritte zurück. Dein Programm bleibt erhalten.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-next-mission'), () => 'Startet die nächste Lernmission mit einer neuen Aufgabe und einem erweiterten Programmbefehl.');
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

  private openBattle(programs: ProgramSources, mission: number): void {
    this.setExplorationUiVisible(false);
    this.battlePanel.hidden = false;
    this.mission = mission;
    this.battleTitle.textContent = mission === 1 ? 'RUNENSKRIPT – DIE ERSTE SCHLEIFE' : mission === 2 ? 'RUNENSKRIPT – NÄHE PRÜFEN' : 'RUNENSKRIPT – DUO-FORMATION';
    this.requiredElement<HTMLButtonElement>('battle-next-mission').hidden = true;
    this.sources = {};
    for (const actor of ['moosling', 'glutling'] as const) {
      if (programs[actor] !== undefined) {
        const key = `${mission}:${actor}`;
        this.sources[actor] = this.drafts[key] ?? loadProgress().programs[key] ?? programs[actor];
      }
    }
    this.selectedActor = 'moosling';
    this.requiredElement<HTMLButtonElement>('select-glutling').hidden = !programs.glutling;
    this.loadActorEditor();
    this.battleFeedback.textContent = '';
  }

  private updateBattle(state: BattleState, feedback: string): void {
    this.battleFeedback.textContent = feedback;
    this.battleRound.textContent = String(state.tick);
    this.updateHealth(this.playerHealth, this.playerHealthText, state.player.hp, state.player.maxHp);
    this.companionHealthStatus.hidden = !state.companion;
    if (state.companion) this.updateHealth(this.companionHealth, this.companionHealthText, state.companion.hp, state.companion.maxHp);
    this.updateHealth(this.enemyHealth, this.enemyHealthText, state.enemy.hp, state.enemy.maxHp);
    this.requiredElement<HTMLButtonElement>('battle-step').disabled = state.outcome !== 'ongoing';
    this.requiredElement<HTMLButtonElement>('battle-run-program').disabled = false;
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
      const parsed = compileActionPlan(this.programSource.value, this.selectedActor);
      if (!parsed.blocks) {
        this.battleFeedback.textContent = 'Dieser Text kann nicht in Wiederholungsblöcke umgewandelt werden.';
        return;
      }
      this.blockModel = parsed.blocks;
    }
    if (mode === 'text' && this.editorMode === 'blocks') this.programSource.value = blocksToSource(this.blockModel, this.selectedActor);
    this.editorMode = mode;
    this.blockEditor.hidden = mode !== 'blocks';
    this.programSource.hidden = mode !== 'text';
    this.blocksModeButton.classList.toggle('editor-mode-active', mode === 'blocks');
    this.textModeButton.classList.toggle('editor-mode-active', mode === 'text');
    this.blocksModeButton.setAttribute('aria-pressed', String(mode === 'blocks'));
    this.textModeButton.setAttribute('aria-pressed', String(mode === 'text'));
    if (mode === 'blocks') this.renderBlocks();
    this.captureDraft();
    saveProgress({ editorMode: mode });
  }

  private renderBlocks(): void {
    this.loopBlocks.replaceChildren(...this.blockModel.map((block, index) => this.createLoopBlock(block, index)));
  }

  private createLoopBlock(block: ProgramBlock, index: number): HTMLElement {
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
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Entfernen';
    remove.disabled = this.blockModel.length === 1;
    count.addEventListener('change', () => {
      this.blockModel[index].count = Number(count.value);
      this.syncBlocksToSource();
      this.showTooltip(`Diese Schleife führt ihre Aktion ${count.value} Mal aus.`);
    });
    remove.addEventListener('click', () => {
      this.blockModel.splice(index, 1);
      this.syncBlocksToSource();
    });
    row.append(prefix, count, times);
    if (block.kind === 'action') {
      const action = this.createActionSelect(`Aktion für Block ${index + 1}`, block.action);
      action.addEventListener('change', () => {
        (this.blockModel[index] as Extract<ProgramBlock, { kind: 'action' }>).action = action.value as CombatAction;
        this.syncBlocksToSource();
        this.showTooltip(this.actionHelp(action.value as CombatAction));
      });
      row.append(action);
      this.attachTooltip(action, () => this.actionHelp(action.value as CombatAction));
    } else {
      const condition = document.createElement('span');
      condition.textContent = 'wenn Gegner nahe:';
      const whenTrue = this.createActionSelect(`Aktion bei Nähe für Block ${index + 1}`, block.whenTrue);
      const otherwise = document.createElement('span');
      otherwise.textContent = 'sonst:';
      const whenFalse = this.createActionSelect(`Aktion ohne Nähe für Block ${index + 1}`, block.whenFalse);
      whenTrue.addEventListener('change', () => {
        (this.blockModel[index] as Extract<ProgramBlock, { kind: 'condition' }>).whenTrue = whenTrue.value as CombatAction;
        this.syncBlocksToSource();
      });
      whenFalse.addEventListener('change', () => {
        (this.blockModel[index] as Extract<ProgramBlock, { kind: 'condition' }>).whenFalse = whenFalse.value as CombatAction;
        this.syncBlocksToSource();
      });
      row.append(condition, whenTrue, otherwise, whenFalse);
      this.attachTooltip(condition, () => 'Die Bedingung wird bei jedem Schleifendurchlauf erneut geprüft.');
      this.attachTooltip(whenTrue, () => 'Diese Aktion wird gewählt, wenn der ausgewählte Arkan direkt neben dem Konstrukt steht.');
      this.attachTooltip(whenFalse, () => 'Diese Aktion wird gewählt, solange noch Abstand zum Konstrukt besteht.');
    }
    row.append(remove);
    this.attachTooltip(count, () => 'Bestimmt, wie oft die Aktion in diesem Block wiederholt wird. Erlaubt sind 1 bis 6 Wiederholungen.');
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

  private createActionSelect(label: string, selectedAction: CombatAction): HTMLSelectElement {
    const select = document.createElement('select');
    select.setAttribute('aria-label', label);
    this.addActionOption(select, 'MOVE_TOWARD', 'zum Konstrukt gehen', selectedAction);
    this.addActionOption(select, 'ATTACK', 'angreifen', selectedAction);
    return select;
  }

  private syncBlocksToSource(): void {
    this.programSource.value = blocksToSource(this.blockModel, this.selectedActor);
    this.captureDraft();
    this.renderBlocks();
  }

  private getProgramSource(): string {
    return this.editorMode === 'blocks' ? blocksToSource(this.blockModel, this.selectedActor) : this.programSource.value;
  }

  private addLibraryCommand(command: string | undefined): void {
    if (this.editorMode === 'blocks') {
      if (command === 'condition') {
        this.blockModel.push({ kind: 'condition', count: 1, whenTrue: 'ATTACK', whenFalse: 'MOVE_TOWARD' });
      } else {
        this.blockModel.push({ kind: 'action', count: 1, action: command === 'attack' ? 'ATTACK' : 'MOVE_TOWARD' });
      }
      this.syncBlocksToSource();
      return;
    }
    const snippet = command === 'condition'
      ? 'repeat(1, () => {\n  if (moosling.enemyAdjacent) {\n    moosling.attack();\n  } else {\n    moosling.moveForward();\n  }\n});'
      : `repeat(1, () => {\n  moosling.${command === 'attack' ? 'attack' : 'moveForward'}();\n});`;
    const ownedSnippet = snippet.replace(/moosling/g, this.selectedActor);
    this.programSource.setRangeText(`${this.programSource.value.trim() ? '\n\n' : ''}${ownedSnippet}`, this.programSource.selectionStart, this.programSource.selectionEnd, 'end');
    this.captureDraft();
  }

  private captureDraft(): void {
    const source = this.getProgramSource();
    this.sources[this.selectedActor] = source;
    this.drafts[`${this.mission}:${this.selectedActor}`] = source;
    saveProgramDraft(this.mission, this.selectedActor, source);
  }

  private getPrograms(): ProgramSources {
    this.captureDraft();
    return { ...this.sources };
  }

  private selectActor(actor: ArkanId): void {
    if (actor === this.selectedActor || this.sources[actor] === undefined) return;
    this.captureDraft();
    this.selectedActor = actor;
    this.loadActorEditor();
  }

  private loadActorEditor(): void {
    const actor = this.selectedActor;
    this.programSource.value = this.sources[actor] ?? '';
    const parsed = compileActionPlan(this.programSource.value, actor);
    this.blockModel = parsed.blocks ?? [];
    this.editorMode = 'text';
    this.setEditorMode(parsed.blocks ? loadProgress().editorMode : 'text');
    this.requiredElement<HTMLElement>('program-owner').textContent = `Programm von ${actor === 'moosling' ? 'Moosling' : 'Glutling'}`;
    for (const id of ['moosling', 'glutling'] as const) {
      const button = this.requiredElement<HTMLButtonElement>(`select-${id}`);
      button.setAttribute('aria-pressed', String(id === actor));
      button.classList.toggle('editor-mode-active', id === actor);
    }
    const commands = { move: 'moveForward()', attack: 'attack()', condition: 'enemyAdjacent' };
    document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach((button) => {
      const command = button.dataset.command as keyof typeof commands;
      const code = button.querySelector('code');
      if (code) code.textContent = `${actor}.${commands[command]}`;
      button.hidden = command === 'condition' && this.mission === 1;
    });
    this.hideTooltip();
  }

  private actionHelp(action: CombatAction): string {
    return action === 'MOVE_TOWARD'
      ? 'moveForward(): Der ausgewählte Arkan geht ein Feld zum Konstrukt. Belegte Felder blockieren den Schritt.'
      : 'attack(): Der ausgewählte Arkan verursacht einen Schadenspunkt, wenn er neben dem Konstrukt steht.';
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
