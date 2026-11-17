import type { ConditionId, ExecutionTrace, LoopTrace, ProgramNode, ProgramStep } from './types';
import { MAX_PROGRAM_ACTIONS } from './DecisionProgram';

interface Instruction { node: ProgramNode; path: string; loops: LoopTrace[]; conditions: ExecutionTrace['conditions']; iteration?: number }

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
  private actions = 0;
  private controls = 0;
  error?: string;
  readonly whileChecks: { path: string; condition: ConditionId; value: boolean; iteration: number }[] = [];
  lastTrace?: ExecutionTrace;
  constructor(nodes: readonly ProgramNode[]) { this.queue = expand(nodes); }
  next(query: boolean | ((condition: ConditionId) => boolean)): ProgramStep | undefined {
    this.lastTrace = undefined;
    const exits: ExecutionTrace['conditions'] = [];
    while (this.queue.length) {
      const { node, path, loops, conditions, iteration = 0 } = this.queue.shift()!;
      if (++this.controls > 512) { this.error = 'Ausführung angehalten: Die Bedingung wird zu oft ohne Fortschritt geprüft (512 Kontrollschritte). Prüfe den Schleifenrumpf und die Abbruchbedingung.'; this.queue = []; return; }
      if (node.kind === 'action') {
        if (++this.actions > MAX_PROGRAM_ACTIONS) { this.error = 'Ausführung angehalten: 64 Aktionen erreicht. Prüfe, ob die Bedingung der solange-Schleife falsch werden kann.'; this.queue = []; return; }
        this.lastTrace = { path, loops, conditions: [...conditions, ...exits] }; return node;
      }
      if (node.kind === 'while') {
        const value = typeof query === 'boolean' ? query : query(node.condition);
        this.whileChecks.push({ path, condition: node.condition, value, iteration: iteration + 1 });
        if (value) this.queue.unshift(...expand(node.body, `${path}.body.`, [...loops, { path, iteration: iteration + 1, total: 0, kind: 'while' }], [...conditions, { path, value, condition: node.condition }]), { node, path, loops, conditions, iteration: iteration + 1 });
        else exits.push({ path, value, condition: node.condition });
      }
      if (node.kind === 'if') {
        const value = typeof query === 'boolean' ? query : query(node.condition ?? 'enemyAdjacent');
        this.queue.unshift(...expand(value ? node.then : node.otherwise, `${path}.${value ? 'then' : 'otherwise'}.`, loops, [...conditions, { path, value, ...(node.condition ? { condition: node.condition } : {}) }]));
      }
    }
  }
  get done(): boolean { return this.queue.length === 0; }
}
