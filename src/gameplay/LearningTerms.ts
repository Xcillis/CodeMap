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
  code: 'repeat(5, () => {\n  if (glutling.enemyAdjacent) {\n    glutling.flameStrike();\n  } else {\n    glutling.moveTowardEnemy();\n  }\n});' };

export const LEARNING_TERMS: readonly LearningTerm[] = [
  { id: 'while-loop', label: 'Bedingte Schleife', aliases: ['bedingte Schleife', 'bedingten Schleife', 'solange-Schleife'], lesson: 'q21-solangeweg', category: 'Programmieren',
    explanation: 'Glutling fragt vor jedem Schritt, ob der Weg frei ist. Bei nein hört es mit Wiederholen auf und führt den Befehl darunter aus. Das heißt bedingte Schleife. Ist die Frage anfangs nein, wird der Rumpf keinmal ausgeführt.',
    example: 'Solange voraus frei ist, geht Glutling vorwärts. Danach dreht es links. Die Weglänge bestimmt die Anzahl.', code: 'while (glutling.pathAheadClear) {\n  glutling.moveForward();\n}\nglutling.turnLeft();',
    furtherExamples: [{ lesson: 'q22-solangekampf', title: 'Solange der Gegner lebt', example: 'Die Schleife prüft die Lebenspunkte, die innere Entscheidung prüft die Nähe.', code: 'while (glutling.enemyAlive) {\n  if (glutling.enemyAdjacent) { glutling.flameStrike(); }\n  else { glutling.moveTowardEnemy(); }\n}' }] },

  { id: 'instruction', label: 'Anweisung', aliases: ['Anweisung', 'Anweisungen'], lesson: 'q01-glutspur', category: 'Programmieren',
    explanation: 'Du sagst Glutling mit einem Befehl, was es tun soll. Ein solcher einzelner Befehl heißt Anweisung.',
    example: '„Gehe vorwärts“ bewegt Glutling genau ein Feld in die Richtung seines Pfeils. „Drehe 90° nach links“ verändert nur die Blickrichtung.', code: 'glutling.moveForward();\nglutling.turnLeft();' },
  { id: 'sequence', label: 'Sequenz', aliases: ['Sequenz', 'Sequenzen'], lesson: 'q01-glutspur', category: 'Programmieren',
    explanation: 'Glutling führt mehrere Befehle nacheinander aus, von oben nach unten. Eine solche geordnete Befehlsfolge heißt Sequenz. Eine andere Reihenfolge kann zu einem anderen Ergebnis führen.',
    example: 'Glutling blickt anfangs nach rechts: zweimal vorwärts, links drehen, einmal vorwärts. Es erreicht die Rune oberhalb der Ecke.', code: 'glutling.moveForward();\nglutling.moveForward();\nglutling.turnLeft();\nglutling.moveForward();' },
  { id: 'health', label: 'Lebenspunkte', aliases: ['Lebenspunkte', 'Lebenspunkt', 'LP'], lesson: 'q02-basisangriff', category: 'Spielwelt',
    explanation: 'Die Zahl der Lebenspunkte zeigt, wie viel Schaden ein Wesen noch aushält. Die Abkürzung ist LP. Bei 0 LP ist das Übungskonstrukt ausgeschaltet.',
    example: 'Das Konstrukt beginnt mit 4 LP. Glutlings Angriff zieht ihm 2 LP ab. Danach bleiben 2 LP übrig.', code: 'glutling.flameStrike();' },
  { id: 'loop', label: 'Schleife', aliases: ['Schleife', 'Schleifen'], lesson: 'q03-wiederkehr', alsoLessons: ['q09-schachtelpfad', 'q11-schleifenwache', 'q12-steinrutsch'], category: 'Programmieren',
    explanation: 'Du kannst Befehle automatisch mehrmals ausführen lassen. Das nennt man eine Schleife. Die Zahl beim Wiederholen legt fest, wie oft die Befehle im Inneren ausgeführt werden.',
    example: 'Dieser Wiederholungsblock lässt Glutling dreimal einen Schritt vorwärts gehen. Ohne Drehung bleibt die Blickrichtung gleich.', code: 'repeat(3, () => {\n  glutling.moveForward();\n});',
    furtherExamples: [{ lesson: 'q04-musterpfad', title: 'Mehrere Anweisungen gemeinsam wiederholen', example: 'Bei jedem Durchlauf geht Glutling vorwärts, dreht links, geht vorwärts und dreht rechts. Zwei Durchläufe ergeben vier Bewegungen und vier Drehungen.', code: 'repeat(2, () => {\n  glutling.moveForward();\n  glutling.turnLeft();\n  glutling.moveForward();\n  glutling.turnRight();\n});' }, adaptiveExample] },
  { id: 'loop-body', label: 'Schleifenrumpf', aliases: ['Schleifenrumpf'], lesson: 'q04-musterpfad', alsoLessons: ['q09-schachtelpfad'], category: 'Programmieren',
    explanation: 'Die Befehle im Inneren eines Wiederholungsblocks werden bei jedem Durchlauf nacheinander ausgeführt. Dieses Innere heißt Schleifenrumpf. Es kann mehrere Anweisungen enthalten.',
    example: 'Vorwärts, links drehen, vorwärts und rechts drehen stehen im Schleifenrumpf. Glutling führt bei jedem Durchlauf alle vier Anweisungen in dieser Reihenfolge aus.', code: 'repeat(2, () => {\n  glutling.moveForward();\n  glutling.turnLeft();\n  glutling.moveForward();\n  glutling.turnRight();\n});' },
  { id: 'condition', label: 'Bedingung', aliases: ['Bedingung', 'Bedingungen'], lesson: 'q05-aufmerksam', category: 'Programmieren',
    explanation: 'Du fragst: „Steht das Konstrukt direkt neben Glutling?“ Diese Frage hat die Antwort ja oder nein. Eine solche überprüfbare Aussage heißt Bedingung.',
    example: 'glutling.enemyAdjacent ist bei einem direkt benachbarten Konstrukt wahr (ja). Steht es weiter weg, ist die Bedingung falsch (nein).', code: 'if (glutling.enemyAdjacent) {\n  glutling.flameStrike();\n}' },
  { id: 'branch', label: 'Verzweigung', aliases: ['Verzweigung', 'Verzweigungen'], lesson: 'q05-aufmerksam', category: 'Programmieren',
    explanation: 'Glutling wählt je nach Antwort auf eine Frage einen von zwei Wegen. Das heißt Verzweigung: Bei ja führt es den dann-Teil aus, bei nein den sonst-Teil. Im Text heißen sie if und else.',
    example: 'Ist das Konstrukt direkt daneben, greift Glutling an. Sonst geht es einen Schritt näher heran. Nur einer der beiden Wege wird ausgeführt.', code: 'if (glutling.enemyAdjacent) {\n  glutling.flameStrike();\n} else {\n  glutling.moveTowardEnemy();\n}', furtherExamples: [adaptiveExample] },
  { id: 'object', label: 'Objekt', aliases: ['Objekt', 'Objekte', 'Objekten'], lesson: 'q07-moosling', category: 'Programmieren',
    explanation: 'Du wählst Moosling aus und gibst ihm einen Befehl. Moosling ist dabei das Objekt, das den Befehl ausführt. Im Text steht sein Name vor dem Punkt; im Blockmodus legt die ausgewählte Figur fest, wem die Befehle gehören.',
    example: 'Dieses Programm gehört zu Moosling. Glutling besitzt ein getrenntes Programm und wird dadurch nicht angegriffen oder bewegt.', code: 'moosling.vineStrike();' },
  { id: 'execution-order', label: 'Ausführungsreihenfolge', aliases: ['Ausführungsreihenfolge'], lesson: 'q08-team', category: 'Programmieren',
    explanation: 'Zuerst führt Moosling seine nächste Anweisung aus, danach Glutling seine nächste. Diese feste Reihenfolge heißt Ausführungsreihenfolge. Ein beendetes Programm wartet, während das andere weiterläuft.',
    example: 'Im Programm von Moosling steht ein Schritt nach rechts. Glutlings eigener nächster Befehl folgt danach, falls dort einer verbunden ist.', code: 'moosling.moveForward();' },
  { id: 'coordination', label: 'Koordination', aliases: ['Koordination', 'koordiniert', 'koordinieren'], lesson: 'q08-team', category: 'Programmieren',
    explanation: 'Du planst die Wege und Angriffe zweier Arkana so, dass beide zum gemeinsamen Ziel beitragen und keine belegten Felder betreten. Dieses Abstimmen heißt Koordination. Jedes Objekt behält sein eigenes Programm.',
    example: 'Programm von Moosling: Es geht zweimal nach rechts und greift zweimal an. Seine beiden Treffer ziehen zusammen 2 LP ab.', code: 'repeat(2, () => { moosling.moveForward(); });\nrepeat(2, () => { moosling.vineStrike(); });',
    furtherExamples: [{ lesson: 'q08-team', title: 'Getrenntes Programm von Glutling', example: 'Glutling startet eine Zeile darüber, geht dreimal nach rechts und greift zweimal an. Seine Treffer ziehen zusammen weitere 4 LP ab. Beide Programme werden gemeinsam ausgeführt.', code: 'repeat(3, () => { glutling.moveForward(); });\nrepeat(2, () => { glutling.flameStrike(); });' }] },
  { id: 'nested-loop', label: 'Verschachtelte Schleife', aliases: ['verschachtelte Schleife', 'verschachtelte Schleifen'], lesson: 'q09-schachtelpfad', category: 'Programmieren',
    explanation: 'Eine äußere Wiederholung enthält eine weitere Wiederholung. Diese innere Schleife beginnt bei jedem äußeren Durchlauf neu. Das nennt man eine verschachtelte Schleife.',
    example: 'Die innere Schleife führt zwei Vorwärtsschritte auf einer Stufe aus. Danach folgt der Wechsel: links drehen, vorwärts, rechts drehen. Die äußere Schleife wiederholt die ganze Stufe.', code: 'repeat(2, () => {\n  repeat(2, () => { glutling.moveForward(); });\n  glutling.turnLeft();\n  glutling.moveForward();\n  glutling.turnRight();\n});',
    furtherExamples: [{ lesson: 'q10-schachtelkampf', title: 'Ein Runenfeld Reihe für Reihe', example: 'Innen bearbeitet Glutling die beiden Felder einer Reihe. Es geht zweimal rückwärts zum Reihenanfang, ohne seine Blickrichtung zu ändern. Nach dem Reihenwechsel beginnt die innere Wiederholung wieder bei 1.', code: 'repeat(2, () => {\n  repeat(2, () => { glutling.moveForward(); });\n  repeat(2, () => { glutling.moveBackward(); });\n  glutling.turnLeft();\n  glutling.moveForward();\n  glutling.turnRight();\n});' }] },
  { id: 'query', label: 'Abfrage', aliases: ['Abfrage', 'Abfragen'], lesson: 'q13-lichtpfad', category: 'Programmieren',
    explanation: 'Das Programm liest eine Information über die aktuelle Welt, etwa ob das Feld vor Glutling frei ist. Das heißt Abfrage. Nach einer Bewegung oder Drehung kann dieselbe Frage eine andere Antwort haben.',
    example: 'Liegt in Blickrichtung ein Stein, der Kartenrand oder ein anderes Wesen, ergibt pathAheadClear nein. Auf einem freien Nachbarfeld ergibt die Abfrage ja.', code: 'if (glutling.pathAheadClear) {\n  glutling.moveForward();\n} else {\n  glutling.turnLeft();\n  glutling.moveForward();\n  glutling.turnRight();\n}' },
];

