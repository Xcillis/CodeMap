import * as Blockly from 'blockly/core';
import * as German from 'blockly/msg/de';
import { availableCommands, COMMAND_CATEGORIES } from '../combat/CommandCatalog';
import { nodesToSource } from '../combat/DecisionProgram';
import type { ArkanId, ProgramNode } from '../combat/types';
import { registerDuplicateMenu } from './DuplicateBlock';

Blockly.setLocale(Object.entries(German).reduce<Record<string, string>>((messages, [key, value]) => {
  if (typeof value === 'string') messages[key] = value;
  return messages;
}, {}));
registerDuplicateMenu();
Blockly.defineBlocksWithJsonArray([
  { type: 'cm_start', message0: 'Wenn Programm ausgeführt wird', nextStatement: 'Action', colour: '#d6a728', tooltip: 'Nur die hier verbundenen Blöcke werden ausgeführt.' },
  { type: 'cm_move', message0: 'vorwärts gehen', previousStatement: 'Action', nextStatement: 'Action', colour: '#357bd0', tooltip: 'Der ausgewählte Arkan geht ein Feld zum Gegner. Belegte Felder blockieren den Schritt.' },
  { type: 'cm_attack', message0: 'angreifen', previousStatement: 'Action', nextStatement: 'Action', colour: '#b84b43', tooltip: 'Der ausgewählte Arkan greift einen direkt benachbarten Gegner an.' },
  { type: 'cm_repeat', message0: 'wiederhole %1 mal', args0: [{ type: 'field_number', name: 'COUNT', value: 3, min: 1, max: 6, precision: 1 }], message1: '%1', args1: [{ type: 'input_statement', name: 'BODY', check: 'Action' }], previousStatement: 'Action', nextStatement: 'Action', colour: '#d39b26', tooltip: 'Alle eingerasteten Befehle im Inneren werden wiederholt.' },
  { type: 'cm_if', message0: 'falls Gegner nahe', message1: 'dann %1', args1: [{ type: 'input_statement', name: 'THEN', check: 'Action' }], message2: 'sonst %1', args2: [{ type: 'input_statement', name: 'ELSE', check: 'Action' }], previousStatement: 'Action', nextStatement: 'Action', colour: '#8960b6', tooltip: 'Prüft für den ausgewählten Arkan die Nähe und führt einen der verbundenen Zweige aus.' },
]);

/** Shared conversion also works on a headless Blockly workspace in tests. */
export function workspaceNodes(workspace: Blockly.Workspace): ProgramNode[] {
  const starts = workspace.getTopBlocks(false).filter((block) => block.type === 'cm_start');
  if (starts.length > 1) throw new Error('Es darf nur einen Startblock geben.');
  const read = (first: Blockly.Block | null): ProgramNode[] => {
    const nodes: ProgramNode[] = [];
    for (let block = first; block; block = block.getNextBlock()) {
      if (!block.isEnabled()) continue;
      if (block.type === 'cm_move' || block.type === 'cm_attack') nodes.push({ kind: 'action', action: block.type === 'cm_move' ? 'MOVE_TOWARD' : 'ATTACK' });
      else if (block.type === 'cm_repeat') nodes.push({ kind: 'repeat', count: Number(block.getFieldValue('COUNT')), body: read(block.getInputTargetBlock('BODY')) });
      else if (block.type === 'cm_if') nodes.push({ kind: 'if', then: read(block.getInputTargetBlock('THEN')), otherwise: read(block.getInputTargetBlock('ELSE')) });
      else throw new Error('Unbekannter Block.');
    }
    return nodes;
  };
  return read(starts[0]?.getNextBlock() ?? null);
}

interface BlockState {
  type: string;
  fields?: Record<string, string | number>;
  inputs?: Record<string, { block: BlockState }>;
  next?: { block: BlockState };
  x?: number;
  y?: number;
}

