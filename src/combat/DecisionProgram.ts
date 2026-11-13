import type { ActionPlanResult, ArkanId, CombatAction, ProgramBlock, ProgramNode, ProgramStep } from './types';

export function programCost(nodes: readonly ProgramNode[]): number {
  return nodes.reduce((sum, node) => sum + (node.kind === 'action' ? 1 : node.kind === 'repeat' ? node.count * programCost(node.body) : Math.max(programCost(node.then), programCost(node.otherwise))), 0);
}

function programWork(nodes: readonly ProgramNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + (node.kind === 'repeat' ? node.count * programWork(node.body) : node.kind === 'if' ? Math.max(programWork(node.then), programWork(node.otherwise)) : 0), 0);
}

/** Parses a bounded grammar. No JavaScript evaluation or code generation runtime. */
export function compileActionPlan(source: string, expectedActor?: ArkanId): ActionPlanResult {
  try {
    if (source.length > 8000) throw new Error('Das Programm ist zu lang (maximal 8000 Zeichen).');
    const tokens: string[] = [];
    const positions: number[] = [];
    const sourceMap: Record<string, number> = {};
    const pattern = /\s*(=>|[a-zA-Z_]\w*|\d+|[().,;{}])/gy;
    let end = 0;
    while (end < source.length && source.slice(end).trim()) {
      pattern.lastIndex = end;
      const token = pattern.exec(source);
      if (!token) throw new Error('Unbekanntes Zeichen im Programm. Erlaubt sind Arkan-Befehle, repeat und if/else.');
      tokens.push(token[1]);
      positions.push(pattern.lastIndex - token[1].length);
      end = pattern.lastIndex;
    }
    let cursor = 0;
    let actor = expectedActor;
    const take = (value: string) => {
      if (tokens[cursor++] !== value) throw new Error(`„${value}“ erwartet. Prüfe Klammern und Befehle.`);
    };
    const owner = () => {
      const name = tokens[cursor++];
      if (name !== 'moosling' && name !== 'glutling') throw new Error('Befehle müssen einem Arkan zugeordnet sein.');
      actor ??= name;
      if (name !== actor) throw new Error(`Dieses Programm gehört zu ${actor}. Befehle anderer Arkane sind hier nicht erlaubt.`);
      take('.');
    };
    const group = (depth: number, prefix: string): ProgramNode[] => { take('{'); const nodes = sequence(depth, prefix); take('}'); return nodes; };
    const sequence = (depth: number, prefix = ''): ProgramNode[] => {
      if (depth > 8) throw new Error('Maximal acht Verschachtelungsebenen.');
      const nodes: ProgramNode[] = [];
      while (cursor < tokens.length && tokens[cursor] !== '}') {
        const path = `${prefix}${nodes.length}`;
        sourceMap[path] = source.slice(0, positions[cursor]).split('\n').length;
        if (tokens[cursor] === 'repeat') {
          cursor++; take('(');
          const count = Number(tokens[cursor++]);
          if (!Number.isInteger(count) || count < 1 || count > 6) throw new Error('Eine Schleife darf 1 bis 6 Wiederholungen enthalten.');
          take(','); take('('); take(')'); take('=>');
          const body = group(depth + 1, `${path}.body.`);
          take(')');
          nodes.push({ kind: 'repeat', count, body });
        } else if (tokens[cursor] === 'if') {
          cursor++; take('('); owner(); take('enemyAdjacent'); take(')');
          const then = group(depth + 1, `${path}.then.`);
          const otherwise = tokens[cursor] === 'else' ? (cursor++, group(depth + 1, `${path}.otherwise.`)) : [];
          nodes.push({ kind: 'if', then, otherwise });
        } else {
          owner();
          const command = tokens[cursor++];
          if (command !== 'moveForward' && command !== 'attack') throw new Error('Unbekannter Arkan-Befehl. Nutze moveForward() oder attack().');
          take('('); take(')');
          nodes.push({ kind: 'action', action: command === 'attack' ? 'ATTACK' : 'MOVE_TOWARD' });
        }
        if (tokens[cursor] === ';') cursor++;
      }
      return nodes;
    };
    const nodes = sequence(0);
    if (cursor !== tokens.length) throw new Error('Unerwartete schließende Klammer.');
    if (programCost(nodes) > 12) return { actor, nodes, error: 'Ein Programm darf höchstens zwölf ausgeführte Aktionen enthalten.' };
    if (programWork(nodes) > 512) return { actor, nodes, error: 'Zu viele verschachtelte Kontrollschritte (maximal 512).' };
    const blocks = legacyBlocks(nodes);
    const steps: ProgramStep[] = [];
    for (const block of blocks) for (let index = 0; index < block.count; index++) steps.push(block.kind === 'action' ? { kind: 'action', action: block.action } : { kind: 'condition', whenTrue: block.whenTrue, whenFalse: block.whenFalse });
    return { actor, nodes, blocks, steps, sourceMap };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Ungültiges Programm.' }; }
}

function legacyBlocks(nodes: readonly ProgramNode[]): ProgramBlock[] {
  const blocks: ProgramBlock[] = [];
  for (const node of nodes) {
    if (node.kind === 'action') blocks.push({ kind: 'action', count: 1, action: node.action });
    else if (node.kind === 'repeat' && node.body.length === 1 && node.body[0].kind === 'action') blocks.push({ kind: 'action', count: node.count, action: node.body[0].action });
    else if (node.kind === 'repeat' && node.body.length === 1 && node.body[0].kind === 'if') {
      const branch = node.body[0];
      if (branch.then.length !== 1 || branch.otherwise.length !== 1 || branch.then[0].kind !== 'action' || branch.otherwise[0].kind !== 'action') return [];
      blocks.push({ kind: 'condition', count: node.count, whenTrue: branch.then[0].action, whenFalse: branch.otherwise[0].action });
    } else return [];
  }
  return blocks;
}

export function blocksToNodes(blocks: readonly ProgramBlock[]): ProgramNode[] {
  return blocks.map((block) => ({ kind: 'repeat', count: block.count, body: block.kind === 'action' ? [{ kind: 'action', action: block.action }] : [{ kind: 'if', then: [{ kind: 'action', action: block.whenTrue }], otherwise: [{ kind: 'action', action: block.whenFalse }] }] }));
}

export function nodesToSource(nodes: readonly ProgramNode[], actor: ArkanId, indent = ''): string {
  return nodes.map((node) => {
    if (node.kind === 'action') return `${indent}${actor}.${node.action === 'ATTACK' ? 'attack' : 'moveForward'}();`;
    if (node.kind === 'repeat') return `${indent}repeat(${node.count}, () => {\n${nodesToSource(node.body, actor, indent + '  ')}\n${indent}});`;
    return `${indent}if (${actor}.enemyAdjacent) {\n${nodesToSource(node.then, actor, indent + '  ')}\n${indent}}${node.otherwise.length ? ` else {\n${nodesToSource(node.otherwise, actor, indent + '  ')}\n${indent}}` : ''}`;
  }).join('\n');
}

export function blocksToSource(blocks: readonly ProgramBlock[], actor: ArkanId = 'moosling'): string {
  return blocksToNodes(blocks).map((node) => nodesToSource([node], actor)).join('\n\n');
}

export const DEFAULT_PROGRAM = blocksToSource([{ kind: 'action', count: 3, action: 'MOVE_TOWARD' }, { kind: 'action', count: 3, action: 'ATTACK' }]);
export const CONDITION_PROGRAM = blocksToSource([{ kind: 'condition', count: 6, whenTrue: 'ATTACK', whenFalse: 'MOVE_TOWARD' }]);
export const FORMATION_PROGRAM = blocksToSource([{ kind: 'action', count: 4, action: 'MOVE_TOWARD' }, { kind: 'action', count: 3, action: 'ATTACK' }]);
