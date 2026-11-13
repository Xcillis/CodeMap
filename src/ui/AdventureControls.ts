interface AdventureActions { start: () => void; restore: () => void }

/** The player reviews the save change before explicitly starting it. */
export function renderAdventureControls(content: HTMLElement, backup: { arkana: number; quests: number } | undefined, actions: AdventureActions): void {
  const section = document.createElement('section'); section.className = 'adventure-controls';
  const heading = document.createElement('h3'); heading.textContent = 'Dein Abenteuer';
  const intro = document.createElement('p'); intro.textContent = 'Du beginnst ohne Arkana. Glutling findest du zuerst; weitere Arkana begegnen dir später beim Erkunden.';
  const confirmation = document.createElement('div'); confirmation.id = 'adventure-confirmation'; confirmation.hidden = true;
  const message = document.createElement('p'); message.id = 'adventure-confirmation-text';
  const confirm = button('adventure-confirm', '', () => { const action = pending; pending = undefined; if (action) { confirm.disabled = true; action(); } });
  const cancel = button('adventure-cancel', 'Abbrechen', () => { pending = undefined; confirmation.hidden = true; returnFocus?.focus(); });
  let pending: (() => void) | undefined; let returnFocus: HTMLButtonElement | undefined;
  const prepare = (action: () => void, text: string, label: string, source: HTMLButtonElement) => {
    pending = action; returnFocus = source; message.textContent = text; confirm.textContent = label; confirm.disabled = false; confirmation.hidden = false; confirm.focus();
  };
  const start = button('adventure-new', 'Neues Abenteuer', () => prepare(actions.start,
    'Du startest ohne Arkana, Questabschlüsse oder Programme. Dein aktueller Fortschritt wird als Sicherung aufbewahrt; eine frühere Sicherung wird dabei ersetzt. Die Seite wird neu geladen.', 'Sichern & neu beginnen', start));
  section.append(heading, intro, start);
  if (backup) {
    const label = document.createElement('p'); label.textContent = `Gesichert: ${backup.arkana} Arkana · ${backup.quests} abgeschlossene Quests.`;
    const restore = button('adventure-restore', 'Gesicherten Spielstand laden', () => prepare(actions.restore,
      'Die Sicherung wird geladen. Dein aktueller Stand wird stattdessen gesichert, sodass du wieder zu ihm wechseln kannst. Die Seite wird neu geladen.', 'Sicherung laden', restore));
    section.append(label, restore);
  }
  confirmation.append(message, confirm, cancel); section.append(confirmation); content.append(section);
}
function button(id: string, text: string, click: () => void): HTMLButtonElement {
  const element = document.createElement('button'); element.type = 'button'; element.id = id; element.textContent = text; element.addEventListener('click', click); return element;
}
