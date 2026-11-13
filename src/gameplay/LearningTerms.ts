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
  furtherExamples?: readonly { lesson: LessonId; title: string; example: string; code: string }[];
}

/** Explanations describe observable actions before naming an abstract concept. */
const adaptiveExample = { lesson: 'q06-waechter' as const, title: 'Bei jedem Durchlauf neu entscheiden',
  example: 'Der Wächter kommt näher. Bei jedem Durchlauf fragt Glutling erneut nach der Entfernung. Zuerst geht es näher heran, später greift es an. Die Bedingung steht deshalb im Schleifenrumpf.',
  code: 'repeat(5, () => {\n  if (glutling.enemyAdjacent) {\n    glutling.attack();\n  } else {\n    glutling.moveForward();\n  }\n});' };

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
    example: 'Dieser Wiederholungsblock lässt Glutling dreimal einen Schritt nach rechts gehen.', code: 'repeat(3, () => {\n  glutling.moveRight();\n});',
    furtherExamples: [{ lesson: 'q04-musterpfad', title: 'Mehrere Anweisungen gemeinsam wiederholen', example: 'Bei jedem Durchlauf geht Glutling zuerst nach rechts und danach nach oben. Zwei Durchläufe ergeben vier einzelne Bewegungen.', code: 'repeat(2, () => {\n  glutling.moveRight();\n  glutling.moveUp();\n});' }, adaptiveExample] },
  { id: 'loop-body', label: 'Schleifenrumpf', aliases: ['Schleifenrumpf'], lesson: 'q04-musterpfad', category: 'Programmieren',
    explanation: 'Die Befehle im Inneren eines Wiederholungsblocks werden bei jedem Durchlauf nacheinander ausgeführt. Dieses Innere heißt Schleifenrumpf. Es kann mehrere Anweisungen enthalten.',
    example: '„Nach rechts“ und „nach oben“ stehen beide im Schleifenrumpf. Glutling führt bei jedem Durchlauf beide Bewegungen in dieser Reihenfolge aus.', code: 'repeat(2, () => {\n  glutling.moveRight();\n  glutling.moveUp();\n});' },
  { id: 'condition', label: 'Bedingung', aliases: ['Bedingung', 'Bedingungen'], lesson: 'q05-aufmerksam', category: 'Programmieren',
    explanation: 'Du fragst: „Steht das Konstrukt direkt neben Glutling?“ Diese Frage hat die Antwort ja oder nein. Eine solche überprüfbare Aussage heißt Bedingung.',
    example: 'glutling.enemyAdjacent ist bei einem direkt benachbarten Konstrukt wahr (ja). Steht es weiter weg, ist die Bedingung falsch (nein).', code: 'if (glutling.enemyAdjacent) {\n  glutling.attack();\n}' },
  { id: 'branch', label: 'Verzweigung', aliases: ['Verzweigung', 'Verzweigungen'], lesson: 'q05-aufmerksam', category: 'Programmieren',
    explanation: 'Glutling wählt je nach Antwort auf eine Frage einen von zwei Wegen. Das heißt Verzweigung: Bei ja führt es den dann-Teil aus, bei nein den sonst-Teil. Im Text heißen sie if und else.',
    example: 'Ist das Konstrukt direkt daneben, greift Glutling an. Sonst geht es einen Schritt näher heran. Nur einer der beiden Wege wird ausgeführt.', code: 'if (glutling.enemyAdjacent) {\n  glutling.attack();\n} else {\n  glutling.moveForward();\n}', furtherExamples: [adaptiveExample] },
];

export function learnedTerms(completed: readonly LessonId[]): readonly LearningTerm[] {
  return LEARNING_TERMS.filter((term) => completed.includes(term.lesson))
    .map((term) => ({ ...term, furtherExamples: term.furtherExamples?.filter((example) => completed.includes(example.lesson)) }));
}
