import { gameEvents, type DialogPayload } from '../game/events';
import { touchInput, type TouchDirection } from '../input/TouchInput';
import { loadProgress, saveProgress, saveProgramDraft } from '../gameplay/LocalProgress';
import { compileActionPlan } from '../combat/DecisionProgram';
import type { ArkanId, BattleState, ProgramSources } from '../combat/types';
import { availableCommands, COMMAND_CATEGORIES, commandSource, type CommandCategory } from '../combat/CommandCatalog';
import { SnapEditor } from './SnapEditor';
import { ProgramDrag } from './ProgramDrag';

type EditorMode = 'blocks' | 'text';

export class GameUi {
  private editorMode: EditorMode = 'text';
  private selectedActor: ArkanId = 'moosling';
  private mission = 1;
  private selectedCategory: CommandCategory = 'movement';
  private sources: ProgramSources = {};
  private drafts: Record<string, string> = {};
  private workspaceDrafts: Record<string, string> = {};
  private loose: Record<string, boolean> = {};
  private pendingDialogAction: DialogPayload['action'];
  private snap?: SnapEditor;
  private readonly panel = this.el<HTMLElement>('battle-panel');
  private readonly text = this.el<HTMLTextAreaElement>('program-source');
  private readonly feedback = this.el<HTMLElement>('battle-feedback');
  private readonly drag: ProgramDrag;

