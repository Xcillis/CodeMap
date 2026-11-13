import { ARKANA_SPECIES, ARKANA_TYPES, SKILL_NAMES, type OwnedArkana } from '../gameplay/ArkanaCatalog';
import { Campaign } from '../gameplay/Campaign';
import { learnedTerms } from '../gameplay/LearningTerms';
import { setLearningText } from './LearningText';

export const CHARACTER_TABS = ['collection', 'team', 'glossary'] as const;
export type CharacterTab = typeof CHARACTER_TABS[number];
export const isCharacterTab = (value: unknown): value is CharacterTab => CHARACTER_TABS.some((tab) => tab === value);

interface CharacterActions { toggleTeam: (id: string) => void; selectTab: (tab: CharacterTab) => void }
function paragraph(text: string): HTMLParagraphElement { const p = document.createElement('p'); setLearningText(p, text); return p; }
function heading(text: string): HTMLHeadingElement { const h = document.createElement('h3'); h.textContent = text; return h; }
function teamButton(owned: OwnedArkana, label: string, actions: CharacterActions): HTMLButtonElement {
  const button = document.createElement('button'); button.type = 'button'; button.id = `team-${owned.speciesId}`; button.textContent = label;
  button.addEventListener('click', () => { actions.toggleTeam(owned.id); document.getElementById(button.id)?.focus(); });
  return button;
}

/** Stateless views keep collection details separate from active team management. */
export function renderCharacterView(content: HTMLElement, tab: CharacterTab, campaign: Campaign, actions: CharacterActions): void {
  const state = campaign.snapshot;
  if (tab === 'collection') {
    if (!state.owned.length) content.append(paragraph('Deine Sammlung ist noch leer. Sprich mit Eldren und suche Glutling am westlichen Akademieweg.'));
    for (const owned of state.owned) {
      const species = ARKANA_SPECIES[owned.speciesId]; const index = state.team.indexOf(owned.id);
      const card = document.createElement('article'); card.className = `collection-card type-${species.type}`;
      card.append(heading(`${species.name} · ${ARKANA_TYPES[species.type].name}`),
        paragraph(`${species.maxHp} Lebenspunkte · ${owned.learned.includes('attack') ? `${species.attack} Angriffsschaden` : 'Angreifen noch nicht gelernt'}`),
        paragraph(`Stärke: ${species.strength}`), paragraph(`Schwäche: ${species.weakness}`),
        paragraph(`Gelernte Befehle: ${owned.learned.map((skill) => SKILL_NAMES[skill]).join(', ')}`),
        paragraph(`Später vorgesehen: ${species.plannedAbilities.join(', ')}. Diese Spezialfähigkeiten sind noch nicht freigeschaltet.`),
        paragraph(index >= 0 ? `Aktiv · Teamplatz ${index + 1}` : 'In der Sammlung'));
      content.append(card);
    }
  } else if (tab === 'team') {
    const section = document.createElement('section'); section.className = 'team-overview';
    section.append(heading(`Aktuelles Team · ${state.team.length}/${campaign.teamLimit}`), paragraph('Die Reihenfolge bestimmt, welches Arkana zuerst handelt. Für die ersten Lernquests spielt Glutling allein.'));
    const active = document.createElement('ol'); active.id = 'team-active-members'; active.className = 'team-members';
    for (const [index, owned] of campaign.activeTeam.entries()) {
      const species = ARKANA_SPECIES[owned.speciesId]; const card = document.createElement('li'); card.className = `team-card type-${species.type}`;
      card.append(heading(`Platz ${index + 1}: ${species.name}`), paragraph(`${ARKANA_TYPES[species.type].name} · ${species.maxHp} Lebenspunkte`), teamButton(owned, 'Aus dem Team nehmen', actions)); active.append(card);
    }
    if (!state.team.length) section.append(paragraph('Dein Team ist noch leer. Wähle unten ein gesammeltes Arkana aus.'));
    section.append(active, heading('Weitere gesammelte Arkana'));
    const reserve = document.createElement('div'); reserve.id = 'team-reserve-members'; reserve.className = 'team-members';
    for (const owned of state.owned.filter((item) => !state.team.includes(item.id))) {
      const species = ARKANA_SPECIES[owned.speciesId]; const card = document.createElement('article'); card.className = 'team-card';
      card.append(heading(species.name), paragraph('In der Sammlung'), teamButton(owned, campaign.teamLimit === 1 ? 'Aktiv setzen' : 'Ins Team nehmen', actions)); reserve.append(card);
    }
    if (!reserve.childElementCount) reserve.append(paragraph(state.owned.length ? 'Alle gesammelten Arkana sind bereits im Team.' : 'Noch keine Arkana gesammelt.'));
    section.append(reserve);
    if (!state.owned.length) {
      section.append(paragraph('Entdecke zuerst Glutling in der Spielwelt.'));
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Zur Sammlung'; button.addEventListener('click', () => actions.selectTab('collection')); section.append(button);
    }
    content.append(section);
  } else {
    const terms = learnedTerms(state.completed);
    if (!terms.length) content.append(paragraph('Dein Nachschlagebuch ist noch leer. Nach einer abgeschlossenen Lernquest findest du hier die gelernten Fachbegriffe mit Erklärungen und Beispielen.'));
    for (const term of terms) {
      const card = document.createElement('article'); card.className = 'glossary-card'; card.dataset.term = term.id;
      const category = paragraph(term.category); category.className = 'eyebrow';
      const example = paragraph('Beispiel'); example.className = 'glossary-example-label';
      const pre = document.createElement('pre'); const code = document.createElement('code'); code.textContent = term.code; pre.append(code);
      card.append(category, heading(term.label), paragraph(term.explanation), example, paragraph(term.example), pre); content.append(card);
      for (const further of term.furtherExamples ?? []) {
        const title = paragraph(further.title); title.className = 'glossary-example-label';
        const pre = document.createElement('pre'); const code = document.createElement('code'); code.textContent = further.code; pre.append(code);
        card.append(title, paragraph(further.example), pre);
      }
    }
  }
}
