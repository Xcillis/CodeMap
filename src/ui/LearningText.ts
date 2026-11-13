import { LEARNING_TERMS } from '../gameplay/LearningTerms';

const aliases = LEARNING_TERMS.flatMap((term) => term.aliases.map((label) => ({ label, term })));
const escaped = aliases.map(({ label }) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
const termPattern = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${escaped.join('|')})(?![\\p{L}\\p{N}_])`, 'giu');

/** Keeps all content as text nodes; lesson strings are never parsed as HTML. */
export function setLearningText(element: HTMLElement, text: string): void {
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  for (const match of text.matchAll(termPattern)) {
    const start = match.index;
    fragment.append(document.createTextNode(text.slice(cursor, start)));
    const strong = document.createElement('strong'); strong.className = 'learning-term'; strong.textContent = match[0];
    const term = aliases.find(({ label }) => label.toLocaleLowerCase('de') === match[0].toLocaleLowerCase('de'))?.term;
    if (term) strong.dataset.term = term.id;
    fragment.append(strong); cursor = start + match[0].length;
  }
  fragment.append(document.createTextNode(text.slice(cursor)));
  element.replaceChildren(fragment);
}
