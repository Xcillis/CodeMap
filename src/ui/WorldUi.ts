import { gameEvents } from '../game/events';
import { ARKANA_SPECIES } from '../gameplay/ArkanaCatalog';
import { Campaign, type CampaignState } from '../gameplay/Campaign';
import { WORLD_QUESTS } from '../gameplay/WorldQuests';
import type { ArkanId } from '../combat/types';
import { CHARACTER_TABS, isCharacterTab, renderCharacterView, type CharacterTab } from './CharacterView';
import { learnedTerms } from '../gameplay/LearningTerms';
import { setLearningText } from './LearningText';

/** Collection and journal are views; ownership and quest validation stay in Campaign. */
export class WorldUi {
  private campaign = new Campaign();
  private tab: CharacterTab | 'journal' | 'training' = 'collection';
  private characterTab: CharacterTab = 'collection';
  private blocked = false;
  private returnFocus?: HTMLElement;
  private readonly panel = this.el('world-panel');
  constructor() {
    this.el('open-collection').addEventListener('click', () => this.open(this.characterTab));
    this.el('open-journal').addEventListener('click', () => this.open('journal'));
    this.el('open-training').addEventListener('click', () => this.open('training'));
    gameEvents.on('world-training-open', () => this.open('training'));
    this.el('world-panel-close').addEventListener('click', () => this.close());
    for (const tab of CHARACTER_TABS) {
      const button = this.el(`character-tab-${tab}`);
      button.addEventListener('click', () => this.selectCharacterTab(tab));
      button.addEventListener('keydown', (event) => {
        const index = CHARACTER_TABS.indexOf(tab);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? CHARACTER_TABS.length - 1
          : event.key === 'ArrowRight' ? (index + 1) % CHARACTER_TABS.length
          : event.key === 'ArrowLeft' ? (index + CHARACTER_TABS.length - 1) % CHARACTER_TABS.length : undefined;
        if (next === undefined) return;
        event.preventDefault(); this.selectCharacterTab(CHARACTER_TABS[next]);
      });
    }
    gameEvents.on('campaign-updated', (state: CampaignState) => { this.campaign = new Campaign(state); this.render(); });
    gameEvents.on('world-notice', (message: string) => { this.el('world-notice').textContent = message; this.el('world-panel-feedback').textContent = message; });
    gameEvents.on('dialog-opened', () => this.setBlocked(true));
    gameEvents.on('dialog-closed', () => this.setBlocked(false));
    gameEvents.on('battle-opened', () => { this.close(); this.setBlocked(true); });
    gameEvents.on('battle-closed', () => this.setBlocked(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.panel.hidden) { event.preventDefault(); this.close(); return; }
      if (!this.panel.hidden && event.key === 'Tab') {
        const buttons = Array.from(this.panel.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]'))
          .filter((element) => element.tabIndex >= 0 && !element.closest('[hidden]'));
        const first = buttons[0]; const last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if (this.blocked || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key.toLowerCase() === 'c') { event.preventDefault(); this.open(this.characterTab); }
      if (event.key.toLowerCase() === 'j') { event.preventDefault(); this.open('journal'); }
    });
    this.render();
  }
  private open(tab: CharacterTab | 'journal' | 'training'): void {
    if (this.blocked) return;
    if (this.panel.hidden) this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.tab = tab; this.panel.hidden = false; this.render(); gameEvents.emit('world-overlay', true);
    this.el('world-panel-feedback').textContent = '';
    this.el('world-panel-close').focus();
  }
  private selectCharacterTab(tab: CharacterTab): void {
    this.tab = tab; this.characterTab = tab; this.render();
    this.el(`character-tab-${tab}`).focus();
  }
  private close(): void {
    if (this.panel.hidden) return;
    this.panel.hidden = true; gameEvents.emit('world-overlay', false); this.returnFocus?.focus();
  }
  private setBlocked(blocked: boolean): void {
    this.blocked = blocked;
    for (const id of ['open-collection', 'open-journal', 'open-training']) (this.el(id) as HTMLButtonElement).disabled = blocked;
  }
  private render(): void {
    const state = this.campaign.snapshot;
    const team = this.campaign.activeTeam;
    this.el('active-team-summary').textContent = `Team ${team.length}/${this.campaign.teamLimit}: ${team.map((item) => ARKANA_SPECIES[item.speciesId].name).join(' → ') || 'noch leer'}`;
    const character = isCharacterTab(this.tab);
    this.el('world-panel-title').textContent = character ? 'Charakter' : this.tab === 'journal' ? 'Questjournal' : 'Freie Trainingsarena';
    const intro = this.tab === 'collection' ? `${state.owned.length} von ${Object.keys(ARKANA_SPECIES).length} Arkana-Arten gesammelt. Hier findest du ihre Eigenschaften und gelernten Fähigkeiten.`
      : this.tab === 'team' ? `${team.length} von ${this.campaign.teamLimit} Teamplätzen belegt. Die ersten Lernquests werden mit Glutling allein gelöst. Im freien Training sind bereits Solo und Duo möglich.`
      : this.tab === 'glossary' ? `${learnedTerms(state.completed).length} Fachbegriffe gelernt. Lies Erklärungen und probiere die Beispiele mit den bereits gelernten Befehlen aus.`
      : this.tab === 'journal' ? this.campaign.objective : 'Alle implementierten Befehle sind hier verfügbar. Das Training verändert weder Lernfreigaben noch Questabschlüsse. Alte Arena-Entwürfe bleiben in den entsprechenden Trainingsaufgaben erhalten.';
    setLearningText(this.el('world-panel-intro'), intro);
    this.el('character-tabs').hidden = !character;
    for (const tab of CHARACTER_TABS) {
      const button = this.el(`character-tab-${tab}`);
      button.setAttribute('aria-selected', String(tab === this.tab)); button.tabIndex = tab === this.tab ? 0 : -1;
    }
    const content = this.el('world-panel-content'); content.replaceChildren();
    content.setAttribute('role', character ? 'tabpanel' : 'region');
    content.setAttribute('aria-labelledby', character ? `character-tab-${this.tab}` : 'world-panel-title');
    content.tabIndex = character ? 0 : -1;
    if (isCharacterTab(this.tab)) {
      renderCharacterView(content, this.tab, this.campaign, {
        toggleTeam: (id) => { gameEvents.emit('team-toggle', id); }, selectTab: (tab) => this.selectCharacterTab(tab),
      }); return;
    }
    if (this.tab === 'training') { this.renderTraining(content); return; }
    for (const [index, quest] of WORLD_QUESTS.entries()) {
      const card = document.createElement('article'); card.className = 'journal-card';
      const heading = document.createElement('h3'); heading.textContent = quest.title; card.append(heading);
      const discovered = state.discovered.includes(quest.id); const completed = state.completed.includes(quest.id);
      const error = this.campaign.missionError(quest.id);
      const offer = this.campaign.lessonOffer(quest.id);
      card.append(this.paragraph(completed ? 'Abgeschlossen' : discovered ? 'Entdeckt' : 'Noch nicht entdeckt'), this.paragraph(`Fundort: ${quest.target}`));
      if (discovered && (index === 0 || state.completed.includes(WORLD_QUESTS[index - 1].id))) card.append(this.paragraph(quest.introduction));
      if (error) card.append(this.paragraph(error));
      const button = document.createElement('button'); button.type = 'button'; button.id = `journal-quest-${quest.id}`;
      button.textContent = offer.action?.startsWith('prepare-lesson:') ? 'Glutling wählen & starten' : completed ? 'Erneut spielen' : 'Quest starten'; button.disabled = !offer.action;
      button.addEventListener('click', () => { if (offer.action) { this.close(); gameEvents.emit('campaign-action', offer.action); } });
      card.append(button); content.append(card);
    }
  }
  private renderTraining(content: HTMLElement): void {
    const owned = this.campaign.snapshot.owned;
    if (!owned.length) { content.append(this.paragraph('Finde zuerst Glutling und nimm es in deine Sammlung auf.')); return; }
    const form = document.createElement('form'); form.className = 'training-setup';
    const label = document.createElement('label'); label.htmlFor = 'training-preset'; label.textContent = 'Trainingsaufgabe';
    const preset = document.createElement('select'); preset.id = 'training-preset';
    for (const [value, title] of [['1', 'Solo · passives Konstrukt'], ['2', 'Solo · aktives Konstrukt'], ['3', 'Duo · passives Konstrukt']]) {
      const option = document.createElement('option'); option.value = value; option.textContent = title; preset.append(option);
    }
    const roster = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.textContent = 'Arkana für diesen Versuch'; roster.append(legend);
    const picks: { actor: ArkanId; input: HTMLInputElement }[] = [];
    for (const [index, item] of owned.entries()) {
      const choice = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.value = item.speciesId;
      input.checked = index === 0; input.id = `training-${item.speciesId}`;
      choice.append(input, document.createTextNode(` ${ARKANA_SPECIES[item.speciesId].name}`)); roster.append(choice); picks.push({ actor: item.speciesId, input });
    }
    const button = document.createElement('button'); button.type = 'submit'; button.id = 'training-launch'; button.textContent = 'Training starten';
    const feedback = this.paragraph(''); feedback.setAttribute('role', 'status');
    form.append(label, preset, roster, this.paragraph('Solo: ein Arkana auswählen. Duo: beide auswählen; sie handeln in der oben angezeigten Reihenfolge.'), button, feedback);
    form.addEventListener('submit', (event) => {
      event.preventDefault(); const team = picks.filter((pick) => pick.input.checked).map((pick) => pick.actor);
      const mission = Number(preset.value);
      if (team.length !== (mission === 3 ? 2 : 1)) { feedback.textContent = mission === 3 ? 'Wähle zwei Arkana für das Duo-Training.' : 'Wähle genau ein Arkana für das Solo-Training.'; return; }
      this.close(); gameEvents.emit('training-start', mission, team);
    });
    content.append(form);
  }
  private paragraph(text: string): HTMLParagraphElement { const p = document.createElement('p'); setLearningText(p, text); return p; }
  private el(id: string): HTMLElement { const el = document.getElementById(id); if (!el) throw new Error(`UI-Element #${id} fehlt.`); return el; }
}