  constructor() {
    this.drag = new ProgramDrag(this.panel, this.el('program-drop-area'), () => [], (item) => {
      if (item.kind === 'command' && this.editorMode === 'text') this.insertTextCommand(item.command);
    });
    gameEvents.on('quest-updated', (objective: string, complete: boolean) => {
      this.el('quest-text').textContent = objective;
      this.el('hud').classList.toggle('complete', complete);
    });
    gameEvents.on('interaction-hint', (text: string) => { this.el('interaction-hint').textContent = text; });
    gameEvents.on('dialog-opened', (dialog: DialogPayload) => {
      this.pendingDialogAction = dialog.action;
      this.el('dialog-speaker').textContent = dialog.speaker;
      this.el('dialog-text').textContent = dialog.text;
      this.el('dialog-close').textContent = dialog.action ? 'Zur Trainingsarena' : 'Verstanden';
      this.el('dialog').hidden = false;
      this.el('dialog-close').focus();
    });
    this.click('dialog-close', () => {
      this.el('dialog').hidden = true;
      gameEvents.emit('dialog-closed');
      if (this.pendingDialogAction) gameEvents.emit(this.pendingDialogAction);
      this.pendingDialogAction = undefined;
    });
    gameEvents.on('battle-opened', (programs: ProgramSources, mission: number) => this.open(programs, mission));
    gameEvents.on('battle-closed', () => {
      this.capture(); this.drag.cancel(); this.panel.hidden = true;
      this.exploration(true);
    });
    gameEvents.on('battle-updated', (state: BattleState, feedback: string) => this.update(state, feedback));
    gameEvents.on('battle-next-available', (available: boolean) => { this.el('battle-next-mission').hidden = !available; });
    gameEvents.on('arkan-selected', (actor: ArkanId) => this.selectActor(actor));
    this.click('select-moosling', () => this.selectActor('moosling'));
    this.click('select-glutling', () => this.selectActor('glutling'));
    this.click('blocks-mode', () => this.setMode('blocks'));
    this.click('text-mode', () => this.setMode('text'));
    this.click('battle-step', () => this.execute('battle-step'));
    this.click('battle-run-program', () => this.execute('battle-run-program'));
    this.click('battle-restart', () => gameEvents.emit('battle-restart'));
    this.click('battle-next-mission', () => gameEvents.emit('battle-next-mission'));
    this.click('battle-exit', () => gameEvents.emit('battle-exit'));
    this.click('interact-button', () => touchInput.requestInteraction());
    this.text.addEventListener('input', () => {
      this.workspaceDrafts[this.key()] = '';
      this.loose[this.key()] = false;
      this.capture();
    });
    this.el('command-entries').addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-command]') : null;
      if (button) this.insertTextCommand(button.dataset.command ?? '');
    });
    document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => {
      const direction = button.dataset.direction as TouchDirection;
      button.addEventListener('pointerdown', (event) => { event.preventDefault(); touchInput.setDirection(direction, true); });
      for (const name of ['pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(name, () => touchInput.setDirection(direction, false));
    });
    for (const [id, text] of Object.entries({ 'battle-step': 'Führt den nächsten Spielschritt aller Arkane aus.', 'battle-run-program': 'Startet die Mission neu und führt alle verbundenen Programme aus.', 'battle-restart': 'Setzt den Kampf zurück. Deine Programme bleiben erhalten.', 'blocks-mode': 'Blöcke einrasten oder in Schleifen und Bedingungen ziehen.', 'text-mode': 'Dasselbe Programm als Text bearbeiten.' })) {
      const element = this.el(id);
      element.title = text;
      for (const event of ['mouseenter', 'focus']) element.addEventListener(event, () => { this.el('editor-tooltip').textContent = text; this.el('editor-tooltip').hidden = false; });
      for (const event of ['mouseleave', 'blur']) element.addEventListener(event, () => { this.el('editor-tooltip').hidden = true; });
    }
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.resize()).observe(this.panel);
    window.addEventListener('resize', () => this.resize());
  }

  private key(): string { return `${this.mission}:${this.selectedActor}`; }

  private open(programs: ProgramSources, mission: number): void {
    this.drag.cancel(); this.panel.hidden = false; this.exploration(false);
    this.mission = mission;
    this.sources = {};
    const progress = loadProgress();
    for (const actor of ['moosling', 'glutling'] as const) if (programs[actor] !== undefined) {
      const key = `${mission}:${actor}`;
      this.sources[actor] = this.drafts[key] ?? progress.programs[key] ?? programs[actor];
      const saved = this.workspaceDrafts[key] ?? progress.blockWorkspaces[key];
      try {
        const top = saved ? (JSON.parse(saved) as { blocks?: { blocks?: { type: string }[] } }).blocks?.blocks ?? [] : [];
        this.loose[key] = top.some((block) => block.type !== 'cm_start') || top.filter((block) => block.type === 'cm_start').length > 1;
      } catch { this.loose[key] = true; }
    }
    this.selectedActor = 'moosling';
    this.el('select-glutling').hidden = programs.glutling === undefined;
    this.el('battle-title').textContent = mission === 1 ? 'RUNENSKRIPT – DIE ERSTE SCHLEIFE' : mission === 2 ? 'RUNENSKRIPT – NÄHE PRÜFEN' : 'RUNENSKRIPT – DUO-FORMATION';
    this.el('battle-next-mission').hidden = true;
    this.loadActor(); this.resize();
  }

  private selectActor(actor: ArkanId): void {
    if (this.sources[actor] === undefined || actor === this.selectedActor) return;
    this.capture(); this.drag.cancel(); this.selectedActor = actor; this.loadActor();
  }

  private loadActor(): void {
    this.text.value = this.sources[this.selectedActor] ?? '';
    this.editorMode = 'text';
    const parsed = compileActionPlan(this.text.value, this.selectedActor);
    const mode = parsed.nodes ? loadProgress().editorMode : 'text';
    this.setMode(mode, true);
    this.el('program-owner').textContent = `Programm von ${this.selectedActor === 'moosling' ? 'Moosling' : 'Glutling'}`;
    for (const actor of ['moosling', 'glutling'] as const) {
      this.el(`select-${actor}`).setAttribute('aria-pressed', String(actor === this.selectedActor));
      this.el(`select-${actor}`).classList.toggle('editor-mode-active', actor === this.selectedActor);
    }
    this.renderLibrary();
  }

  private setMode(mode: EditorMode, loading = false): void {
    this.drag.cancel();
    if (!loading && mode === this.editorMode) return;
    if (mode === 'text' && this.editorMode === 'blocks' && this.snap?.hasLooseBlocks()) {
      this.feedback.textContent = 'Verbinde lose Blöcke mit dem Startblock oder lösche sie vor dem Wechsel in den Textmodus.'; return;
    }
    if (!loading) this.capture();
    const parsed = compileActionPlan(this.text.value, this.selectedActor);
    if (mode === 'blocks' && !parsed.nodes) { this.feedback.textContent = parsed.error ?? 'Ungültiger Text.'; return; }
    this.editorMode = mode;
    this.el('block-editor').hidden = mode !== 'blocks'; this.text.hidden = mode !== 'text';
    this.el('editor-columns').classList.toggle('snap-mode', mode === 'blocks');
    for (const option of ['blocks', 'text']) {
      this.el(`${option}-mode`).classList.toggle('editor-mode-active', mode === option);
      this.el(`${option}-mode`).setAttribute('aria-pressed', String(mode === option));
    }
    if (mode === 'blocks') {
      this.snap ??= new SnapEditor(this.el('snap-editor'), () => { if (this.editorMode === 'blocks') this.capture(); });
      const saved = this.workspaceDrafts[this.key()] ?? loadProgress().blockWorkspaces[this.key()];
      try { this.snap.load(parsed.nodes!, this.selectedActor, this.mission, saved || undefined); }
      catch { this.snap.load(parsed.nodes!, this.selectedActor, this.mission); }
      this.capture();
    }
    saveProgress({ editorMode: mode });
    this.resize();
  }

  private capture(): void {
    if (this.editorMode === 'blocks' && this.snap) {
      this.workspaceDrafts[this.key()] = this.snap.save();
      this.loose[this.key()] = this.snap.hasLooseBlocks();
      try {
        this.text.value = this.snap.source();
        if (this.loose[this.key()]) this.feedback.textContent = 'Lose Blöcke werden erst ausgeführt, wenn sie am Startblock eingerastet sind.';
      } catch (error) { this.feedback.textContent = String(error); this.loose[this.key()] = true; }
    }
    this.sources[this.selectedActor] = this.text.value;
    this.drafts[this.key()] = this.text.value;
    saveProgramDraft(this.mission, this.selectedActor, this.text.value);
    saveProgress({ blockWorkspaces: { ...loadProgress().blockWorkspaces, ...this.workspaceDrafts } });
  }

  private execute(event: string): void {
    this.capture();
    if (Object.keys(this.sources).some((actor) => this.loose[`${this.mission}:${actor}`])) { this.feedback.textContent = 'Verbinde zunächst alle losen Blöcke mit dem Startblock oder lösche sie.'; return; }
    gameEvents.emit(event, { ...this.sources });
  }

  private renderLibrary(): void {
    const commands = availableCommands(this.selectedActor, this.mission);
    const categories = COMMAND_CATEGORIES.filter((category) => commands.some((command) => command.category === category.id));
    if (!categories.some((category) => category.id === this.selectedCategory)) this.selectedCategory = categories[0]?.id ?? 'movement';
    this.el('command-categories').replaceChildren(...categories.map((category) => {
      const button = document.createElement('button'); button.type = 'button'; button.id = `category-${category.id}`;
      button.style.setProperty('--category-color', category.color); button.setAttribute('aria-pressed', String(category.id === this.selectedCategory));
      const dot = document.createElement('span'); dot.className = 'category-dot';
      button.append(dot, document.createTextNode(category.label));
      button.addEventListener('click', () => { this.selectedCategory = category.id; this.renderLibrary(); this.el(button.id).focus(); });
      return button;
    }));
    this.el('command-category-title').textContent = categories.find((category) => category.id === this.selectedCategory)?.label ?? '';
    this.el('command-availability').textContent = `Gelernte Befehle für ${this.selectedActor}`;
    this.el('command-entries').replaceChildren(...commands.filter((command) => command.category === this.selectedCategory).map((command) => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.command = command.id;
      const title = document.createElement('strong'); title.textContent = command.label;
      const code = document.createElement('code'); code.textContent = command.syntax(this.selectedActor);
      const description = document.createElement('span'); description.textContent = command.description;
      button.append(title, code, description); button.title = command.description; return button;
    }));
    this.el('editor-tooltip').hidden = true;
  }

  private insertTextCommand(id: string): void {
    const command = availableCommands(this.selectedActor, this.mission).find((entry) => entry.id === id);
    if (!command || this.editorMode !== 'text') return;
    const snippet = commandSource(command, this.selectedActor);
    this.text.setRangeText(`${this.text.value.trim() ? '\n' : ''}${snippet}`, this.text.selectionStart, this.text.selectionEnd, 'end');
    this.workspaceDrafts[this.key()] = ''; this.loose[this.key()] = false; this.capture();
  }

  private update(state: BattleState, feedback: string): void {
    this.feedback.textContent = feedback; this.el('battle-round').textContent = String(state.tick);
    for (const [prefix, actor] of [['player', state.player], ['companion', state.companion], ['enemy', state.enemy]] as const) {
      if (!actor) continue;
      const bar = this.el<HTMLProgressElement>(`${prefix}-health`); bar.max = actor.maxHp; bar.value = actor.hp;
      this.el(`${prefix}-health-text`).textContent = `${actor.hp}/${actor.maxHp}`;
    }
    this.el('companion-health-status').hidden = !state.companion;
    this.el<HTMLButtonElement>('battle-step').disabled = state.outcome !== 'ongoing';
    this.el('battle-log').replaceChildren(...state.log.map((line) => { const item = document.createElement('li'); item.textContent = line; return item; }));
  }

  private exploration(visible: boolean): void { for (const id of ['hud', 'touch-controls', 'interaction-hint']) this.el(id).classList.toggle('screen-hidden', !visible); }
  private resize(): void {
    if (this.panel.hidden) return;
    if (this.editorMode === 'blocks') this.snap?.resize();
    const rect = this.panel.getBoundingClientRect(); if (!rect.width) return;
    const stacked = rect.width > window.innerWidth * .85;
    gameEvents.emit('battle-viewport', { width: stacked ? window.innerWidth : Math.max(1, rect.left - 8), height: stacked ? Math.max(1, rect.top - 8) : window.innerHeight });
  }
  private click(id: string, handler: () => void): void { this.el(id).addEventListener('click', handler); }
  private el<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id); if (!element) throw new Error(`UI-Element #${id} fehlt.`); return element as T;
  }
}
