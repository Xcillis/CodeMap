import { describe, expect, it } from 'vitest';
import { availableCommands, programCapabilityError } from './CommandCatalog';
import { compileActionPlan } from './DecisionProgram';
import { BattleSession, missionPrograms } from './BattleSession';

describe('Fähigkeitsfreigaben', () => {
  it('berücksichtigt Lernstand getrennt je Arkan', () => {
    expect(availableCommands('moosling', 1).map((command) => command.id)).not.toContain('condition');
    expect(availableCommands('moosling', 2).map((command) => command.id)).toContain('condition');
    expect(availableCommands('glutling', 3).map((command) => command.id)).not.toContain('condition');
    expect(availableCommands('glutling', 2)).toEqual([]);
  });

  it('zeigt ohne erlernten Angriff keine Angriffs- oder Bedingungsvorlage', () => {
    expect(availableCommands('moosling', 3, ['moveForward', 'repeat']).map((command) => command.id)).toEqual(['move', 'repeat']);
  });

  it('weist nicht gelernte Befehle auch bei direkter Texteingabe zurück', () => {
    const source = 'repeat(2, () => { if (glutling.enemyAdjacent) { glutling.attack(); } else { glutling.moveForward(); } });';
    const parsed = compileActionPlan(source, 'glutling');
    expect(programCapabilityError(parsed.blocks!, 'glutling', 3)).toContain('enemyAdjacent');
    const session = new BattleSession(3);
    const before = session.snapshot;
    expect(session.execute({ ...missionPrograms(3), glutling: source }, true)).toContain('noch nicht gelernt');
    expect(session.snapshot).toEqual(before);
  });

  it('blockiert Wahrnehmung im ersten Training auch für Moosling', () => {
    const session = new BattleSession(1);
    expect(session.execute(missionPrograms(2), true)).toContain('noch nicht gelernt');
    expect(session.snapshot.tick).toBe(0);
  });
});
