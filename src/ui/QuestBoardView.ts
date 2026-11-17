import type { Campaign } from '../gameplay/Campaign';
import { getLesson, type LessonId, type CampaignAction } from '../gameplay/WorldQuests';
import { QUEST_GIVERS, QUEST_ROUTES, type QuestGiverId } from '../gameplay/QuestNetwork';
import { QUEST_SERIES, giverProgress, type QuestSeries } from '../gameplay/QuestProgress';
import { REGIONS, type RegionId } from '../gameplay/WorldRegions';
import { setLearningText } from './LearningText';

const paragraph = (text: string, className = '') => { const p = document.createElement('p'); p.className = className; setLearningText(p, text); return p; };
type InspectQuest = (id: LessonId) => void;
function revealQuest(content: HTMLElement, id: LessonId): void {
  const card = content.querySelector<HTMLElement>(`[data-quest="${id}"]`); if (!card) return;
  for (let parent = card.parentElement; parent && parent !== content; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true;
  card.focus();
}

function requirements(id: LessonId, completed: readonly LessonId[], inspect: InspectQuest): HTMLElement | undefined {
  const route = QUEST_ROUTES[id]; if (!route.all.length && !route.any?.length) return;
  const details = document.createElement('details'); details.className = 'quest-requirements';
  const summary = document.createElement('summary');
  const count = route.all.filter((prior) => completed.includes(prior)).length + Number(Boolean(route.any?.some((prior) => completed.includes(prior))));
  summary.textContent = `Vorher abschließen · ${count}/${route.all.length + Number(Boolean(route.any?.length))} erfüllt`;
  const list = document.createElement('ul');
  const item = (prior: LessonId) => {
    const li = document.createElement('li'); const done = completed.includes(prior); const giver = QUEST_GIVERS[QUEST_ROUTES[prior].giver];
    li.className = done ? 'requirement-done' : 'requirement-missing';
    const label = `${done ? '✓ Erledigt' : 'Noch offen'}: ${getLesson(prior).title} · ${giver.name} · ${REGIONS[QUEST_ROUTES[prior].region].name}`;
    if (done) li.textContent = label;
    else { const link = document.createElement('button'); link.type = 'button'; link.className = 'quest-reference'; link.textContent = label; link.addEventListener('click', () => inspect(prior)); li.append(link); }
    return li;
  };
  for (const prior of route.all) list.append(item(prior));
  if (route.any?.length) {
    const choice = document.createElement('li'); choice.append(document.createTextNode('Eine dieser Aufgaben genügt:'));
    const alternatives = document.createElement('ul'); for (const prior of route.any) alternatives.append(item(prior)); choice.append(alternatives); list.append(choice);
  }
  details.append(summary, list); return details;
}

function questCard(id: LessonId, campaign: Campaign, choose: (action: CampaignAction) => void, next: LessonId | undefined, inspect: InspectQuest): HTMLElement {
  const quest = getLesson(id); const route = QUEST_ROUTES[id]; const state = campaign.snapshot; const person = QUEST_GIVERS[route.giver];
  const completed = state.completed.includes(id); const discovered = state.discovered.includes(id); const error = campaign.missionError(id); const offer = campaign.lessonOffer(id);
  const status = completed ? 'complete' : offer.action ? 'ready' : 'locked';
  const card = document.createElement('article'); card.className = `journal-card quest-${status}${id === next ? ' quest-next' : ''}`; card.dataset.quest = id; card.tabIndex = -1;
  const title = document.createElement('h6'); title.className = 'quest-card-title'; title.id = `quest-title-${id}`; title.textContent = quest.title; card.setAttribute('aria-labelledby', title.id);
  card.append(paragraph(completed ? '✓ Abgeschlossen' : id === next ? '▶ Als Nächstes verfügbar' : offer.action ? '▶ Bereit · frei wählbar' : 'Gesperrt · Vorbereitung nötig', 'quest-state'), title, paragraph(route.role));
  const prerequisites = requirements(id, state.completed, inspect);
  if (prerequisites) { if (prerequisites instanceof HTMLDetailsElement && !completed && !offer.action) prerequisites.open = true; card.append(prerequisites); }
  if (!offer.action && error) card.append(paragraph(error, 'quest-blocked-reason'));
  const info = document.createElement('details'); const intro = document.createElement('summary'); intro.textContent = completed ? 'Details & erneut spielen' : 'Aufgabe & Einführung'; info.append(intro);
  info.append(paragraph(`Questgeber: ${person.name} · ${REGIONS[route.region].name}`), paragraph(`Aufgabenraum: ${quest.target}`));
  if (discovered && campaign.questReady(id)) info.append(paragraph(quest.introduction));
  if (offer.action && error) info.append(paragraph(error));
  const button = document.createElement('button'); button.type = 'button'; button.id = `journal-quest-${id}`;
  button.textContent = completed ? 'Erneut spielen' : offer.action?.startsWith('prepare-lesson:') ? offer.actionLabel?.replace('Quest starten', 'starten') ?? 'Team wählen & starten' : 'Einführung annehmen';
  button.disabled = !offer.action; button.addEventListener('click', () => { if (offer.action) choose(offer.action); });
  card.append(info, button);
  return card;
}

function renderSeries(series: QuestSeries, campaign: Campaign, choose: (action: CampaignAction) => void, next: LessonId | undefined, pending: LessonId | undefined, inspect: InspectQuest): HTMLElement {
  const state = campaign.snapshot; const section = document.createElement('section'); section.className = 'quest-series'; section.dataset.series = series.id;
  const title = document.createElement('h5'); title.textContent = series.title; section.append(title); if (series.note) section.append(paragraph(series.note));
  const stages = document.createElement('ol'); stages.className = 'quest-stages';
  series.stages.forEach((stage, index) => {
    const complete = stage.quests.filter((id) => state.completed.includes(id)).length; const allComplete = complete === stage.quests.length;
    const ready = stage.quests.some((id) => !state.completed.includes(id) && Boolean(campaign.lessonOffer(id).action));
    const li = document.createElement('li'); const details = document.createElement('details'); details.className = `quest-stage${allComplete ? ' stage-complete' : ''}${next && stage.quests.includes(next) ? ' stage-current' : ''}`;
    details.open = !allComplete && (Boolean(pending && stage.quests.includes(pending)) || ready);
    const summary = document.createElement('summary'); const number = document.createElement('span'); number.className = 'quest-step-number'; number.textContent = allComplete ? '✓' : String(index + 1);
    const name = document.createElement('span'); name.textContent = `Schritt ${index + 1}: ${stage.title}`;
    const count = document.createElement('span'); count.className = 'quest-step-count'; count.textContent = `${complete}/${stage.quests.length} abgeschlossen · ${allComplete ? 'Erledigt' : ready ? 'Bereit' : 'Gesperrt'}`;
    summary.append(number, name, count); details.append(summary);
    if (allComplete) {
      const replay = document.createElement('div'); replay.className = 'quest-replay-actions';
      for (const id of stage.quests) {
        const offer = campaign.lessonOffer(id); const button = document.createElement('button'); button.type = 'button';
        button.textContent = `Erneut spielen: ${getLesson(id).title}`; button.disabled = !offer.action;
        button.addEventListener('click', () => { if (offer.action) choose(offer.action); }); replay.append(button);
        if (!offer.action) {
          const reason = paragraph(campaign.missionError(id) ?? 'Beende zuerst die laufende Begegnung.', 'quest-blocked-reason');
          reason.id = `replay-reason-${id}`; button.setAttribute('aria-describedby', reason.id); replay.append(reason);
        }
      }
      li.append(replay);
    }
    if (stage.note) details.append(paragraph(stage.note, 'quest-stage-note'));
    const grid = document.createElement('div'); grid.className = 'quest-board-grid';
    for (const id of stage.quests) grid.append(questCard(id, campaign, choose, next, inspect));
    details.append(grid); li.prepend(details); stages.append(li);
  });
  section.append(stages); return section;
}

export function renderQuestBoard(content: HTMLElement, campaign: Campaign, choose: (action: CampaignAction) => void, giver?: QuestGiverId, inspectQuest?: InspectQuest): void {
  const state = campaign.snapshot; const inspect = inspectQuest ?? ((id) => revealQuest(content, id));
  if (state.region === 'village' && !giver) {
    content.append(paragraph(state.interior ? 'Du bist in einem Haus in Auenquell. Verlasse es durch die südliche Tür, um wieder zur Spielwelt und zu den bisherigen Lernquests zu gelangen.' : 'Du bist in Auenquell. Gasthaus, Werkstatt und Bibliothek sind betretbar. Die bisherigen Lernquests erreichst du über den Rückweg in den Aetherwald.'));
  }
  for (const region of ['valley', 'forest'] as const satisfies readonly RegionId[]) {
    const people = (Object.keys(QUEST_GIVERS) as QuestGiverId[]).filter((id) => QUEST_GIVERS[id].region === region && (!giver || id === giver));
    if (!people.length) continue;
    const section = document.createElement('section'); section.className = 'quest-region-section';
    const heading = document.createElement('h3'); heading.textContent = `${REGIONS[region].name}${region === state.region ? ' · Hier bist du' : region === 'forest' && !campaign.forestUnlocked ? ' · Zugang gesperrt' : ' · Reise erforderlich'}`;
    section.append(heading, paragraph(REGIONS[region].theme));
    if (region === 'forest' && state.legacyForestAccess) section.append(paragraph('Dein bereits freigeschalteter Waldzugang aus dem bisherigen Spielstand bleibt erhalten. Die neuen Talaufgaben werden dadurch nicht als bestanden markiert.'));
    if (region !== state.region && campaign.forestUnlocked && !state.interior && !(state.region === 'village' && region === 'valley')) {
      const travel = document.createElement('button'); travel.type = 'button'; travel.id = `travel-${region}`; travel.textContent = `Nach ${REGIONS[region].name} reisen`;
      travel.addEventListener('click', () => choose(region === 'forest' ? 'travel-forest' : 'travel-valley')); section.append(travel);
    }
    for (const person of people) {
      const progress = giverProgress(campaign, person); const group = document.createElement('section'); group.className = 'quest-giver-section'; group.dataset.giver = person;
      const title = document.createElement('h4'); title.textContent = QUEST_GIVERS[person].name;
      const summary = document.createElement('div'); summary.className = 'quest-progress-summary';
      const meter = document.createElement('progress'); meter.max = progress.total; meter.value = progress.completed; meter.setAttribute('aria-label', `${QUEST_GIVERS[person].name}: ${progress.completed} von ${progress.total} Quests abgeschlossen`);
      summary.append(title, paragraph(`${progress.completed} von ${progress.total} Quests abgeschlossen · ${progress.ready.length} bereit`), meter); group.append(summary);
      const focusId = progress.next ?? progress.pending;
      if (focusId) {
        const spotlight = document.createElement('div'); spotlight.className = 'quest-next-summary';
        spotlight.append(paragraph(`${progress.next ? 'Als Nächstes verfügbar' : 'Nächster Schritt vorbereiten'}: ${getLesson(focusId).title}`));
        if (progress.next) spotlight.append(paragraph('Das ist eine Empfehlung. Andere bereite Wahlquests kannst du ebenfalls starten.'));
        else spotlight.append(paragraph(campaign.missionError(focusId) ?? 'Schließe zuerst die angezeigten Voraussetzungen ab.'));
        const go = document.createElement('button'); go.type = 'button'; go.textContent = 'Zur Quest'; go.addEventListener('click', () => revealQuest(content, focusId)); spotlight.append(go); group.append(spotlight);
      } else group.append(paragraph('✓ Alle Aufgaben bei diesem Questgeber abgeschlossen. Deine Lösungen kannst du weiterhin erneut spielen.', 'quest-all-complete'));
      for (const series of QUEST_SERIES.filter((item) => item.giver === person)) group.append(renderSeries(series, campaign, choose, progress.next, progress.pending, inspect));
      section.append(group);
    }
    content.append(section);
  }
}
