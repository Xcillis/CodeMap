import { gameEvents, type DialogPayload } from '../game/events';
import { touchInput, type TouchDirection } from '../input/TouchInput';
import { loadProgress, saveProgress, saveProgramDraft } from '../gameplay/LocalProgress';
import { blocksToSource, compileActionPlan } from '../combat/DecisionProgram';
import type { ArkanId, BattleState, CombatAction, ProgramBlock, ProgramSources } from '../combat/types';
import { ProgramDrag, type DragItem } from './ProgramDrag';
import { availableCommands, COMMAND_CATEGORIES, commandSource, type CommandCategory } from '../combat/CommandCatalog';

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
  private readonly drag: ProgramDrag;
  private selectedCategory: CommandCategory = 'movement';

  constructor() {
    this.drag = new ProgramDrag(
      this.battlePanel,
      this.requiredElement<HTMLElement>('program-drop-area'),
      () => this.editorMode === 'blocks' ? Array.from(this.loopBlocks.querySelectorAll<HTMLElement>('.loop-block')) : [],
      (item, index) => this.dropProgramItem(item, index),
    );
    gameEvents.on('quest-updated', (objective: string, complete: boolean) => {
      this.questText.textContent = objective;
      this.questText.parentElement?.classList.toggle('complete', complete);
    });
    gameEvents.on('dialog-opened', (dialog: DialogPayload) => this.openDialog(dialog));
    gameEvents.on('interaction-hint', (text: string) => (this.hint.textContent = text));
    gameEvents.on('battle-opened', (programs: ProgramSources, mission: number) => this.openBattle(programs, mission));
    gameEvents.on('battle-updated', (state: BattleState, feedback: string) => this.updateBattle(state, feedback));
    gameEvents.on('battle-closed', () => {
      this.drag.cancel();
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
    this.requiredElement<HTMLButtonElement>('add-loop-block').addEventListener('click', () => this.addLibraryCommand('repeat'));
    this.requiredElement<HTMLElement>('command-entries').addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-command]') : null;
      if (button) this.addLibraryCommand(button.dataset.command);
    });
    this.attachTooltip(this.blocksModeButton, () => 'Baue den Ablauf aus Wiederholungsblöcken. Die Blöcke werden in denselben Aktionsplan wie der Textmodus übersetzt.');
    this.attachTooltip(this.textModeButton, () => 'Bearbeite den gleichen Aktionsplan als begrenzten JavaScript-ähnlichen Text. Freier Browser-Code wird nicht ausgeführt.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-step'), () => 'Führt nur die nächste Aktion des Plans aus. So kannst du jede Wiederholung beobachten.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-run-program'), () => 'Setzt die Arena zurück und führt den gesamten Aktionsplan vom Anfang bis zum Ende aus.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-restart'), () => 'Setzt Positionen, Lebenspunkte und die bisher ausgeführten Schritte zurück. Dein Programm bleibt erhalten.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-next-mission'), () => 'Startet die nächste Lernmission mit einer neuen Aufgabe und einem erweiterten Programmbefehl.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('battle-exit'), () => 'Kehrt ohne Datenverlust zur Erkundung zurück.');
    this.attachTooltip(this.requiredElement<HTMLButtonElement>('add-loop-block'), () => 'Fügt eine weitere Wiederholung an das Ende des Aktionsplans an.');
    document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => this.bindDirection(button));
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.publishArenaViewport()).observe(this.battlePanel);
    window.addEventListener('resize', () => this.publishArenaViewport());
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
    this.drag.cancel();
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
    this.publishArenaViewport();
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

  private publishArenaViewport(): void {
    if (this.battlePanel.hidden) return;
    const panel = this.battlePanel.getBoundingClientRect();
    if (panel.width === 0) return;
    const stacked = panel.width > window.innerWidth * .85;
    gameEvents.emit('battle-viewport', {
      width: stacked ? window.innerWidth : Math.max(1, panel.left - 8),
      height: stacked ? Math.max(1, panel.top - 8) : window.innerHeight,
    });
  }

  private updateHealth(bar: HTMLProgressElement, label: HTMLElement, hp: number, maxHp: number): void {
    bar.max = maxHp;
    bar.value = hp;
    bar.textContent = `${hp} von ${maxHp}`;
    label.textContent = `${hp}/${maxHp}`;
  }

  private setEditorMode(mode: EditorMode): void {
    this.drag.cancel();
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
    this.requiredElement<HTMLElement>('library-instructions').textContent = mode === 'blocks'
      ? 'Ziehe einen Befehl rechts an die gewünschte Stelle. Ein Klick hängt ihn an.'
      : 'Ziehe einen Befehl in den Textbereich oder klicke ihn an: Einfügen an der Textcursorposition.';
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
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'block-drag-handle';
    handle.dataset.dragBlock = String(index);
    handle.textContent = '⠿';
    handle.setAttribute('aria-label', `Block ${index + 1} verschieben. Pfeil nach oben oder unten zum Umsortieren.`);
    handle.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      this.moveBlock(index, event.key === 'ArrowUp' ? index - 1 : index + 2);
    });
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
    row.append(handle, prefix, count, times);
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
    const commands = availableCommands(this.selectedActor, this.mission);
    if (commands.some((command) => command.id === 'move')) this.addActionOption(select, 'MOVE_TOWARD', 'zum Konstrukt gehen', selectedAction);
    if (commands.some((command) => command.id === 'attack')) this.addActionOption(select, 'ATTACK', 'angreifen', selectedAction);
    if (!Array.from(select.options).some((option) => option.selected && option.value === selectedAction)) {
      const option = document.createElement('option');
      option.value = selectedAction;
      option.textContent = 'Noch nicht gelernt';
      option.disabled = true;
      option.selected = true;
      select.append(option);
    }
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

  private addLibraryCommand(command: string | undefined, index = this.blockModel.length): void {
    const definition = availableCommands(this.selectedActor, this.mission).find((entry) => entry.id === command);
    if (!definition) {
      this.battleFeedback.textContent = 'Dieser Befehl ist für den ausgewählten Arkan noch nicht freigeschaltet.';
      return;
    }
    if (this.editorMode === 'blocks') {
      const block = definition.block();
      if (this.blockModel.reduce((sum, entry) => sum + entry.count, 0) + block.count > 12) {
        this.battleFeedback.textContent = 'Maximal zwölf Schritte. Verringere zuerst eine Wiederholungszahl.';
        return;
      }
      this.blockModel.splice(index, 0, block);
      this.syncBlocksToSource();
      this.battleFeedback.textContent = `Block an Position ${index + 1} eingefügt.`;
      return;
    }
    const ownedSnippet = commandSource(definition, this.selectedActor);
    this.programSource.setRangeText(`${this.programSource.value.trim() ? '\n\n' : ''}${ownedSnippet}`, this.programSource.selectionStart, this.programSource.selectionEnd, 'end');
    this.captureDraft();
  }

  private dropProgramItem(item: DragItem, index: number): void {
    this.hideTooltip();
    if (item.kind === 'command') this.addLibraryCommand(item.command, index);
    else if (this.editorMode === 'blocks') this.moveBlock(item.index, index);
  }

  private moveBlock(from: number, boundary: number): void {
    const target = Math.max(0, Math.min(boundary > from ? boundary - 1 : boundary, this.blockModel.length - 1));
    if (target === from) return;
    const [block] = this.blockModel.splice(from, 1);
    this.blockModel.splice(target, 0, block);
    this.syncBlocksToSource();
    this.battleFeedback.textContent = `Block von Position ${from + 1} auf ${target + 1} verschoben.`;
    this.loopBlocks.querySelector<HTMLButtonElement>(`[data-drag-block="${target}"]`)?.focus();
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
    this.drag.cancel();
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
    this.renderCommandLibrary();
    this.hideTooltip();
  }

  private actionHelp(action: CombatAction): string {
    return action === 'MOVE_TOWARD'
      ? 'moveForward(): Der ausgewählte Arkan geht ein Feld zum Konstrukt. Belegte Felder blockieren den Schritt.'
      : 'attack(): Der ausgewählte Arkan verursacht einen Schadenspunkt, wenn er neben dem Konstrukt steht.';
  }

  private renderCommandLibrary(): void {
    const commands = availableCommands(this.selectedActor, this.mission);
    const categories = COMMAND_CATEGORIES.filter((category) => commands.some((command) => command.category === category.id));
    if (!categories.some((category) => category.id === this.selectedCategory)) this.selectedCategory = categories[0]?.id ?? 'movement';
    const nav = this.requiredElement<HTMLElement>('command-categories');
    nav.replaceChildren(...categories.map((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.category = category.id;
      button.id = `category-${category.id}`;
      button.style.setProperty('--category-color', category.color);
      button.setAttribute('aria-pressed', String(category.id === this.selectedCategory));
      const dot = document.createElement('span');
      dot.className = 'category-dot';
      dot.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = category.label;
      button.append(dot, label);
      button.addEventListener('click', () => {
        this.drag.cancel();
        this.selectedCategory = category.id;
        this.renderCommandLibrary();
        this.requiredElement<HTMLButtonElement>(`category-${category.id}`).focus();
      });
      return button;
    }));
    const selected = categories.find((category) => category.id === this.selectedCategory);
    this.requiredElement<HTMLElement>('command-category-title').textContent = selected?.label ?? 'Keine Befehle';
    this.requiredElement<HTMLElement>('command-availability').textContent = `Gelernte Befehle für ${this.selectedActor === 'moosling' ? 'Moosling' : 'Glutling'}`;
    this.requiredElement<HTMLElement>('command-entries').replaceChildren(...commands.filter((command) => command.category === this.selectedCategory).map((command) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.command = command.id;
      button.style.setProperty('--category-color', selected?.color ?? '#559cf0');
      const label = document.createElement('strong');
      label.textContent = command.label;
      const syntax = document.createElement('code');
      syntax.textContent = command.syntax(this.selectedActor);
      const description = document.createElement('span');
      description.textContent = command.description;
      button.append(label, syntax, description);
      this.attachTooltip(button, () => command.description);
      return button;
    }));
    this.hideTooltip();
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
