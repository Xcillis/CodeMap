import type { LessonId } from './WorldQuests';

export interface LearningTerm {
  id: string;
  label: string;
  aliases: readonly string[];
  lesson: LessonId;
  category: 'Programmieren' | 'Spielwelt';
  explanation: string;
  example: string;
  code: string;
}

/** Explanations describe observable actions before naming an abstract concept. */
export const LEARNING_TERMS: readonly LearningTerm[] = [
  { id: 'instruction', label: 'Anweisung', aliases: ['Anweisung', 'Anweisungen'], lesson: 'q01-glutspur', category: 'Programmieren',
    explanation: 'Du sagst Glutling mit einem Befehl, was es tun soll. Ein solcher einzelner Befehl heißt Anweisung.',
    example: '„Gehe nach rechts“ bewegt Glutling genau ein Feld nach rechts.', code: 'glutling.moveRight();' },
  { id: 'sequence', label: 'Sequenz', aliases: ['Sequenz', 'Sequenzen'], lesson: 'q01-glutspur', category: 'Programmieren',
    explanation: 'Glutling führt mehrere Befehle nacheinander aus, von oben nach unten. Eine solche geordnete Befehlsfolge heißt Sequenz. Eine andere Reihenfolge kann zu einem anderen Ergebnis führen.',
    example: 'Glutling geht zuerst zweimal nach rechts und danach einmal nach oben.', code: 'glutling.moveRight();\nglutling.moveRight();\nglutling.moveUp();' },
  { id: 'health', label: 'Lebenspunkte', aliases: ['Lebenspunkte', 'Lebenspunkt', 'LP'], lesson: 'q02-basisangriff', category: 'Spielwelt',
    explanation: 'Die Zahl der Lebenspunkte zeigt, wie viel Schaden ein Wesen noch aushält. Die Abkürzung ist LP. Bei 0 LP ist das Übungskonstrukt ausgeschaltet.',
    example: 'Das Konstrukt beginnt mit 4 LP. Glutlings Angriff zieht ihm 2 LP ab. Danach bleiben 2 LP übrig.', code: 'glutling.attack();' },
  { id: 'loop', label: 'Schleife', aliases: ['Schleife', 'Schleifen'], lesson: 'q03-wiederkehr', category: 'Programmieren',
    explanation: 'Du kannst Befehle automatisch mehrmals ausführen lassen. Das nennt man eine Schleife. Die Zahl beim Wiederholen legt fest, wie oft die Befehle im Inneren ausgeführt werden.',
    example: 'Dieser Wiederholungsblock lässt Glutling dreimal einen Schritt nach rechts gehen.', code: 'repeat(3, () => {\n  glutling.moveRight();\n});' },
];

export function learnedTerms(completed: readonly LessonId[]): readonly LearningTerm[] {
  return LEARNING_TERMS.filter((term) => completed.includes(term.lesson));
}
