export type QuestStatus = 'active' | 'complete';

export interface QuestState {
  id: string;
  title: string;
  objective: string;
  status: QuestStatus;
}

export class QuestStore {
  private state: QuestState;

  constructor(state: QuestState) {
    this.state = { ...state };
  }

  get current(): Readonly<QuestState> {
    return this.state;
  }

  completeForInteraction(interactionId: string): boolean {
    if (interactionId !== 'arkanist-eldren' || this.state.status === 'complete') {
      return false;
    }

    this.state = { ...this.state, status: 'complete', objective: 'Quest abgeschlossen: Sprich mit dem Arkanisten.' };
    return true;
  }
}
