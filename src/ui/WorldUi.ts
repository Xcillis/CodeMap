import { gameEvents } from '../game/events';
import { ARKANA_SPECIES, ARKANA_TYPES, SKILL_NAMES } from '../gameplay/ArkanaCatalog';
import { Campaign, type CampaignState } from '../gameplay/Campaign';
import { WORLD_QUESTS } from '../gameplay/WorldQuests';

/** Collection and journal are views; ownership and quest validation stay in Campaign. */
export class WorldUi {
  private campaign = new Campaign();
  private tab: 'collection' | 'journal' = 'collection';
  private blocked = false;
  private returnFocus?: HTMLElement;
  private readonly panel = this.el('world-panel');
  constructor() {
    this.el('open-collection').addEventListener('click', () => this.open('collection'));
    this.el('open-journal').addEventListener('click', () => this.open('journal'));
    this.el('world-panel-close').addEventListener('click', () => this.close());
    gameEvents.on('campaign-updated', (state: CampaignState) => { this.campaign = new Campaign(state); this.render(); });
    gameEvents.on('world-notice', (message: string) => { this.el('world-notice').textContent = message; this.el('world-panel-feedback').textContent = message; });
    gameEvents.on('dialog-opened', () => this.setBlocked(true));
    gameEvents.on('dialog-closed', () => this.setBlocked(false));
    gameEvents.on('battle-opened', () => { this.close(); this.setBlocked(true); });
    gameEvents.on('battle-closed', () => this.setBlocked(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.panel.hidden) { event.preventDefault(); this.close(); return; }
      if (!this.panel.hidden && event.key === 'Tab') {
        const buttons = Array.from(this.panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        const first = buttons[0]; const last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if (this.blocked || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key.toLowerCase() === 'c') { event.preventDefault(); this.open('collection'); }
      if (event.key.toLowerCase() === 'j') { event.preventDefault(); this.open('journal'); }
    });
    this.render();
  }
  private open(tab: 'collection' | 'journal'): void {
    if (this.blocked) return;
    if (this.panel.hidden) this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.tab = tab; this.panel.hidden = false; this.render(); gameEvents.emit('world-overlay', true);
    this.el('world-panel-feedback').textContent = '';
    this.el('world-panel-close').focus();
  }
  private close(): void {
    if (this.panel.hidden) return;
    this.panel.hidden = true; gameEvents.emit('world-overlay', false); this.returnFocus?.focus();
  }
  private setBlocked(blocked: boolean): void {
    this.blocked = blocked;
    for (const id of ['open-collection', 'open-journal']) (this.el(id) as HTMLButtonElement).disabled = blocked;
  }
  private render(): void {
    const state = this.campaign.snapshot;
    const team = this.campaign.activeTeam;
    this.el('active-team-summary').textContent = `Team ${team.length}/${this.campaign.teamLimit}: ${team.map((item) => ARKANA_SPECIES[item.speciesId].name).join(' → ') || 'noch leer'}`;
    this.el('world-panel-title').textContent = this.tab === 'collection' ? 'Arkana-Sammlung & Team' : 'Questjournal';
    this.el('world-panel-intro').textContent = this.tab === 'collection'
      ? `${state.owned.length} von ${Object.keys(ARKANA_SPECIES).length} Arten entdeckt. ${this.campaign.teamLimit} aktive Teamplätze. Der zweite Platz wird nach „Das wandernde Konstrukt“ frei. Die Reihenfolge im Team bestimmt die Aktionsreihenfolge.`
      : this.campaign.objective;
    const content = this.el('world-panel-content'); content.replaceChildren();
    if (this.tab === 'collection') {
      if (!state.owned.length) content.append(this.paragraph('Deine Sammlung ist noch leer. Sprich mit Eldren und suche Moosling am westlichen Runenpfad.'));
      for (const owned of state.owned) {
        const species = ARKANA_SPECIES[owned.speciesId];
        const card = document.createElement('article'); card.className = `collection-card type-${species.type}`;
        const heading = document.createElement('h3'); heading.textContent = `${species.name} · ${ARKANA_TYPES[species.type].name}`; card.append(heading);
        card.append(this.paragraph(`${species.maxHp} LP · ${species.attack} Angriffsschaden`), this.paragraph(`Stärke: ${species.strength}`), this.paragraph(`Schwäche: ${species.weakness}`),
          this.paragraph(`Gelernt: ${owned.learned.map((skill) => SKILL_NAMES[skill]).join(', ')}`),
          this.paragraph(`Später vorgesehen: ${species.plannedAbilities.join(', ')}. Diese Spezialfähigkeiten sind noch nicht freigeschaltet.`));
        const index = state.team.indexOf(owned.id);
        card.append(this.paragraph(index >= 0 ? `Aktiv · Teamplatz ${index + 1}` : 'In der Sammlung'));
        const button = document.createElement('button'); button.type = 'button'; button.id = `team-${owned.speciesId}`;
        button.textContent = index >= 0 ? 'Aus dem Team nehmen' : this.campaign.teamLimit === 1 ? 'Aktiv setzen' : 'Ins Team nehmen';
        button.addEventListener('click', () => { gameEvents.emit('team-toggle', owned.id); document.getElementById(button.id)?.focus(); });
        card.append(button); content.append(card);
      }
    } else for (const quest of WORLD_QUESTS) {
      const card = document.createElement('article'); card.className = 'journal-card';
      const heading = document.createElement('h3'); heading.textContent = quest.title; card.append(heading);
      const discovered = state.discovered.includes(quest.id); const completed = state.completed.includes(quest.id);
      const error = this.campaign.missionError(quest.id);
      card.append(this.paragraph(completed ? 'Abgeschlossen' : discovered ? 'Entdeckt' : 'Noch nicht entdeckt'), this.paragraph(`Fundort: ${quest.target}`), this.paragraph(quest.introduction));
      if (error) card.append(this.paragraph(error));
      const button = document.createElement('button'); button.type = 'button'; button.id = `journal-quest-${quest.id}`;
      button.textContent = completed ? 'Erneut spielen' : 'Quest starten'; button.disabled = Boolean(error);
      button.addEventListener('click', () => { this.close(); gameEvents.emit('campaign-action', `quest-${quest.id}`); });
      card.append(button); content.append(card);
    }
  }
  private paragraph(text: string): HTMLParagraphElement { const p = document.createElement('p'); p.textContent = text; return p; }
  private el(id: string): HTMLElement { const el = document.getElementById(id); if (!el) throw new Error(`UI-Element #${id} fehlt.`); return el; }
}
