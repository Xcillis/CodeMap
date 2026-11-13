import type { GridPosition } from '../combat/types';
import type { SkillId } from './ArkanaCatalog';

export const LESSON_IDS = ['q01-glutspur', 'q02-basisangriff', 'q03-wiederkehr'] as const;
export type LessonId = typeof LESSON_IDS[number];
export const isLessonId = (value: unknown): value is LessonId => LESSON_IDS.some((id) => value === id);

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
  | { kind: 'puzzle'; goal: GridPosition; walls: readonly GridPosition[]; requireRepeat: boolean }
  | { kind: 'combat'; enemy: GridPosition; enemyHp: number }
);

export const WORLD_QUESTS: readonly WorldQuest[] = [
  { id: 'q01-glutspur', title: 'Glutlings erste Schritte', target: 'Runenstein am Weg', x: 790, y: 690,
    kind: 'puzzle', start: { x: 1, y: 3 }, goal: { x: 3, y: 2 }, walls: [{ x: 1, y: 2 }, { x: 2, y: 2 }], requireRepeat: false,
    introduction: 'Eine Anweisung bewegt Glutling genau ein Feld. Führe die erste Anweisung einzeln aus und beobachte sie. Ergänze danach eine Sequenz aus rechts und oben, die zur goldenen Rune führt. Die Reihenfolge ist wichtig: Steine blockieren den Weg.',
    objective: 'Erreiche die goldene Rune mit einer Folge von Bewegungsanweisungen.',
    introduces: ['moveRight', 'moveUp'], allowed: ['moveRight', 'moveUp'], starter: 'glutling.moveRight();',
    reward: 'Glutling hat den Runenstein erreicht! Du hast einzelne Anweisungen und ihre Reihenfolge ausprobiert. Am Übungskonstrukt lernst du als Nächstes den Basisangriff.',
    hints: ['Jeder Bewegungsbefehl wirkt auf genau ein Feld. Der erste Befehl ist bereits vorbereitet.', 'Die Steine liegen oberhalb von Glutlings Start. Gehe zuerst unter ihnen hindurch nach rechts.', 'Nach zwei Schritten nach rechts liegt die Rune ein Feld oberhalb. Stelle die Anweisungen in dieser Reihenfolge zusammen.'] },
  { id: 'q02-basisangriff', title: 'Das Übungskonstrukt', target: 'Übungskonstrukt', x: 1120, y: 575,
    kind: 'combat', start: { x: 1, y: 3 }, enemy: { x: 4, y: 3 }, enemyHp: 4,
    introduction: 'Neu: angreifen. glutling.attack() trifft ein direkt benachbartes Konstrukt für bis zu 2 Schaden. Das Konstrukt hat 4 LP und bleibt passiv. Kombiniere deine bekannten Bewegungsanweisungen mit Angriffen. Schleifen folgen in der nächsten Einführung.',
    objective: 'Gehe in Reichweite und schalte das passive Übungskonstrukt mit einer Sequenz aus.',
    introduces: ['attack'], allowed: ['moveRight', 'moveUp', 'attack'], starter: 'glutling.moveRight();',
    reward: 'Das Übungskonstrukt ist ausgeschaltet! Du hast Bewegung und Angriff kombiniert. Am langen Runenweg lernst du, gleiche Anweisungen zu wiederholen.',
    hints: ['Ein Angriff wirkt nur auf ein benachbartes Feld. Beobachte zuerst die Entfernung.', 'Zwei Schritte nach rechts bringen Glutling neben das Konstrukt.', 'Das Konstrukt hat 4 LP. Glutlings Basisangriff verursacht 2 Schaden: Wie viele Angriffe brauchst du?'] },
  { id: 'q03-wiederkehr', title: 'Der lange Runenweg', target: 'Runensäule am Ostweg', x: 1480, y: 650,
    kind: 'puzzle', start: { x: 1, y: 3 }, goal: { x: 5, y: 3 }, walls: [], requireRepeat: true,
    introduction: 'Neu: wiederholen. Ein repeat-Block führt seinen Rumpf so oft aus, wie seine Anzahl angibt. Ziehe einen Bewegungsbefehl hinein und finde die passende Anzahl. Im Text: repeat(2, () => { glutling.moveRight(); }); ist ein Beispiel mit zwei Durchläufen. Beobachte die Durchlaufanzeige.',
    objective: 'Erreiche die Rune. Benutze eine Schleife, die eine Bewegung mindestens zweimal ausführt.',
    introduces: ['repeat'], allowed: ['moveRight', 'repeat'], starter: '',
    reward: 'Der Runenweg leuchtet! Die ersten drei Lernquests sind abgeschlossen. Moosling wartet am östlichen Weg. In der freien Trainingsarena kannst du alle implementierten Befehle ausprobieren; weitere Lernquests folgen später.',
    hints: ['Die Rune liegt auf derselben Zeile. Zähle die Felder zwischen Start und Ziel.', 'Verbinde einen Wiederholungsblock mit dem Start und lege „gehe nach rechts“ in seinen Rumpf.', 'Vier Schritte nach rechts führen zur Rune. Verändere die Wiederholungszahl und vergleiche deine Vorhersage mit dem Ablauf.'] },
];
export const getLesson = (id: LessonId): WorldQuest => WORLD_QUESTS.find((quest) => quest.id === id)!;

export interface EncounterPresentation { title: string; instructions: string; objective: string; hints: readonly string[]; mode: 'lesson' | 'training' }
export type CampaignAction = 'meet-eldren' | 'recruit-moosling' | 'recruit-glutling' | 'open-training' | `lesson:${LessonId}`;
export interface CampaignDialog { speaker: string; text: string; action?: CampaignAction; actionLabel?: string }
