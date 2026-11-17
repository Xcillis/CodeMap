import type { ProgramSources } from '../combat/types';
import type { LessonId } from '../gameplay/WorldQuests';
export const QUEST_SOLUTIONS: Record<LessonId, ProgramSources> = {
  'q21-solangeweg': { glutling: 'while (glutling.pathAheadClear) { glutling.moveForward(); } glutling.turnLeft(); glutling.moveForward();' },
  'q22-solangekampf': { glutling: 'while (glutling.enemyAlive) { if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveTowardEnemy(); } }' },
  'q23-brandfolge': { glutling: 'glutling.ignite(); glutling.flameStrike();' },
  'q24-frostfolge': { frostmolch: 'frostmolch.chill(); frostmolch.chill(); frostmolch.waterStrike(); frostmolch.waterStrike();' },
  'q25-loeschen': { glutling: 'glutling.wait(); glutling.wait(); glutling.flameStrike();', frostmolch: 'frostmolch.extinguishEnemy(); frostmolch.extinguishAlly(); frostmolch.wait();' },
  'q26-eisbruecke': { frostmolch: 'repeat(3, () => { frostmolch.chill(); frostmolch.moveForward(); }); frostmolch.moveForward();' },

  'q01-glutspur': { glutling: 'glutling.moveForward(); glutling.moveForward(); glutling.turnLeft(); glutling.moveForward();' },
  'q02-basisangriff': { glutling: 'glutling.moveForward(); glutling.moveForward(); glutling.attack(); glutling.attack();' },
  'q03-wiederkehr': { glutling: 'repeat(4, () => { glutling.moveForward(); });' },
  'q04-musterpfad': { glutling: 'repeat(3, () => { glutling.moveForward(); glutling.turnLeft(); glutling.moveForward(); glutling.turnRight(); });' },
  'q05-aufmerksam': { glutling: 'if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveTowardEnemy(); }' },
  'q06-waechter': { glutling: 'repeat(5, () => { if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveTowardEnemy(); } });' },
  'q07-moosling': { moosling: 'repeat(2, () => { moosling.moveForward(); }); repeat(3, () => { moosling.attack(); });' },
  'q08-team': { moosling: 'repeat(2, () => { moosling.moveForward(); }); repeat(2, () => { moosling.attack(); });', glutling: 'repeat(3, () => { glutling.moveForward(); }); repeat(2, () => { glutling.attack(); });' },
  'q09-schachtelpfad': { glutling: 'repeat(3, () => { repeat(2, () => { glutling.moveForward(); }); glutling.turnLeft(); glutling.moveForward(); glutling.turnRight(); });' },
  'q10-schachtelkampf': { glutling: 'repeat(2, () => { repeat(2, () => { glutling.moveForward(); }); repeat(2, () => { glutling.moveBackward(); }); glutling.turnLeft(); glutling.moveForward(); glutling.turnRight(); });' },
  'q11-schleifenwache': { glutling: 'repeat(2, () => { glutling.moveForward(); }); repeat(3, () => { glutling.attack(); });' },
  'q12-steinrutsch': { glutling: 'repeat(4, () => { repeat(2, () => { glutling.moveForward(); }); glutling.turnLeft(); });' },
  'q13-lichtpfad': { glutling: 'repeat(4, () => { if (glutling.pathAheadClear) { glutling.moveForward(); } else { glutling.turnLeft(); glutling.moveForward(); glutling.turnRight(); } });' },
  'q14-feuerprobe': { glutling: 'glutling.ignite(); glutling.moveForward(); glutling.flameStrike(); glutling.flameStrike();' },
  'q15-wurzelschutz': { moosling: 'moosling.vineSnare(); moosling.moveForward(); repeat(3, () => { moosling.vineStrike(); });' },
  'q16-heilmoos': { moosling: 'moosling.healingMoss(); repeat(3, () => { moosling.vineStrike(); });' },
  'q17-teamrollen': {
    glutling: 'glutling.ignite(); glutling.wait(); glutling.moveForward(); glutling.turnLeft(); glutling.moveForward(); glutling.turnRight(); glutling.ignite(); glutling.flameStrike(); glutling.flameStrike();',
    moosling: 'moosling.vineSnare(); moosling.healingMoss(); moosling.turnRight(); moosling.moveForward(); moosling.turnLeft(); moosling.wait(); moosling.vineStrike(); moosling.healingMoss(); moosling.vineStrike(); moosling.vineStrike(); moosling.vineStrike();',
  },
  'q18-steinpanzer': { felsbock: 'felsbock.stoneArmor(); repeat(3, () => { felsbock.stoneStrike(); });' },
  'q19-deckung': {
    glutling: 'glutling.wait(); glutling.flameStrike(); glutling.flameStrike();',
    felsbock: 'felsbock.coverAlly(); felsbock.stoneArmor(); felsbock.wait();',
  },
  'q20-dreiklang': {
    glutling: 'glutling.ignite(); repeat(5, () => { glutling.flameStrike(); });',
    moosling: 'moosling.healingMoss(); moosling.wait(); moosling.wait(); moosling.healingMoss(); moosling.wait();',
    felsbock: 'felsbock.coverAlly(); felsbock.stoneArmor(); felsbock.wait(); felsbock.coverAlly(); felsbock.wait();',
  },
};
