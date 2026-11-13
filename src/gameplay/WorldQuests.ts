import type { GridPosition } from '../combat/types';
import type { SkillId } from './ArkanaCatalog';

export const LESSON_IDS = ['q01-glutspur', 'q02-basisangriff', 'q03-wiederkehr', 'q04-musterpfad'] as const;
export type LessonId = typeof LESSON_IDS[number];
export const isLessonId = (value: unknown): value is LessonId => LESSON_IDS.some((id) => value === id);
export type RepeatGoal = 'none' | 'movement' | 'movement-sequence';

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
  start: GridPosition;
  hints: readonly string[];
}
export type WorldQuest = QuestBase & (
  | { kind: 'puzzle'; goal: GridPosition; walls: readonly GridPosition[]; repeatGoal: RepeatGoal }
  | { kind: 'combat'; enemy: GridPosition; enemyHp: number }
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
    reward: 'Der Runenweg leuchtet! Du hast eine Bewegung mit einer Schleife wiederholt. Am Musterstein am Nordweg wartet ein Treppenweg auf dich: Dort wiederholst du mehrere Befehle gemeinsam. Auch Moosling wartet jetzt am östlichen Weg.',
    hints: ['Die Rune liegt auf derselben Zeile. Zähle die Felder zwischen Start und Ziel.', 'Verbinde einen Wiederholungsblock mit dem Start und lege „gehe nach rechts“ in sein Inneres.', 'Vier Schritte nach rechts führen zur Rune. Verändere die Wiederholungszahl und vergleiche deine Vorhersage mit dem Ablauf.'] },
  { id: 'q04-musterpfad', title: 'Der Musterpfad', target: 'Musterstein am Nordweg', x: 775, y: 400,
    kind: 'puzzle', start: { x: 1, y: 4 }, goal: { x: 4, y: 1 }, walls: patternWalls, repeatGoal: 'movement-sequence',
    introduction: 'Auf dem Treppenweg geht Glutling erst ein Feld nach rechts und dann ein Feld nach oben. Danach beginnt dasselbe Muster erneut. Die Steine lassen nur diesen Weg frei.\n\nLege beide Bewegungsanweisungen nacheinander in denselben Wiederholungsblock. Die Befehle in seinem Inneren werden bei jedem Durchlauf gemeinsam ausgeführt. Dieses Innere nennt man Schleifenrumpf. Du wiederholst also eine ganze Sequenz.\n\nErgänze den vorbereiteten Block und finde heraus, wie oft Glutling das Muster bis zur goldenen Rune braucht. Für den Questabschluss müssen die beiden Bewegungen gemeinsam in mindestens zwei Durchläufen derselben Schleife gelingen. Einzelbefehle oder getrennte Schleifen für jede Richtung reichen hier nicht. Beobachte mit „Nächsten Schritt ausführen“, wann der nächste Durchlauf beginnt.',
    objective: 'Erreiche die Rune. Wiederhole rechts und oben gemeinsam in derselben Schleife mindestens zweimal erfolgreich.',
    introduces: [], allowed: ['moveRight', 'moveUp', 'repeat'], starter: 'repeat(1, () => {\n  glutling.moveRight();\n});',
    reward: 'Der Musterpfad leuchtet! Glutling hat rechts und oben als gemeinsame Befehlsfolge wiederholt. Die Anweisungen im Schleifenrumpf wurden bei jedem Durchlauf in derselben Reihenfolge ausgeführt. Im Charakterfenster findest du das passende Beispiel. Die nächste Lernquest zu Entscheidungen folgt später; bis dahin kannst du bekannte Quests wiederholen oder frei trainieren.',
    hints: ['Schau dir die freien Felder an: Nach einem Schritt nach rechts führt der Weg nach oben. Dieses Paar von Bewegungen kommt mehrmals vor.', 'Stecke „gehe nach oben“ direkt unter „gehe nach rechts“ in das Innere desselben Wiederholungsblocks. Die Zahl gibt an, wie oft beide Befehle zusammen ausgeführt werden.', 'Der Treppenweg besteht aus drei Stufen. Jede Stufe braucht rechts und oben. Stelle die Wiederholungszahl passend ein und beobachte die sechs einzelnen Bewegungen.'] },
];
export const getLesson = (id: LessonId): WorldQuest => WORLD_QUESTS.find((quest) => quest.id === id)!;

export interface EncounterPresentation { title: string; instructions: string; objective: string; hints: readonly string[]; mode: 'lesson' | 'training' }
export type CampaignAction = 'meet-eldren' | 'recruit-moosling' | 'recruit-glutling' | 'open-training' | `lesson:${LessonId}` | `prepare-lesson:${LessonId}`;
export interface CampaignDialog { speaker: string; text: string; action?: CampaignAction; actionLabel?: string }
