import type { Campaign } from '../gameplay/Campaign';
import { WORLD_QUESTS, type CampaignAction } from '../gameplay/WorldQuests';
import { QUEST_GIVERS, QUEST_ROUTES, giverLessons, type QuestGiverId } from '../gameplay/QuestNetwork';
import { REGIONS, type RegionId } from '../gameplay/WorldRegions';
import { setLearningText } from './LearningText';

const paragraph = (text: string) => { const p = document.createElement('p'); setLearningText(p, text); return p; };
export function renderQuestBoard(content: HTMLElement, campaign: Campaign, choose: (action: CampaignAction) => void, giver?: QuestGiverId): void {
  const state = campaign.snapshot;
  for (const region of ['valley', 'forest'] as const satisfies readonly RegionId[]) {
    const quests = WORLD_QUESTS.filter((quest) => QUEST_ROUTES[quest.id].region === region && (!giver || giverLessons(giver).includes(quest.id)));
    if (!quests.length) continue;
    const section = document.createElement('section'); section.className = 'quest-region-section';
    const heading = document.createElement('h3'); heading.textContent = `${REGIONS[region].name}${region === state.region ? ' · Hier bist du' : region === 'forest' && !campaign.forestUnlocked ? ' · Zugang gesperrt' : ' · Reise erforderlich'}`;
    section.append(heading, paragraph(REGIONS[region].theme));
    if (region === 'forest' && state.legacyForestAccess) section.append(paragraph('Dein bereits freigeschalteter Waldzugang aus dem bisherigen Spielstand bleibt erhalten. Die neuen Talaufgaben werden dadurch nicht als bestanden markiert.'));
    if (region !== state.region && campaign.forestUnlocked) {
      const travel = document.createElement('button'); travel.type = 'button'; travel.id = `travel-${region}`; travel.textContent = `Nach ${REGIONS[region].name} reisen`;
      travel.addEventListener('click', () => choose(region === 'forest' ? 'travel-forest' : 'travel-valley')); section.append(travel);
    }
    const grid = document.createElement('div'); grid.className = 'quest-board-grid'; section.append(grid);
    for (const quest of quests) {
      const route = QUEST_ROUTES[quest.id]; const person = QUEST_GIVERS[route.giver];
      const card = document.createElement('article'); card.className = 'journal-card';
      const title = document.createElement('h4'); title.textContent = quest.title;
      const completed = state.completed.includes(quest.id); const discovered = state.discovered.includes(quest.id);
      const error = campaign.missionError(quest.id); const offer = campaign.lessonOffer(quest.id);
      card.append(title, paragraph(route.role), paragraph(completed ? 'Abgeschlossen' : offer.action ? 'Bereit · frei wählbar' : discovered ? 'Entdeckt · Voraussetzung noch offen' : 'Noch nicht entdeckt'),
        paragraph(`Questgeber: ${person.name} · ${REGIONS[region].name}`), paragraph(`Aufgabenraum: ${quest.target}`));
      if (discovered && campaign.questReady(quest.id)) {
        const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Aufgabe & Einführung'; details.append(summary, paragraph(quest.introduction)); card.append(details);
      }
      if (error) card.append(paragraph(error));
      const button = document.createElement('button'); button.type = 'button'; button.id = `journal-quest-${quest.id}`;
      button.textContent = offer.action?.startsWith('prepare-lesson:') ? offer.actionLabel?.replace('Quest starten', 'starten') ?? 'Team wählen & starten' : completed ? 'Erneut spielen' : 'Einführung annehmen';
      button.disabled = !offer.action; button.addEventListener('click', () => { if (offer.action) choose(offer.action); });
      card.append(button); grid.append(card);
    }
    content.append(section);
  }
}
