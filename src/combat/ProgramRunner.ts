import type { ProgramNode, ProgramStep } from './types';

function expand(nodes: readonly ProgramNode[]): ProgramNode[] {
  return nodes.flatMap((node): ProgramNode[] => node.kind === 'repeat' ? Array.from({ length: node.count }, () => expand(node.body)).flat() : [node]);
}

export class ProgramRunner {
  private queue: ProgramNode[];
  constructor(nodes: readonly ProgramNode[]) { this.queue = expand(nodes); }
  next(adjacent: boolean): ProgramStep | undefined {
    while (this.queue.length) {
      const node = this.queue.shift()!;
      if (node.kind === 'action') return node;
      if (node.kind === 'if') this.queue.unshift(...expand(adjacent ? node.then : node.otherwise));
    }
  }
  get done(): boolean { return this.queue.length === 0; }
}
