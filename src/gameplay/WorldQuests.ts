import type { ArkanId, GridPosition, ProgramSources } from '../combat/types';
import type { SkillId } from './ArkanaCatalog';

export const LESSON_IDS = ['q01-glutspur', 'q02-basisangriff', 'q03-wiederkehr', 'q04-musterpfad', 'q05-aufmerksam', 'q06-waechter', 'q07-moosling', 'q08-team'] as const;
export type LessonId = typeof LESSON_IDS[number];
export const isLessonId = (value: unknown): value is LessonId => LESSON_IDS.some((id) => value === id);
export type RepeatGoal = 'none' | 'movement' | 'movement-sequence';
export interface DecisionTrial { title: string; start: GridPosition; enemy: GridPosition }

const patternPath = [{ x: 1, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 1 }];
const patternWalls = Array.from({ length: 49 }, (_, index) => ({ x: index % 7, y: Math.floor(index / 7) }))
  .filter((tile) => !patternPath.some((step) => step.x === tile.x && step.y === tile.y));

interface QuestBase {
  id: LessonId;
  title: string;
  target: string;
  x: number;
  y: number;
  introduction: string;
  objective: string;
  reward: string;
  introduces: readonly SkillId[];
  allowed: readonly SkillId[];
  starter: string;
  team?: readonly ArkanId[];
  starters?: ProgramSources;
  start: GridPosition;
  hints: readonly string[];
}
export type WorldQuest = QuestBase & (
  | { kind: 'puzzle'; goal: GridPosition; walls: readonly GridPosition[]; repeatGoal: RepeatGoal }
  | { kind: 'combat'; enemy: GridPosition; enemyHp: number; decisionTrials?: readonly DecisionTrial[]; adaptiveTrials?: readonly DecisionTrial[]; companion?: GridPosition }
);

