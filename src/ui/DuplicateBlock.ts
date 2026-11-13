import * as Blockly from 'blockly/core';

function duplicateState(block: Blockly.Block): Blockly.serialization.blocks.State | null {
  const state = Blockly.serialization.blocks.save(block, { addInputBlocks: true, addNextBlocks: true, doFullSerialization: true, saveIds: false });
  if (state) delete state.next;
  return state;
}

export function canDuplicateBlock(block: Blockly.Block): boolean {
  if (!block.type.startsWith('cm_') || block.type === 'cm_start' || block.isInFlyout || block.isShadow() || !block.isDeletable() || !block.isMovable() || block.workspace.options.readOnly) return false;
  const state = duplicateState(block);
  if (!state) return false;
  const counts: Record<string, number> = {};
  const visit = (node: Blockly.serialization.blocks.State): void => {
    counts[node.type] = (counts[node.type] ?? 0) + 1;
    for (const input of Object.values(node.inputs ?? {})) {
      const child = input.block ?? input.shadow;
      if (child) visit(child);
    }
    const next = node.next?.block ?? node.next?.shadow;
    if (next) visit(next);
  };
  visit(state);
  return block.workspace.isCapacityAvailable(counts);
}

/** Copy the selected block and all inner chains, never its following siblings. */
export function duplicateBlock(block: Blockly.Block): Blockly.Block | null {
  if (!canDuplicateBlock(block)) return null;
  const state = duplicateState(block)!;
  const position = block.getRelativeToSurfaceXY();
  state.x = position.x + (block.RTL ? -36 : 36);
  state.y = position.y + 36;
  const previousGroup = Blockly.Events.getGroup();
  if (!previousGroup) Blockly.Events.setGroup(true);
  try {
    return Blockly.serialization.blocks.append(state, block.workspace, { recordUndo: true });
  } finally {
    Blockly.Events.setGroup(previousGroup || false);
  }
}

export function registerDuplicateMenu(): void {
  const registry = Blockly.ContextMenuRegistry.registry;
  const defaultDuplicate = registry.getItem('blockDuplicate');
  if (defaultDuplicate?.preconditionFn) {
    const original = defaultDuplicate.preconditionFn;
    defaultDuplicate.preconditionFn = (scope, event) => scope.block?.type.startsWith('cm_') ? 'hidden' : original(scope, event);
  }
  const id = 'codemapDuplicate';
  if (registry.getItem(id)) registry.unregister(id);
  registry.register({
    id, scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK, weight: 1,
    displayText: 'Duplizieren',
    preconditionFn: ({ block }) => {
      if (!block?.type.startsWith('cm_') || block.type === 'cm_start' || block.isInFlyout) return 'hidden';
      return canDuplicateBlock(block) ? 'enabled' : 'disabled';
    },
    callback: ({ block }) => { if (block) duplicateBlock(block); },
  });
}