export function loadNodes(workspace: Blockly.Workspace, nodes: readonly ProgramNode[], _actor: ArkanId): void {
  const chain = (list: readonly ProgramNode[]): BlockState | undefined => {
    const blocks = list.map((node): BlockState => {
      if (node.kind === 'action') return { type: node.action === 'ATTACK' ? 'cm_attack' : 'cm_move' };
      if (node.kind === 'repeat') {
        const body = chain(node.body);
        return { type: 'cm_repeat', fields: { COUNT: node.count }, inputs: body ? { BODY: { block: body } } : {} };
      }
      const then = chain(node.then);
      const otherwise = chain(node.otherwise);
      return { type: 'cm_if', inputs: { ...(then ? { THEN: { block: then } } : {}), ...(otherwise ? { ELSE: { block: otherwise } } : {}) } };
    });
    for (let index = 0; index < blocks.length - 1; index++) blocks[index].next = { block: blocks[index + 1] };
    return blocks[0];
  };
  const first = chain(nodes);
  Blockly.serialization.workspaces.load({ blocks: { languageVersion: 0, blocks: [{ type: 'cm_start', x: 30, y: 30, ...(first ? { next: { block: first } } : {}) }] } }, workspace);
}

export function snapToolbox(actor: ArkanId, mission: number): Blockly.utils.toolbox.ToolboxDefinition {
  const commands = availableCommands(actor, mission);
  const type = { move: 'cm_move', attack: 'cm_attack', condition: 'cm_if', repeat: 'cm_repeat' };
  return { kind: 'categoryToolbox', contents: COMMAND_CATEGORIES.filter((category) => commands.some((command) => command.category === category.id)).map((category) => ({
    kind: 'category', name: category.label, colour: category.color,
    contents: [...(category.id === 'flow' ? [{ kind: 'block', type: 'cm_start' }] : []), ...commands.filter((command) => command.category === category.id).map((command) => ({ kind: 'block', type: type[command.id], ...(command.id === 'repeat' ? { fields: { COUNT: 3 } } : {}) }))],
  })) };
}

/** Remove old display labels while retaining connections, positions and IDs. */
export function restoreWorkspaceState(saved: string): Record<string, unknown> {
  return JSON.parse(saved, (key, value: unknown) => {
    if (key === 'fields' && value && typeof value === 'object') {
      const { ACTOR: _oldLabel, ...fields } = value as Record<string, unknown>;
      return fields;
    }
    return value;
  }) as Record<string, unknown>;
}

export class SnapEditor {
  readonly workspace: Blockly.WorkspaceSvg;
  private loading = false;
  private actor: ArkanId = 'moosling';
  constructor(host: HTMLElement, onChange: () => void) {
    this.workspace = Blockly.inject(host, {
      toolbox: snapToolbox('moosling', 1), renderer: 'zelos', sounds: false,
      maxBlocks: 150,
      media: new URL('./blockly-media/', document.baseURI).href,
      trashcan: true, move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: false, startScale: .85, minScale: .35, maxScale: 1.4 },
      grid: { spacing: 20, length: 2, colour: '#53716e', snap: false },
    });
    this.workspace.addChangeListener((event) => {
      if (!this.loading && !event.isUiEvent) onChange();
    });
  }
  load(nodes: readonly ProgramNode[], actor: ArkanId, mission: number, saved?: string): void {
    this.loading = true;
    try {
      this.actor = actor;
      this.workspace.updateToolbox(snapToolbox(actor, mission));
      if (saved) Blockly.serialization.workspaces.load(restoreWorkspaceState(saved), this.workspace);
      else loadNodes(this.workspace, nodes, actor);
      this.workspace.clearUndo();
    } finally { this.loading = false; }
    this.resize();
  }
  source(): string { return nodesToSource(workspaceNodes(this.workspace), this.actor); }
  save(): string { return JSON.stringify(Blockly.serialization.workspaces.save(this.workspace)); }
  hasLooseBlocks(): boolean {
    const top = this.workspace.getTopBlocks(false);
    return top.some((block) => block.type !== 'cm_start') || top.filter((block) => block.type === 'cm_start').length > 1;
  }
  resize(): void { Blockly.svgResize(this.workspace); }
}
