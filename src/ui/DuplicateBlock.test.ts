// @vitest-environment jsdom
import * as Blockly from 'blockly/core';
import { describe, expect, it } from 'vitest';
import { loadNodes, workspaceNodes } from './SnapEditor';
import { canDuplicateBlock, duplicateBlock } from './DuplicateBlock';

describe('Block duplizieren', () => {
  it('kopiert den vollständigen verschachtelten Schleifenrumpf, aber keinen nachfolgenden Block', () => {
    const workspace = new Blockly.Workspace();
    try {
      loadNodes(workspace, [
        { kind: 'repeat', count: 2, body: [
          { kind: 'action', action: 'MOVE_TOWARD' },
          { kind: 'if', then: [{ kind: 'repeat', count: 3, body: [{ kind: 'action', action: 'ATTACK' }] }], otherwise: [{ kind: 'action', action: 'MOVE_TOWARD' }] },
        ] },
        { kind: 'action', action: 'ATTACK' },
      ], 'moosling');
      const start = workspace.getTopBlocks(false)[0];
      const original = start.getNextBlock()!;
      const following = original.getNextBlock()!;
      const before = workspaceNodes(workspace);
      const copy = duplicateBlock(original)!;
      expect(copy).not.toBeNull();
      expect(copy.getNextBlock()).toBeNull();
      expect(original.getNextBlock()).toBe(following);
      expect(copy.getFieldValue('COUNT')).toBe(2);
      const serialize = (block: Blockly.Block) => Blockly.serialization.blocks.save(block, { addNextBlocks: false, saveIds: false, addCoordinates: false });
      expect(serialize(copy)).toEqual(serialize(original));
      const originalIds = new Set(original.getDescendants(false).map((block) => block.id));
      expect(copy.getDescendants(false).every((block) => !originalIds.has(block.id))).toBe(true);
      copy.setFieldValue(4, 'COUNT');
      copy.getInputTargetBlock('BODY')!.dispose(true);
      expect(original.getFieldValue('COUNT')).toBe(2);
      expect(original.getInputTargetBlock('BODY')!.type).toBe('cm_move');
      expect(workspaceNodes(workspace)).toEqual(before);
    } finally { workspace.dispose(); }
  });

  it('dupliziert eine einzelne Aktion ohne den restlichen Stapel', () => {
    const workspace = new Blockly.Workspace();
    try {
      loadNodes(workspace, [{ kind: 'action', action: 'MOVE_TOWARD' }, { kind: 'action', action: 'ATTACK' }], 'glutling');
      const original = workspace.getTopBlocks(false)[0].getNextBlock()!;
      const copy = duplicateBlock(original)!;
      expect(copy.type).toBe('cm_move');
      expect(copy.getParent()).toBeNull();
      expect(copy.getNextBlock()).toBeNull();
      expect(workspace.getAllBlocks(false)).toHaveLength(4);
      const restored = new Blockly.Workspace();
      try {
        Blockly.serialization.workspaces.load(Blockly.serialization.workspaces.save(workspace), restored);
        expect(restored.getTopBlocks(false)).toHaveLength(2);
      } finally { restored.dispose(); }
    } finally { workspace.dispose(); }
  });

  it('beachtet die Kapazität für den ganzen Rumpf und schützt den Startblock', () => {
    const workspace = new Blockly.Workspace(new Blockly.Options({ maxBlocks: 6 }));
    try {
      loadNodes(workspace, [{ kind: 'repeat', count: 2, body: [{ kind: 'action', action: 'MOVE_TOWARD' }, { kind: 'action', action: 'ATTACK' }] }], 'moosling');
      const start = workspace.getTopBlocks(false)[0];
      expect(canDuplicateBlock(start)).toBe(false);
      expect(duplicateBlock(start)).toBeNull();
      expect(canDuplicateBlock(start.getNextBlock()!)).toBe(false);
      expect(duplicateBlock(start.getNextBlock()!)).toBeNull();
      expect(workspace.getAllBlocks(false)).toHaveLength(4);
    } finally { workspace.dispose(); }
  });

  it('kann eine Kopie einschließlich Rumpf mit einem Undo entfernen und wiederherstellen', async () => {
    const workspace = new Blockly.Workspace();
    try {
      loadNodes(workspace, [{ kind: 'repeat', count: 3, body: [{ kind: 'action', action: 'ATTACK' }] }], 'moosling');
      await new Promise((resolve) => setTimeout(resolve, 10));
      workspace.clearUndo();
      const copy = duplicateBlock(workspace.getTopBlocks(false)[0].getNextBlock()!)!;
      const id = copy.id;
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(workspace.getAllBlocks(false)).toHaveLength(5);
      workspace.undo(false);
      expect(workspace.getBlockById(id)).toBeNull();
      expect(workspace.getAllBlocks(false)).toHaveLength(3);
      workspace.undo(true);
      expect(workspace.getBlockById(id)?.getInputTargetBlock('BODY')?.type).toBe('cm_attack');
      expect(workspace.getAllBlocks(false)).toHaveLength(5);
    } finally { workspace.dispose(); }
  });
});
