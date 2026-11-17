import type { EncounterState } from './types';

export function runeProgress(state: EncounterState): { kind: 'rows' | 'safeguards'; activated: number; total: number; rows: { y: number; activated: number; total: number }[]; summary: string } | undefined {
  const runes = 'goal' in state ? state.runes : undefined; if (!runes?.length) return;
  const rows = [...new Set(runes.map((rune) => rune.y))].sort((a, b) => b - a).map((y) => {
    const cells = runes.filter((rune) => rune.y === y); return { y, activated: cells.filter((rune) => rune.activated).length, total: cells.length };
  });
  const activated = runes.filter((rune) => rune.activated).length;
  if ('goal' in state && state.runeMode === 'safeguards') return { kind: 'safeguards', activated, total: runes.length, rows: [], summary: `Sicherungsrunen ${activated}/${runes.length} · ${activated === runes.length ? 'Zur goldenen Winde zurückkehren' : 'Alle drei Runen um den Felsblock aktivieren'}` };
  return { kind: 'rows', activated, total: runes.length, rows, summary: `Runen ${activated}/${runes.length} · ${rows.map((row, index) => `Reihe ${index + 1}: ${row.activated}/${row.total}`).join(' · ')}` };
}
