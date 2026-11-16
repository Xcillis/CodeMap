import type { EncounterState } from './types';

export function runeProgress(state: EncounterState): { activated: number; total: number; rows: { y: number; activated: number; total: number }[]; summary: string } | undefined {
  const runes = 'goal' in state ? state.runes : undefined; if (!runes?.length) return;
  const rows = [...new Set(runes.map((rune) => rune.y))].sort((a, b) => b - a).map((y) => {
    const cells = runes.filter((rune) => rune.y === y); return { y, activated: cells.filter((rune) => rune.activated).length, total: cells.length };
  });
  const activated = runes.filter((rune) => rune.activated).length;
  return { activated, total: runes.length, rows, summary: `Runen ${activated}/${runes.length} · ${rows.map((row, index) => `Reihe ${index + 1}: ${row.activated}/${row.total}`).join(' · ')}` };
}
