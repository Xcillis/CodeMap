import type { ExecutionTrace, LoopTrace, ProgramNode, ProgramStep } from './types';

interface Instruction { node: ProgramNode; path: string; loops: LoopTrace[]; conditions: ExecutionTrace['conditions'] }

function expand(nodes: readonly ProgramNode[], prefix = '', loops: LoopTrace[] = [], conditions: ExecutionTrace['conditions'] = []): Instruction[] {
  return nodes.flatMap((node, index): Instruction[] => {
    const path = `${prefix}${index}`;
    return node.kind === 'repeat'
      ? Array.from({ length: node.count }, (_, iteration) => expand(node.body, `${path}.body.`, [...loops, { path, iteration: iteration + 1, total: node.count }], conditions)).flat()
      : [{ node, path, loops, conditions }];
  });
}

export class ProgramRunner {
  private queue: Instruction[];
  lastTrace?: ExecutionTrace;
  constructor(nodes: readonly ProgramNode[]) { this.queue = expand(nodes); }
  next(adjacent: boolean): ProgramStep | undefined {
    this.lastTrace = undefined;
    while (this.queue.length) {
      const { node, path, loops, conditions } = this.queue.shift()!;
      if (node.kind === 'action') { this.lastTrace = { path, loops, conditions }; return node; }
      if (node.kind === 'if') this.queue.unshift(...expand(adjacent ? node.then : node.otherwise, `${path}.${adjacent ? 'then' : 'otherwise'}.`, loops, [...conditions, { path, value: adjacent }]));
    }
  }
  get done(): boolean { return this.queue.length === 0; }
}
