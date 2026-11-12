export type DragItem = { kind: 'command'; command: string } | { kind: 'block'; index: number };

/** Pointer events support both mouse and touch; model edits happen only on drop. */
export class ProgramDrag {
  private pending?: { item: DragItem; pointer: number; x: number; y: number; label: string };
  private ghost?: HTMLDivElement;
  private marker?: HTMLDivElement;
  private destination?: number;
  private x = 0;
  private y = 0;
  private frame?: number;
  private suppressClick = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly workspace: HTMLElement,
    private readonly rows: () => HTMLElement[],
    private readonly onDrop: (item: DragItem, index: number) => void,
  ) {
    root.addEventListener('pointerdown', (event) => this.start(event));
    root.addEventListener('click', (event) => {
      if (this.suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    document.addEventListener('pointermove', (event) => this.move(event));
    document.addEventListener('pointerup', (event) => this.finish(event));
    document.addEventListener('pointercancel', () => this.cancel());
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') this.cancel(); });
    window.addEventListener('blur', () => this.cancel());
  }

  cancel(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.pending = undefined;
    this.destination = undefined;
    this.ghost?.remove();
    this.marker?.remove();
    this.ghost = undefined;
    this.marker = undefined;
    this.root.classList.remove('program-dragging');
    this.workspace.classList.remove('drop-active');
  }

  private start(event: PointerEvent): void {
    if (this.pending || event.button !== 0 || !(event.target instanceof Element)) return;
    const handle = event.target.closest<HTMLElement>('[data-command], [data-drag-block]');
    if (!handle || !this.root.contains(handle) || handle.closest('[hidden]')) return;
    const item: DragItem = handle.dataset.command
      ? { kind: 'command', command: handle.dataset.command }
      : { kind: 'block', index: Number(handle.dataset.dragBlock) };
    const label = handle.dataset.command
      ? Array.from(handle.children).map((child) => child.textContent).join('\n')
      : 'Wiederholungsblock verschieben';
    this.pending = { item, pointer: event.pointerId, x: event.clientX, y: event.clientY, label };
    try { handle.setPointerCapture?.(event.pointerId); } catch { /* Capture may be unavailable on a disconnected pointer. */ }
  }

  private move(event: PointerEvent): void {
    if (!this.pending || event.pointerId !== this.pending.pointer) return;
    this.x = event.clientX;
    this.y = event.clientY;
    if (!this.ghost && Math.hypot(this.x - this.pending.x, this.y - this.pending.y) < 7) return;
    event.preventDefault();
    if (!this.ghost) {
      this.ghost = document.createElement('div');
      this.ghost.className = 'drag-ghost';
      this.ghost.setAttribute('aria-hidden', 'true');
      this.ghost.textContent = this.pending.label;
      document.body.append(this.ghost);
      this.marker = document.createElement('div');
      this.marker.className = 'drop-marker';
      this.marker.setAttribute('aria-hidden', 'true');
      document.body.append(this.marker);
      this.root.classList.add('program-dragging');
      this.frame = requestAnimationFrame(() => this.autoScroll());
    }
    this.ghost.style.transform = `translate(${this.x + 12}px, ${this.y + 12}px)`;
    this.preview();
  }

  private preview(): void {
    const target = document.elementFromPoint(this.x, this.y);
    const inside = target !== null && this.workspace.contains(target);
    this.workspace.classList.toggle('drop-active', inside);
    this.destination = undefined;
    if (!this.marker) return;
    this.marker.hidden = !inside;
    if (!inside) return;
    const rows = this.rows();
    const index = rows.findIndex((row) => {
      const rect = row.getBoundingClientRect();
      return this.y < rect.top + rect.height / 2;
    });
    this.destination = index < 0 ? rows.length : index;
    const area = this.workspace.getBoundingClientRect();
    const edge = this.destination < rows.length
      ? rows[this.destination].getBoundingClientRect().top - 3
      : rows.length ? rows[rows.length - 1].getBoundingClientRect().bottom + 3 : this.y;
    Object.assign(this.marker.style, {
      left: `${area.left + 10}px`, width: `${Math.max(0, area.width - 24)}px`,
      top: `${Math.max(area.top + 2, Math.min(edge, area.bottom - 5))}px`,
    });
  }

  private autoScroll(): void {
    if (!this.ghost) return;
    const rect = this.workspace.getBoundingClientRect();
    if (this.x >= rect.left && this.x <= rect.right && this.y >= rect.top && this.y <= rect.bottom) {
      const delta = this.y < rect.top + 36 ? -10 : this.y > rect.bottom - 36 ? 10 : 0;
      this.workspace.scrollTop += delta;
      if (delta) this.preview();
    }
    this.frame = requestAnimationFrame(() => this.autoScroll());
  }

  private finish(event: PointerEvent): void {
    if (!this.pending || event.pointerId !== this.pending.pointer) return;
    const item = this.pending.item;
    if (this.ghost) {
      this.x = event.clientX;
      this.y = event.clientY;
      this.preview();
    }
    const destination = this.destination;
    const dragged = Boolean(this.ghost);
    this.cancel();
    if (!dragged) return;
    this.suppressClick = true;
    setTimeout(() => { this.suppressClick = false; }, 0);
    if (destination !== undefined) this.onDrop(item, destination);
  }
}
