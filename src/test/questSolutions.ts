import type { ProgramSources } from '../combat/types';
import type { LessonId } from '../gameplay/WorldQuests';
export const QUEST_SOLUTIONS: Record<LessonId, ProgramSources> = {
  'q01-glutspur': { glutling: 'glutling.moveRight(); glutling.moveRight(); glutling.moveUp();' },
  'q02-basisangriff': { glutling: 'glutling.moveRight(); glutling.moveRight(); glutling.attack(); glutling.attack();' },
  'q03-wiederkehr': { glutling: 'repeat(4, () => { glutling.moveRight(); });' },
  'q04-musterpfad': { glutling: 'repeat(3, () => { glutling.moveRight(); glutling.moveUp(); });' },
  'q05-aufmerksam': { glutling: 'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); }' },
  'q06-waechter': { glutling: 'repeat(5, () => { if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); } });' },
  'q07-moosling': { moosling: 'repeat(2, () => { moosling.moveRight(); }); repeat(3, () => { moosling.attack(); });' },
  'q08-team': { moosling: 'repeat(2, () => { moosling.moveRight(); }); repeat(2, () => { moosling.attack(); });', glutling: 'repeat(3, () => { glutling.moveRight(); }); repeat(2, () => { glutling.attack(); });' },
  'q09-schachtelpfad': { glutling: 'repeat(3, () => { repeat(2, () => { glutling.moveRight(); }); glutling.moveUp(); });' },
  'q10-schachtelkampf': { glutling: 'repeat(2, () => { repeat(2, () => { glutling.attack(); }); });' },
  'q11-schleifenwache': { glutling: 'repeat(2, () => { glutling.moveRight(); }); repeat(3, () => { glutling.attack(); });' },
  'q12-steinrutsch': { glutling: 'repeat(2, () => { repeat(2, () => { glutling.moveRight(); }); glutling.moveUp(); });' },
  'q13-lichtpfad': { glutling: 'repeat(4, () => { if (glutling.pathRightClear) { glutling.moveRight(); } else { glutling.moveUp(); } });' },
};