export const WORLD_QUESTS: readonly WorldQuest[] = [
  { id: 'q01-glutspur', title: 'Glutlings erste Schritte', target: 'Runenstein am Weg', x: 790, y: 690,
    kind: 'puzzle', start: { x: 1, y: 3 }, goal: { x: 3, y: 2 }, walls: [{ x: 1, y: 2 }, { x: 2, y: 2 }], repeatGoal: 'none',
    introduction: 'Mit einem Befehl sagst du Glutling, was es tun soll. „Gehe nach rechts“ bewegt es zum Beispiel ein Feld nach rechts. Ein Befehl wird auch Anweisung genannt.\n\nGlutling führt deine Befehle von oben nach unten aus, einen nach dem anderen. Eine solche geordnete Befehlsfolge heißt Sequenz.\n\nProbiere den vorbereiteten Befehl mit „Nächsten Schritt ausführen“ aus. Füge dann weitere Bewegungsbefehle hinzu, bis Glutling die goldene Rune erreicht. Achte auf die Steine.',
    objective: 'Bringe Glutling zur goldenen Rune. Stelle dafür Bewegungsbefehle in der passenden Reihenfolge zusammen.',
    introduces: ['moveRight', 'moveUp'], allowed: ['moveRight', 'moveUp'], starter: 'glutling.moveRight();',
    reward: 'Glutling hat den Runenstein erreicht! Deine Befehle wurden nacheinander ausgeführt. Ihre Reihenfolge hat Glutling sicher zum Ziel geführt. Eine solche Befehlsfolge heißt Sequenz. Am Übungskonstrukt lernst du als Nächstes das Angreifen.',
    hints: ['Ein Bewegungsbefehl bewegt Glutling ein Feld. Klicke auf „Nächsten Schritt ausführen“ und beobachte den vorbereiteten Befehl.', 'Die Steine liegen oberhalb von Glutlings Start. Gehe zuerst unter ihnen hindurch nach rechts.', 'Nach zwei Schritten nach rechts liegt die Rune ein Feld oberhalb. Ordne die Befehle von oben nach unten so an, dass Glutling zuerst nach rechts und danach nach oben geht.'] },
  { id: 'q02-basisangriff', title: 'Das Übungskonstrukt', target: 'Übungskonstrukt', x: 1120, y: 575,
    kind: 'combat', start: { x: 1, y: 3 }, enemy: { x: 4, y: 3 }, enemyHp: 4,
    introduction: 'Glutling kann jetzt angreifen. Ein Angriff trifft ein Konstrukt, das auf einem Feld direkt neben Glutling steht.\n\nDas Konstrukt hat 4 Lebenspunkte, kurz LP. Glutlings Angriff zieht ihm 2 LP ab. Bei 0 LP ist es ausgeschaltet. Es greift nicht zurück.\n\nStelle passende Bewegungs- und Angriffsbefehle nacheinander zusammen. Im Text heißt der neue Befehl glutling.attack().',
    objective: 'Bringe Glutling neben das Konstrukt und schalte es mit Angriffen aus.',
    introduces: ['attack'], allowed: ['moveRight', 'moveUp', 'attack'], starter: 'glutling.moveRight();',
    reward: 'Das Übungskonstrukt ist ausgeschaltet! Du hast Bewegung und Angriff kombiniert. Am langen Runenweg lernst du, gleiche Befehle zu wiederholen.',
    hints: ['Glutling muss zuerst auf einem Feld direkt neben dem Konstrukt stehen. Erst dann kann sein Angriff treffen.', 'Zwei Schritte nach rechts bringen Glutling neben das Konstrukt.', 'Das Konstrukt hat 4 Lebenspunkte. Ein Angriff zieht ihm 2 ab. Wie viele Angriffsbefehle brauchst du?'] },
  { id: 'q03-wiederkehr', title: 'Der lange Runenweg', target: 'Runensäule am Ostweg', x: 1480, y: 650,
    kind: 'puzzle', start: { x: 1, y: 3 }, goal: { x: 5, y: 3 }, walls: [], repeatGoal: 'movement',
    introduction: 'Manchmal brauchst du denselben Befehl mehrmals. Statt ihn mehrfach einzufügen, kannst du ihn wiederholen lassen. Das nennt man eine Schleife.\n\nDer Block „wiederhole … mal“ führt die Befehle in seinem Inneren so oft aus, wie die eingestellte Zahl angibt. Lege „gehe nach rechts“ hinein und wähle eine Anzahl.\n\nIm Text ist repeat(2, () => { glutling.moveRight(); }); ein Beispiel für zwei Schritte nach rechts. Mit „Nächsten Schritt ausführen“ siehst du jede einzelne Bewegung.',
    objective: 'Bringe Glutling zur Rune. Lass dafür einen Bewegungsbefehl mit „wiederhole … mal“ mindestens zweimal ausführen.',
    introduces: ['repeat'], allowed: ['moveRight', 'repeat'], starter: '',
    reward: 'Der Runenweg leuchtet! Du hast eine Bewegung mit einer Schleife wiederholt. Am Musterstein am Nordweg wartet ein Treppenweg auf dich: Dort wiederholst du mehrere Befehle gemeinsam.',
    hints: ['Die Rune liegt auf derselben Zeile. Zähle die Felder zwischen Start und Ziel.', 'Verbinde einen Wiederholungsblock mit dem Start und lege „gehe nach rechts“ in sein Inneres.', 'Vier Schritte nach rechts führen zur Rune. Verändere die Wiederholungszahl und vergleiche deine Vorhersage mit dem Ablauf.'] },
  { id: 'q04-musterpfad', title: 'Der Musterpfad', target: 'Musterstein am Nordweg', x: 775, y: 400,
    kind: 'puzzle', start: { x: 1, y: 4 }, goal: { x: 4, y: 1 }, walls: patternWalls, repeatGoal: 'movement-sequence',
    introduction: 'Auf dem Treppenweg geht Glutling erst ein Feld nach rechts und dann ein Feld nach oben. Danach beginnt dasselbe Muster erneut. Die Steine lassen nur diesen Weg frei.\n\nLege beide Bewegungsanweisungen nacheinander in denselben Wiederholungsblock. Die Befehle in seinem Inneren werden bei jedem Durchlauf gemeinsam ausgeführt. Dieses Innere nennt man Schleifenrumpf. Du wiederholst also eine ganze Sequenz.\n\nErgänze den vorbereiteten Block und finde heraus, wie oft Glutling das Muster bis zur goldenen Rune braucht. Für den Questabschluss müssen die beiden Bewegungen gemeinsam in mindestens zwei Durchläufen derselben Schleife gelingen. Einzelbefehle oder getrennte Schleifen für jede Richtung reichen hier nicht. Beobachte mit „Nächsten Schritt ausführen“, wann der nächste Durchlauf beginnt.',
    objective: 'Erreiche die Rune. Wiederhole rechts und oben gemeinsam in derselben Schleife mindestens zweimal erfolgreich.',
    introduces: [], allowed: ['moveRight', 'moveUp', 'repeat'], starter: 'repeat(1, () => {\n  glutling.moveRight();\n});',
    reward: 'Der Musterpfad leuchtet! Glutling hat rechts und oben als gemeinsame Befehlsfolge wiederholt. Die Anweisungen im Schleifenrumpf wurden bei jedem Durchlauf in derselben Reihenfolge ausgeführt. Im Charakterfenster findest du das passende Beispiel. Am Prüfstein südlich der Akademie lernst du als Nächstes, wie Glutling zwischen zwei Aktionen entscheidet.',
    hints: ['Schau dir die freien Felder an: Nach einem Schritt nach rechts führt der Weg nach oben. Dieses Paar von Bewegungen kommt mehrmals vor.', 'Stecke „gehe nach oben“ direkt unter „gehe nach rechts“ in das Innere desselben Wiederholungsblocks. Die Zahl gibt an, wie oft beide Befehle zusammen ausgeführt werden.', 'Der Treppenweg besteht aus drei Stufen. Jede Stufe braucht rechts und oben. Stelle die Wiederholungszahl passend ein und beobachte die sechs einzelnen Bewegungen.'] },
  { id: 'q05-aufmerksam', title: 'Der aufmerksame Begleiter', target: 'Prüfstein südlich der Akademie', x: 1210, y: 760,
    kind: 'combat', start: { x: 1, y: 3 }, enemy: { x: 2, y: 3 }, enemyHp: 4,
    decisionTrials: [
      { title: 'Das Konstrukt steht direkt neben Glutling', start: { x: 1, y: 3 }, enemy: { x: 2, y: 3 } },
      { title: 'Das Konstrukt steht weiter weg', start: { x: 1, y: 3 }, enemy: { x: 4, y: 3 } },
    ],
    introduction: 'Steht das Konstrukt direkt neben Glutling? Wenn ja, soll Glutling angreifen. Wenn nein, soll es einen Schritt näher herangehen. Das Konstrukt bleibt stehen und greift nicht zurück.\n\nDie Frage „Steht der Gegner neben mir?“ ist eine Bedingung: Die Antwort ist ja oder nein. Im Text prüft glutling.enemyAdjacent diese Frage. Der Block „falls … dann … sonst“ wählt passend zur Antwort einen von zwei Wegen. Das heißt Verzweigung. Im Text heißen die beiden Teile if und else.\n\nDer neue Befehl glutling.moveForward() bewegt Glutling ein Feld zum Konstrukt. Im Blockmodus heißt er „Zum nächsten Gegner gehen“. Er greift nicht an und stellt sich nicht auf das besetzte Feld.\n\nErgänze das vorbereitete Programm. Es wird unverändert in zwei Situationen geprüft: zuerst neben dem Konstrukt, dann weiter entfernt. Pro Situation zählt nur die erste Aktion: Sie muss vom selben falls/sonst-Block passend gewählt werden. Das Konstrukt zu besiegen ist hier nicht das Ziel. „Programm ausführen“ spielt beide Situationen ab; mit „Nächsten Schritt ausführen“ prüfst du sie einzeln. Schleifen werden erst in der nächsten Lernquest mit Entscheidungen verbunden.',
    objective: 'Wähle mit demselben falls/sonst-Block in beiden Situationen passend: direkt daneben angreifen, sonst einen Schritt näher herangehen.',
    introduces: ['enemyAdjacent', 'moveForward'], allowed: ['moveRight', 'moveUp', 'moveForward', 'attack', 'enemyAdjacent'],
    starter: 'if (glutling.enemyAdjacent) {\n  glutling.attack();\n}',
    reward: 'Glutling hat in beiden Situationen passend entschieden! Dieselbe Bedingung wurde einmal mit ja und einmal mit nein beantwortet. Die Verzweigung hat jeweils den passenden Befehl ausgewählt. Im Charakterfenster findest du Bedingung und Verzweigung mit Beispielen. Jetzt kannst du den südöstlichen Hain erkunden und dort Moosling finden und aufnehmen. Am Wächterstein am östlichen Nordweg wartet die nächste Lernquest: Dort verbindest du Schleife und Bedingung gegen ein aktives Konstrukt.',
    hints: ['Beobachte die Entfernung: Ein Angriff trifft nur direkt daneben. Bei größerem Abstand muss Glutling zuerst näher herangehen.', 'Im vorbereiteten falls/sonst-Block steht der Angriff bereits im dann-Teil. Ergänze im sonst-Teil eine Bewegung zum nächsten Gegner.', 'Im Text ergänzt du nach der schließenden Klammer else { glutling.moveForward(); }. Führe dasselbe Programm in beiden Situationen aus und vergleiche die Antworten auf die Bedingung.'] },
  { id: 'q06-waechter', title: 'Der bewegliche Wächter', target: 'Wächterstein am östlichen Nordweg', x: 1430, y: 430,
    kind: 'combat', start: { x: 1, y: 3 }, enemy: { x: 4, y: 3 }, enemyHp: 6,
    adaptiveTrials: [
      { title: 'Der Wächter beginnt drei Felder entfernt', start: { x: 1, y: 3 }, enemy: { x: 4, y: 3 } },
      { title: 'Der Wächter beginnt vier Felder entfernt', start: { x: 1, y: 3 }, enemy: { x: 5, y: 3 } },
    ],
    introduction: 'Dieser Wächter wartet nicht still: Nach jedem Befehl von Glutling kommt er ein Feld näher. Steht er direkt daneben, greift er stattdessen an und zieht Glutling 1 Lebenspunkt ab. Der Wächter hat 6 LP, Glutlings Angriff verursacht 2 Schaden. Nach jeder Situation beginnen beide wieder mit vollen LP.\n\nDie Entfernung verändert sich während des Programms. Prüfe deshalb bei jedem Durchlauf neu: direkt daneben angreifen, sonst zum nächsten Gegner gehen. Lege dafür den bekannten falls/sonst-Block in den Schleifenrumpf von „wiederhole … mal“. So wird seine Bedingung bei jeder Wiederholung neu beantwortet.\n\nErgänze den unvollständigen Wiederholungsblock und wähle eine passende Anzahl. Dasselbe Programm muss den Wächter in zwei Startsituationen ausschalten. In jeder Situation muss dieselbe Bedingung innerhalb derselben Schleife bei verschiedenen Durchläufen einmal nein und einmal ja ergeben und passende Aktionen auslösen. Ein Sieg durch reine Einzelbefehle reicht für diese Übung nicht.\n\nMit „Nächsten Schritt ausführen“ siehst du Glutlings nächste Aktion und die Antwort des Wächters. „Programm ausführen“ spielt beide Situationen vollständig ab. Beobachte die markierte Bedingung und den Durchlauf; mit Pause kannst du einzelne Aktionen prüfen.',
    objective: 'Schalte den aktiven Wächter in beiden Situationen mit demselben Programm aus. Entscheide innerhalb einer Schleife bei jedem Durchlauf neu: daneben angreifen, sonst näher gehen. In jeder Situation müssen beide Antworten mit passenden Aktionen in verschiedenen Durchläufen vorkommen.',
    introduces: [], allowed: ['moveRight', 'moveUp', 'moveForward', 'attack', 'enemyAdjacent', 'repeat'],
    starter: 'repeat(1, () => {\n  if (glutling.enemyAdjacent) {\n    glutling.attack();\n  }\n});',
    reward: 'Beide Wächter sind ausgeschaltet! Die Bedingung stand im Schleifenrumpf und wurde in jedem Durchlauf neu geprüft. Zuerst führte die Antwort nein zum Nähergehen, später führte ja zum Angriff. Dein Programm hat auf die veränderte Entfernung reagiert. Im Charakterfenster findest du ein neues Beispiel zur Verbindung von Schleife und Verzweigung. Falls du Moosling noch nicht gesammelt hast, wartet es im südöstlichen Hain. Am Hain-Prüfstein lernst du als Nächstes Mooslings eigenes Programm kennen. Danach führt dich der Teamstein am Westweg zur gemeinsamen Koordination beider Arkana.',
    hints: ['Beobachte nach Glutlings Bewegung auch den Wächter: Beide können die Entfernung verändern. Ein zuvor passender Bewegungsbefehl ist später vielleicht ein Angriff.', 'Lege den falls/sonst-Block vollständig in den Wiederholungsblock. Bei ja gehört der Angriff hinein, bei nein ein Schritt zum nächsten Gegner. Außerhalb der Schleife würde die Frage nicht bei jedem Durchlauf erneut gestellt.', 'Der weiter entfernte Wächter braucht zwei Annäherungen von Glutling, danach drei erfolgreiche Angriffe. Wähle eine Wiederholungszahl, die dafür ausreicht. In der näheren Situation endet die Begegnung schon früher, sobald der Wächter ausgeschaltet ist.'] },
  { id: 'q07-moosling', title: 'Mooslings eigener Weg', target: 'Hain-Prüfstein', x: 1260, y: 970,
    kind: 'combat', team: ['moosling'], start: { x: 1, y: 3 }, enemy: { x: 4, y: 3 }, enemyHp: 3,
    introduction: 'Finde Moosling im südöstlichen Hain und nimm es in deine Sammlung auf. Für diese Aufgabe wählst du Moosling allein als aktives Arkana. Die bekannten Bewegungsbefehle, Angriffe und Wiederholungen kannst du auch mit ihm verwenden.\n\nMoosling gehört zum Natur-Typ. Es hält mit 5 Lebenspunkten mehr aus als Glutling, sein Basisangriff verursacht aber nur 1 Schaden statt 2. Das sind unterschiedliche Stärken und Schwächen. Heilung und Ranken sind spätere Fähigkeiten und hier noch keine Befehle. Das Konstrukt mit 3 LP bleibt passiv.\n\nWähle Moosling im Editor. Du bearbeitest sein eigenes Programm. Im Blockmodus heißt der Befehl weiterhin „angreifen“; die ausgewählte Figur legt fest, wer ihn ausführt. Im Text lautet er moosling.attack(). Moosling ist hier das Objekt, dem du eine Anweisung gibst. Glutlings Programme bleiben gespeichert.\n\nBringe Moosling neben das Konstrukt und bestimme anhand des Schadens, wie viele Angriffe es braucht. Du kannst eine Sequenz oder bereits gelernte Schleifen benutzen.',
    objective: 'Schalte mit Moosling allein das passive Konstrukt mit 3 LP aus. Mooslings Angriff verursacht 1 Schaden. Bearbeite dabei sein eigenes Programm.',
    introduces: [], allowed: ['moveRight', 'moveUp', 'attack', 'repeat'], starter: 'moosling.moveRight();',
    reward: 'Moosling hat sein eigenes Programm ausgeführt! Gleiche Befehle können verschiedenen Objekten gehören. Im Text zeigt der Name vor dem Punkt, welches Arkana handelt; im Blockmodus bestimmt das die ausgewählte Figur. Moosling brauchte wegen seines geringeren Schadens mehr Treffer. Am Teamstein am Westweg führt Eldren nun den zweiten Teamplatz und zwei getrennte Programme ein.',
    hints: ['Prüfe die ausgewählte Figur: Hier programmierst du Moosling. Ein Angriff außerhalb der direkten Nachbarschaft trifft nicht.', 'Zwei Schritte nach rechts bringen Moosling neben das Konstrukt. Danach bleibt es stehen und kann angreifen.', 'Das Konstrukt hat 3 LP, Mooslings Angriff zieht 1 LP ab. Vergleiche die nötige Anzahl mit Glutlings Angriff und ergänze dein Programm.'] },
  { id: 'q08-team', title: 'Zwei Programme, ein Ziel', target: 'Teamstein am Westweg', x: 610, y: 530,
    kind: 'combat', team: ['moosling', 'glutling'], start: { x: 1, y: 3 }, companion: { x: 1, y: 2 }, enemy: { x: 4, y: 3 }, enemyHp: 6,
    introduction: 'Jetzt arbeiten zwei deiner gesammelten Arkana zusammen. Mit dieser Einführung erhältst du einen zweiten Teamplatz. Für die Aufgabe werden Moosling zuerst und Glutling danach ins aktive Team gesetzt. Beide müssen zuvor gesammelt sein.\n\nWähle im Editor jeweils die Figur aus, deren Programm du bearbeiten möchtest. Moosling und Glutling haben getrennte Programme. Beim Ausführen handelt zuerst Moosling mit seiner nächsten Anweisung, danach Glutling mit seiner nächsten Anweisung. Diese feste Reihenfolge heißt Ausführungsreihenfolge. Ein beendetes Programm wartet, während das andere weiterläuft.\n\nBeide starten auf verschiedenen Zeilen. Das Konstrukt hat 6 LP und greift nicht zurück. Mooslings Angriff verursacht 1 Schaden, Glutlings 2. Beide Arkana müssen mindestens einmal wirksam treffen. Du planst also ihre Wege und Angriffe aufeinander abgestimmt. Das heißt Koordination. Ein Sieg mit nur einem der beiden Programme erfüllt diese Teamaufgabe noch nicht.\n\nZwei Figuren können niemals auf demselben Feld stehen. Ein besetztes Feld blockiert die Bewegung. Nutze die getrennten Wege: Moosling startet auf der Zeile des Konstrukts, Glutling eine Zeile darüber. Mit „Nächsten Schritt ausführen“ siehst du die nächste Anweisung beider Programme. „Programm ausführen“ spielt den ganzen gemeinsamen Ablauf ab. Bei Pause kannst du jede einzelne Aktion prüfen.',
    objective: 'Besiege das passive Konstrukt mit beiden Arkana. Moosling und Glutling müssen jeweils mindestens einen Treffer verursachen. Schreibe für jedes ein eigenes Programm; Moosling handelt immer zuerst.',
    introduces: [], allowed: ['moveRight', 'moveUp', 'attack', 'repeat'], starter: '', starters: { moosling: 'moosling.moveRight();', glutling: '' },
    reward: 'Ihr habt das Konstrukt gemeinsam ausgeschaltet! Beide Objekte besaßen ein eigenes Programm und haben wirksam getroffen. Die Ausführungsreihenfolge blieb Moosling vor Glutling; ein fertiges Programm wartete auf das andere. Du hast ihre Bewegungen und Angriffe koordiniert. Dein zweiter Teamplatz bleibt verfügbar. Im Nachschlagebuch findest du Objekt, Ausführungsreihenfolge und Koordination mit Beispielen. Weitere Spezialfähigkeiten erhalten später eigene Einführungen; du kannst jetzt Quests wiederholen und mit deinem Team frei trainieren.',
    hints: ['Wähle nacheinander beide Figuren im Editor und ergänze ihre eigenen Programme. Nur das gerade sichtbare Programm zu schreiben reicht für die Teamaufgabe nicht.', 'Moosling braucht zwei Schritte nach rechts bis neben das Konstrukt. Glutling startet eine Zeile darüber: Mit drei Schritten nach rechts steht es direkt oberhalb des Konstrukts. Die getrennten Zeilen vermeiden belegte Felder.', 'Zum Beispiel können zwei Treffer von Moosling insgesamt 2 LP abziehen. Zwei Treffer von Glutling ziehen zusammen weitere 4 LP ab. Achte darauf, dass jedes erst nach seinem eigenen Weg angreift.'] },
];
export const getLesson = (id: LessonId): WorldQuest => WORLD_QUESTS.find((quest) => quest.id === id)!;
export const lessonActors = (quest: WorldQuest): readonly ArkanId[] => quest.team ?? ['glutling'];
export const lessonPrograms = (quest: WorldQuest): ProgramSources => quest.starters ? { ...quest.starters } : { [lessonActors(quest)[0]]: quest.starter };

export interface EncounterPresentation { title: string; instructions: string; objective: string; hints: readonly string[]; mode: 'lesson' | 'training' }
export interface QuestCompletion { lesson: LessonId; title: string; text: string; nextObjective: string; repeated: boolean }
export type CampaignAction = 'meet-eldren' | 'recruit-moosling' | 'recruit-glutling' | 'open-training' | `lesson:${LessonId}` | `prepare-lesson:${LessonId}`;
export interface CampaignDialog { speaker: string; text: string; action?: CampaignAction; actionLabel?: string }
