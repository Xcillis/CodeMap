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
  alsoLessons?: readonly LessonId[];
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
  { id: 'loop', label: 'Schleife', aliases: ['Schleife', 'Schleifen'], lesson: 'q03-wiederkehr', alsoLessons: ['q09-schachtelpfad', 'q11-schleifenwache', 'q12-steinrutsch'], category: 'Programmieren',
    explanation: 'Du kannst Befehle automatisch mehrmals ausführen lassen. Das nennt man eine Schleife. Die Zahl beim Wiederholen legt fest, wie oft die Befehle im Inneren ausgeführt werden.',
    example: 'Dieser Wiederholungsblock lässt Glutling dreimal einen Schritt nach rechts gehen.', code: 'repeat(3, () => {\n  glutling.moveRight();\n});',
    furtherExamples: [{ lesson: 'q04-musterpfad', title: 'Mehrere Anweisungen gemeinsam wiederholen', example: 'Bei jedem Durchlauf geht Glutling zuerst nach rechts und danach nach oben. Zwei Durchläufe ergeben vier einzelne Bewegungen.', code: 'repeat(2, () => {\n  glutling.moveRight();\n  glutling.moveUp();\n});' }, adaptiveExample] },
  { id: 'loop-body', label: 'Schleifenrumpf', aliases: ['Schleifenrumpf'], lesson: 'q04-musterpfad', alsoLessons: ['q09-schachtelpfad', 'q12-steinrutsch'], category: 'Programmieren',
    explanation: 'Die Befehle im Inneren eines Wiederholungsblocks werden bei jedem Durchlauf nacheinander ausgeführt. Dieses Innere heißt Schleifenrumpf. Es kann mehrere Anweisungen enthalten.',
    example: '„Nach rechts“ und „nach oben“ stehen beide im Schleifenrumpf. Glutling führt bei jedem Durchlauf beide Bewegungen in dieser Reihenfolge aus.', code: 'repeat(2, () => {\n  glutling.moveRight();\n  glutling.moveUp();\n});' },
  { id: 'condition', label: 'Bedingung', aliases: ['Bedingung', 'Bedingungen'], lesson: 'q05-aufmerksam', category: 'Programmieren',
    explanation: 'Du fragst: „Steht das Konstrukt direkt neben Glutling?“ Diese Frage hat die Antwort ja oder nein. Eine solche überprüfbare Aussage heißt Bedingung.',
    example: 'glutling.enemyAdjacent ist bei einem direkt benachbarten Konstrukt wahr (ja). Steht es weiter weg, ist die Bedingung falsch (nein).', code: 'if (glutling.enemyAdjacent) {\n  glutling.attack();\n}' },
  { id: 'branch', label: 'Verzweigung', aliases: ['Verzweigung', 'Verzweigungen'], lesson: 'q05-aufmerksam', category: 'Programmieren',
    explanation: 'Glutling wählt je nach Antwort auf eine Frage einen von zwei Wegen. Das heißt Verzweigung: Bei ja führt es den dann-Teil aus, bei nein den sonst-Teil. Im Text heißen sie if und else.',
    example: 'Ist das Konstrukt direkt daneben, greift Glutling an. Sonst geht es einen Schritt näher heran. Nur einer der beiden Wege wird ausgeführt.', code: 'if (glutling.enemyAdjacent) {\n  glutling.attack();\n} else {\n  glutling.moveForward();\n}', furtherExamples: [adaptiveExample] },
  { id: 'object', label: 'Objekt', aliases: ['Objekt', 'Objekte', 'Objekten'], lesson: 'q07-moosling', category: 'Programmieren',
    explanation: 'Du wählst Moosling aus und gibst ihm einen Befehl. Moosling ist dabei das Objekt, das den Befehl ausführt. Im Text steht sein Name vor dem Punkt; im Blockmodus legt die ausgewählte Figur fest, wem die Befehle gehören.',
    example: 'Dieses Programm gehört zu Moosling. Glutling besitzt ein getrenntes Programm und wird dadurch nicht angegriffen oder bewegt.', code: 'moosling.attack();' },
  { id: 'execution-order', label: 'Ausführungsreihenfolge', aliases: ['Ausführungsreihenfolge'], lesson: 'q08-team', category: 'Programmieren',
    explanation: 'Zuerst führt Moosling seine nächste Anweisung aus, danach Glutling seine nächste. Diese feste Reihenfolge heißt Ausführungsreihenfolge. Ein beendetes Programm wartet, während das andere weiterläuft.',
    example: 'Im Programm von Moosling steht ein Schritt nach rechts. Glutlings eigener nächster Befehl folgt danach, falls dort einer verbunden ist.', code: 'moosling.moveRight();' },
  { id: 'coordination', label: 'Koordination', aliases: ['Koordination', 'koordiniert', 'koordinieren'], lesson: 'q08-team', category: 'Programmieren',
    explanation: 'Du planst die Wege und Angriffe zweier Arkana so, dass beide zum gemeinsamen Ziel beitragen und keine belegten Felder betreten. Dieses Abstimmen heißt Koordination. Jedes Objekt behält sein eigenes Programm.',
    example: 'Programm von Moosling: Es geht zweimal nach rechts und greift zweimal an. Seine beiden Treffer ziehen zusammen 2 LP ab.', code: 'repeat(2, () => { moosling.moveRight(); });\nrepeat(2, () => { moosling.attack(); });',
    furtherExamples: [{ lesson: 'q08-team', title: 'Getrenntes Programm von Glutling', example: 'Glutling startet eine Zeile darüber, geht dreimal nach rechts und greift zweimal an. Seine Treffer ziehen zusammen weitere 4 LP ab. Beide Programme werden gemeinsam ausgeführt.', code: 'repeat(3, () => { glutling.moveRight(); });\nrepeat(2, () => { glutling.attack(); });' }] },
  { id: 'nested-loop', label: 'Verschachtelte Schleife', aliases: ['verschachtelte Schleife', 'verschachtelte Schleifen'], lesson: 'q09-schachtelpfad', alsoLessons: ['q12-steinrutsch'], category: 'Programmieren',
    explanation: 'Eine äußere Wiederholung enthält eine weitere Wiederholung. Diese innere Schleife beginnt bei jedem äußeren Durchlauf neu. Das nennt man eine verschachtelte Schleife.',
    example: 'Die innere Schleife führt zwei Rechtsschritte aus. Danach folgt ein Aufwärtsschritt. Die äußere Schleife wiederholt diese ganze Stufe zweimal.', code: 'repeat(2, () => {\n  repeat(2, () => { glutling.moveRight(); });\n  glutling.moveUp();\n});' },
  { id: 'query', label: 'Abfrage', aliases: ['Abfrage', 'Abfragen'], lesson: 'q13-lichtpfad', category: 'Programmieren',
    explanation: 'Das Programm liest eine Information über die aktuelle Welt, etwa ob das rechte Nachbarfeld frei ist. Das heißt Abfrage. Nach einer Bewegung kann dieselbe Frage eine andere Antwort haben.',
    example: 'Ist rechts ein Stein oder der Kartenrand, ergibt pathRightClear nein. Auf einem freien Nachbarfeld ergibt die Abfrage ja.', code: 'if (glutling.pathRightClear) {\n  glutling.moveRight();\n} else {\n  glutling.moveUp();\n}' },
];

export function learnedTerms(completed: readonly LessonId[]): readonly LearningTerm[] {
  return LEARNING_TERMS.filter((term) => completed.includes(term.lesson) || term.alsoLessons?.some((lesson) => completed.includes(lesson)))
    .map((term) => ({ ...term, furtherExamples: term.furtherExamples?.filter((example) => completed.includes(example.lesson)) }));
}
