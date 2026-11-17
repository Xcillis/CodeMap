/** Old world-direction instructions become relative instructions which restore the initial east heading. */
const LEGACY_METHODS = {
  moveRight: ['moveForward'], moveUp: ['turnLeft', 'moveForward', 'turnRight'],
  moveDown: ['turnRight', 'moveForward', 'turnLeft'], moveLeft: ['turnRight', 'turnRight', 'moveForward', 'turnRight', 'turnRight'],
} as const;
const LEGACY_BLOCKS: Record<string, readonly string[]> = {
  cm_move_right: ['cm_move_forward'], cm_move_up: ['cm_turn_left', 'cm_move_forward', 'cm_turn_right'],
  cm_move_down: ['cm_turn_right', 'cm_move_forward', 'cm_turn_left'], cm_move_left: ['cm_turn_right', 'cm_turn_right', 'cm_move_forward', 'cm_turn_right', 'cm_turn_right'],
};
export function migrateMovementSource(source: string): string {
  return source.replace(/\b(moosling|glutling|felsbock)\.moveForward\s*\(\s*\)/g, '$1.moveTowardEnemy()')
    .replace(/\b(moosling|glutling|felsbock)\.(moveRight|moveLeft|moveUp|moveDown)\s*\(\s*\)/g,
      (_match, owner: string, method: keyof typeof LEGACY_METHODS) => LEGACY_METHODS[method].map((command) => `${owner}.${command}()`).join('; '))
    .replace(/\.pathRightClear\b/g, '.pathAheadClear');
}
/** Preserve loose stacks, IDs, positions, disabled state and connections as well as executable stacks. */
export function migrateMovementWorkspace(source: string): string {
  try {
    const parsed: unknown = JSON.parse(source); const ids = new Set<string>(); let serial = 0;
    const collect = (value: unknown): void => {
      if (Array.isArray(value)) value.forEach(collect);
      else if (value && typeof value === 'object') { const node = value as Record<string, unknown>; if (typeof node.id === 'string') ids.add(node.id); Object.values(node).forEach(collect); }
    };
    collect(parsed);
    const nextId = () => { let id: string; do { id = `relative-migration-${++serial}`; } while (ids.has(id)); ids.add(id); return id; };
    let changed = false;
    const visit = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(visit);
      if (!value || typeof value !== 'object') return value;
      const node = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child)]));
      if (node.type === 'cm_move') { node.type = 'cm_move_toward'; changed = true; }
      if (node.type === 'cm_if_path') { node.type = 'cm_if_ahead'; changed = true; }
      const commands = typeof node.type === 'string' ? LEGACY_BLOCKS[node.type] : undefined;
      if (!commands) return node;
      changed = true;
      const { next, x, y, ...properties } = node;
      const blocks: Record<string, unknown>[] = commands.map((type, index) => ({ ...properties, type, ...(index ? { id: nextId() } : { ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) }) }));
      for (let i = 0; i < blocks.length - 1; i++) blocks[i].next = { block: blocks[i + 1] };
      if (next) blocks[blocks.length - 1].next = next;
      return blocks[0];
    };
    const result = visit(parsed); return changed ? JSON.stringify(result) : source;
  } catch { return source; } // An unfinished or unreadable draft is retained verbatim.
}
