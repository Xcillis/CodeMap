import type { InteractionTarget } from './InteractionController';
import type { RegionId } from './WorldRegions';
import type { CampaignDialog } from './WorldQuests';

export interface WorldSign extends InteractionTarget {
  readonly region: RegionId;
  readonly title: string;
  readonly text: string;
}

/** Shared locations for drawing, collision clearance and the normal interaction system. */
export const WORLD_SIGNS: readonly WorldSign[] = [
  { id: 'sign:forest-west', region: 'forest', x: 780, y: 1280, range: 75, label: 'Wegweiser lesen', title: 'WEGWEISER · WALDKREUZUNG',
    text: '↑ Neria · Sonnenlichtung\n→ Tala · Forscherhain\n\nDer nördliche Waldpfad führt über die Alte Eiche zur Sonnenlichtung. Dem südlichen Weg nach Osten folgend erreichst du Talas Hain.' },
  { id: 'sign:forest-east', region: 'forest', x: 1820, y: 1580, range: 75, label: 'Wegweiser lesen', title: 'WEGWEISER · ÖSTLICHER WALDWEG',
    text: '← Lyra · Waldsaum\n→ Tala · Forscherhain und Mooshain\n\nFolge dem Weg nach Osten zu Tala. Der Mooshain liegt etwas weiter südöstlich.' },
  { id: 'sign:forest-village', region: 'forest', x: 2890, y: 1600, range: 75, label: 'Wegweiser lesen', title: 'WEGWEISER · DORFWEG',
    text: '→ Dorf Auenquell\n← Tala · Forscherhain\n\nDer Reisestein am östlichen Ende des Waldwegs führt ins Dorf. Dort kannst du das Gasthaus, die Werkstatt und die Bibliothek besuchen.' },
];

export const signsForRegion = (region: RegionId): readonly WorldSign[] => WORLD_SIGNS.filter((sign) => sign.region === region);

export function worldSignDialog(id: string, region: RegionId, interior?: string): CampaignDialog | undefined {
  if (interior) return;
  const sign = WORLD_SIGNS.find((item) => item.id === id && item.region === region);
  return sign ? { speaker: sign.title, text: sign.text, actionLabel: 'Schließen' } : undefined;
}
