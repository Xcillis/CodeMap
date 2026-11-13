import type { MissionId } from '../combat/BattleSession';

export interface WorldQuest {
  id: MissionId;
  title: string;
  target: string;
  x: number;
  y: number;
  introduction: string;
  reward: string;
}

export const WORLD_QUESTS: readonly WorldQuest[] = [
  { id: 1, title: 'Der versperrte Runenpfad', target: 'Runenstein am Weg', x: 790, y: 690,
    introduction: 'Ein Übungskonstrukt blockiert den Runenpfad. Lass deinen Arkan wiederholt herangehen und das Konstrukt ausschalten. Lernziel: Schleifen beobachten und verändern.',
    reward: 'Der Runenpfad ist frei. Deine Arkana lernen die Abfrage der Gegnernähe. Am östlichen Weg wurde ein Feuer-Arkana gesehen.' },
  { id: 2, title: 'Das wandernde Konstrukt', target: 'Wanderndes Konstrukt', x: 1120, y: 575,
    introduction: 'Dieses Konstrukt kommt auf deinen Arkan zu. Prüfe während der Schleife, ob es bereits benachbart ist. Lernziel: Bedingungen mit Wiederholungen verbinden.',
    reward: 'Das wandernde Konstrukt ist beruhigt. Dein zweiter Teamplatz ist frei. Entdecke Glutling am östlichen Weg und stelle ein Duo zusammen.' },
  { id: 3, title: 'Gemeinsam zum Osttor', target: 'Siegel am Osttor', x: 1480, y: 650,
    introduction: 'Am Osttor wartet ein verstärktes Konstrukt. Stelle ein Team aus zwei Arkanen zusammen und programmiere beide einzeln. Lernziel: zwei Programme koordinieren und freie Felder beachten.',
    reward: 'Das Siegel am Osttor leuchtet wieder. Die drei Weltquests sind abgeschlossen und können im Questjournal erneut gespielt werden.' },
];

export type CampaignAction = 'meet-eldren' | 'recruit-moosling' | 'recruit-glutling' | 'quest-1' | 'quest-2' | 'quest-3';
export interface CampaignDialog { speaker: string; text: string; action?: CampaignAction; actionLabel?: string }
