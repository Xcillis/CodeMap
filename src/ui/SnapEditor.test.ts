// @vitest-environment jsdom
import * as Blockly from 'blockly/core';
import { describe, expect, it } from 'vitest';
import { blockAtPath, loadNodes, workspaceNodes, snapToolbox, restoreWorkspaceState } from './SnapEditor';
import { compileActionPlan, nodesToSource } from '../combat/DecisionProgram';
import { BattleSession } from '../combat/BattleSession';

describe('Echte Blockly-Verbindungen', () => {
  it('findet den aktiven Block über verschachtelte Zweige und ignoriert deaktivierte Geschwister', () => {
    const workspace = new Blockly.Workspace();
    try {
      loadNodes(workspace, [
        { kind: 'action', action: 'ATTACK' },
        { kind: 'repeat', count: 2, body: [{ kind: 'if', then: [{ kind: 'action', action: 'ATTACK' }], otherwise: [{ kind: 'action', action: 'MOVE_TOWARD' }] }] },
      ], 'moosling');
      const first = blockAtPath(workspace, '0')!;
      expect(first.type).toBe('cm_attack');
      expect(blockAtPath(workspace, '1.body.0.then.0')?.type).toBe('cm_attack');
      expect(blockAtPath(workspace, '1.body.0.otherwise.0')?.type).toBe('cm_move');
      first.setDisabledReason(true, 'test');
      expect(blockAtPath(workspace, '0.body.0.otherwise.0')?.type).toBe('cm_move');
      expect(blockAtPath(workspace, '99')).toBeNull();
    } finally { workspace.dispose(); }
  });
  it('beschriftet Blöcke ohne Objektnamen und qualifiziert nur den Textcode', () => {
    const workspace = new Blockly.Workspace();
    try {
      loadNodes(workspace, [{ kind: 'action', action: 'ATTACK' }, { kind: 'if', then: [{ kind: 'action', action: 'MOVE_TOWARD' }], otherwise: [] }], 'glutling');
      const labels = workspace.getAllBlocks(false).map((block) => block.toString()).join(' ');
      expect(labels).toContain('angreifen');
      expect(labels).not.toMatch(/moosling|glutling/);
      expect(nodesToSource(workspaceNodes(workspace), 'glutling')).toContain('glutling.attack()');
      expect(JSON.stringify(snapToolbox('glutling', 3))).not.toContain('ACTOR');
    } finally { workspace.dispose(); }
  });

  it('lädt ältere Entwürfe mit ACTOR-Feldern ohne Verbindungsverlust', () => {
    const saved = JSON.stringify({ blocks: { languageVersion: 0, blocks: [{ type: 'cm_start', x: 40, y: 60, next: { block: { type: 'cm_repeat', fields: { COUNT: 2 }, inputs: { BODY: { block: { type: 'cm_attack', fields: { ACTOR: 'moosling' } } } } } } }] } });
    const workspace = new Blockly.Workspace();
    try {
      Blockly.serialization.workspaces.load(restoreWorkspaceState(saved), workspace);
      expect(workspaceNodes(workspace)).toEqual([{ kind: 'repeat', count: 2, body: [{ kind: 'action', action: 'ATTACK' }] }]);
      expect(JSON.stringify(Blockly.serialization.workspaces.save(workspace))).not.toContain('ACTOR');
    } finally { workspace.dispose(); }
  });
  it('rastet mehrere Aktionen in einen Wiederholungsblock ein und führt sie aus', () => {
    const workspace = new Blockly.Workspace();
    try {
      const start = workspace.newBlock('cm_start');
      const repeat = workspace.newBlock('cm_repeat'); repeat.setFieldValue(3, 'COUNT');
      const move = workspace.newBlock('cm_move');
      const attack = workspace.newBlock('cm_attack');
      start.nextConnection!.connect(repeat.previousConnection!);
      repeat.getInput('BODY')!.connection!.connect(move.previousConnection!);
      move.nextConnection!.connect(attack.previousConnection!);
      const nodes = workspaceNodes(workspace);
      expect(nodes).toEqual([{ kind: 'repeat', count: 3, body: [{ kind: 'action', action: 'MOVE_TOWARD' }, { kind: 'action', action: 'ATTACK' }] }]);
      const session = new BattleSession(1);
      session.execute({ moosling: nodesToSource(nodes, 'moosling') }, true);
      expect(session.snapshot.tick).toBe(6);
    } finally { workspace.dispose(); }
  });
  it('erhält geschachtelte Schleifen und Bedingungen beim Block-Text-Roundtrip', () => {
    const source = 'repeat(2, () => { repeat(2, () => { if (moosling.enemyAdjacent) { moosling.attack(); } else { moosling.moveForward(); } }); });';
    const parsed = compileActionPlan(source, 'moosling');
    const workspace = new Blockly.Workspace();
    try {
      loadNodes(workspace, parsed.nodes!, 'moosling');
      expect(workspaceNodes(workspace)).toEqual(parsed.nodes);
      expect(compileActionPlan(nodesToSource(workspaceNodes(workspace), 'moosling'), 'moosling').nodes).toEqual(parsed.nodes);
    } finally { workspace.dispose(); }
  });
  it('nimmt abgetrennte Blöcke nicht in den Ablauf auf und erlaubt einen leeren Start', () => {
    const workspace = new Blockly.Workspace();
    try {
      workspace.newBlock('cm_start'); workspace.newBlock('cm_attack');
      expect(workspaceNodes(workspace)).toEqual([]);
      const state = Blockly.serialization.workspaces.save(workspace);
      Blockly.serialization.workspaces.load(state, workspace);
      expect(workspace.getTopBlocks(false)).toHaveLength(2);
    } finally { workspace.dispose(); }
  });
  it('filtert auch die echte Blockly-Palette nach gelernten Fähigkeiten', () => {
    expect(JSON.stringify(snapToolbox('moosling', 1))).not.toContain('cm_if');
    expect(JSON.stringify(snapToolbox('moosling', 2))).toContain('cm_if');
    expect(JSON.stringify(snapToolbox('glutling', 3))).not.toContain('cm_if');
  });
});
