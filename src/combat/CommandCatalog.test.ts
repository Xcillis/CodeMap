import { describe, expect, it } from 'vitest';
import { availableCommands, commandSource, nodesCapabilityError, programCapabilityError } from './CommandCatalog';
import { compileActionPlan } from './DecisionProgram';
import { BattleSession, missionPrograms } from './BattleSession';
import { getLesson, WORLD_QUESTS } from '../gameplay/WorldQuests';
import { BASIC_MOVEMENT } from '../gameplay/ArkanaCatalog';

describe('Fähigkeitsfreigaben', () => {
  it('bietet in jeder Quest alle vier Grundrichtungen mit gültigen objektbezogenen Textbefehlen an', () => {
    for (const quest of WORLD_QUESTS) for (const actor of ['glutling', 'moosling'] as const) {
      const commands = availableCommands(actor, 0, quest.allowed).filter((command) => command.category === 'movement' && command.id !== 'move');
      expect(commands.map((command) => command.id), quest.id).toEqual([...BASIC_MOVEMENT]);
      const parsed = compileActionPlan(commands.map((command) => commandSource(command, actor)).join('\n'), actor);
      expect(parsed.error).toBeUndefined(); expect(nodesCapabilityError(parsed.nodes!, actor, 0, quest.allowed)).toBeUndefined();
      expect(new Set(quest.allowed).size).toBe(quest.allowed.length);
    }
  });
  it('zeigt Q05-Wahrnehmung und liefert eine ausfüllbare Textvorlage statt der fertigen Entscheidung', () => {
    const commands = availableCommands('glutling', 0, getLesson('q05-aufmerksam').allowed);
    expect(commands.map((command) => command.id)).toContain('condition'); expect(commands.map((command) => command.id)).not.toContain('repeat');
    const template = commandSource(commands.find((command) => command.id === 'condition')!, 'glutling');
    expect(template).toContain('else'); expect(compileActionPlan(template, 'glutling').nodes).toEqual([{ kind: 'if', then: [], otherwise: [] }]);
  });
  it('berücksichtigt Lernstand getrennt je Arkan', () => {
    expect(availableCommands('moosling', 1).map((command) => command.id)).not.toContain('condition');
    expect(availableCommands('moosling', 2).map((command) => command.id)).toContain('condition');
    expect(availableCommands('glutling', 3).map((command) => command.id)).not.toContain('condition');
    expect(availableCommands('glutling', 2).map((command) => command.id)).toEqual(['moveRight', 'moveLeft', 'moveUp', 'moveDown']);
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