export function learnedTerms(completed: readonly LessonId[], legacyPassKnowledge = false): readonly LearningTerm[] {
  return [...LEARNING_TERMS, ...COMBAT_TERMS].filter((term) => completed.includes(term.lesson) || term.alsoLessons?.some((lesson) => completed.includes(lesson)) || (legacyPassKnowledge && (term.id === 'nested-loop' || term.id === 'loop-body')))
    .map((term) => ({ ...term, furtherExamples: term.furtherExamples?.filter((example) => completed.includes(example.lesson)) }));
}

export const COMBAT_TERMS: readonly LearningTerm[] = [
  { id: 'combination', label: 'Kombination', aliases: ['Kombination', 'Kombinationen'], lesson: 'q23-brandfolge', category: 'Spielwelt', explanation: 'Entzünden bereitet Brand vor. Ein direkter Feuerangriff nutzt ihn danach für 3 statt 2 Schaden und entfernt den Brand. Eine solche Folge passender Wirkungen heißt Kombination. Die Reihenfolge und der aktuelle Zustand zählen.', example: 'Erst Entzünden, danach Glutstoß, bevor der Brand ausläuft. 3 Schaden ist ein Testwert.', code: 'glutling.ignite();\nglutling.flameStrike();' },
  { id: 'freezing', label: 'Einfrieren', aliases: ['Einfrieren', 'Eingefroren', 'Kühlung'], lesson: 'q24-frostfolge', category: 'Spielwelt', explanation: 'Die erste Kälte kühlt ein Ziel. Noch einmal Kälte vor Ablauf der Kühlung ersetzt sie durch Eingefroren. Genau die nächste reguläre Aktion fällt aus, danach endet der Zustand. Kälte von verschiedenen Arkanen kann zusammenwirken.', example: 'Gefrieren zweimal nacheinander: Kälte 1/2, dann 2/2. Der Zustand bleibt bis zur ausgefallenen Aktion.', code: 'frostmolch.chill();\nfrostmolch.chill();' },
  { id: 'extinguishing', label: 'Zustand aufheben', aliases: ['Zustand aufheben', 'Löschen'], lesson: 'q25-loeschen', category: 'Spielwelt', explanation: 'Löschendes Wasser entfernt Brand sofort. Danach entfallen weitere Brandimpulse. Die gewählte Fähigkeit bestimmt, ob der Gegner oder ein brennender Verbündeter gelöscht wird.', example: 'Verbündeten löschen hilft dem brennenden Teammitglied mit dem niedrigsten LP-Anteil in Reichweite 3.', code: 'frostmolch.extinguishAlly();' },
  { id: 'surface', label: 'Flächenzustand', aliases: ['Flächenzustand', 'Flächenzustände'], lesson: 'q26-eisbruecke', category: 'Spielwelt', explanation: 'Gefrieren verändert flaches Wasser zu Eis. Das Wasser blockiert, das Eis ist begehbar. Eine solche Eigenschaft des Bodens heißt Flächenzustand. Im Rätsel bleibt Eis für die Aufgabe bestehen; tiefes Wasser ist kein vereisbarer Übergang.', example: 'Erst das Wasserfeld direkt voraus vereisen, danach darauf gehen.', code: 'frostmolch.chill();\nfrostmolch.moveForward();' },

  { id: 'cover', label: 'Deckung', aliases: ['Deckung', 'deckt'], lesson: 'q19-deckung', category: 'Spielwelt',
    explanation: 'Felsbock übernimmt einen Treffer, der sonst ein anderes Arkana treffen würde. Das heißt Deckung. Es deckt zwei Schritte lang ein anderes lebendes Arkana in Reichweite 3. Ein Steinpanzer kann den übernommenen Schaden verringern.',
    example: 'Glutling wartet im ersten Schritt. Felsbock deckt es. Im zweiten Schritt greift Glutling an und Felsbock aktiviert seinen Steinpanzer.', code: 'felsbock.coverAlly();\nfelsbock.stoneArmor();' },
  { id: 'status', label: 'Zustand', aliases: ['Zustand', 'Zustände'], lesson: 'q14-feuerprobe', alsoLessons: ['q15-wurzelschutz', 'q16-heilmoos'], category: 'Spielwelt',
    explanation: 'Ein entzündetes Konstrukt verliert auch nach dem Zaubern noch Lebenspunkte. Eine solche anhaltende Eigenschaft heißt Zustand. Brand, Ranken, Heilmoos und Steinpanzer haben eine begrenzte Dauer.', example: 'Der Brand zieht am Ende dreier Programmschritte je einen Lebenspunkt ab.', code: 'glutling.ignite();\nglutling.wait();' },
  { id: 'cooldown', label: 'Abklingzeit', aliases: ['Abklingzeit', 'Abklingzeiten'], lesson: 'q14-feuerprobe', alsoLessons: ['q15-wurzelschutz', 'q16-heilmoos'], category: 'Spielwelt',
    explanation: 'Nach dem Entzünden ist die Fähigkeit für eine Weile nicht erneut bereit. Diese Wartezeit heißt Abklingzeit. Sie läuft pro gemeinsamem Programmschritt weiter, während andere Befehle ausgeführt werden.', example: 'Nach Entzünden in Schritt 1 ist es in Schritt 4 wieder bereit. Zwei andere Befehle können die Zeit dazwischen füllen.', code: 'glutling.ignite();\nglutling.wait();\nglutling.wait();\nglutling.ignite();' },
  { id: 'tank', label: 'Tankrolle', aliases: ['Tankrolle', 'Schutzrolle'], lesson: 'q18-steinpanzer', category: 'Spielwelt',
    explanation: 'Felsbock fängt Schaden mit seinem Steinpanzer ab und kann später Treffer für andere Arkana übernehmen. Dieses Beschützen des Teams heißt Tankrolle. Moosling heilt und unterstützt stattdessen.', example: 'Felsbocks Steinpanzer fängt zwei Schritte lang pro Treffer bis zu 2 Schaden ab.', code: 'felsbock.stoneArmor();' },
  { id: 'regeneration', label: 'Heilung über Zeit', aliases: ['Heilung über Zeit', 'Regeneration', 'regeneriert'], lesson: 'q16-heilmoos', category: 'Spielwelt',
    explanation: 'Heilmoos stellt nicht alle Lebenspunkte auf einmal wieder her. Es heilt an mehreren Schrittenden jeweils einen Teil. Das heißt Heilung über Zeit oder Regeneration.', example: 'Ein verletztes Glutling in Reichweite kann durch Heilmoos über drei Schritte je 1 LP zurückbekommen.', code: 'moosling.healingMoss();' },
];
