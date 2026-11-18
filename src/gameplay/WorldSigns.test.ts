import { describe, expect, it } from 'vitest';
import { Campaign } from './Campaign';
import { InteractionController } from './InteractionController';
import { signsForRegion, worldSignDialog } from './WorldSigns';
import { FOREST_OBSTACLES, forestBlocked } from '../world/ForestLayout';

describe('Wegweiser lesen', () => {
  it('öffnet ortsspezifische Richtungen ohne Quests, Team oder Reisen auszulösen', () => {
    const campaign = new Campaign({ version: 2, worldVersion: 1, region: 'forest', legacyForestAccess: true });
    const before = campaign.snapshot;
    const signs = signsForRegion('forest');
    expect(signs).toHaveLength(3);
    expect(signsForRegion('valley')).toEqual([]);
    for (const sign of signs) {
      const dialog = campaign.interact(sign.id);
      expect(dialog).toMatchObject({ speaker: sign.title, text: sign.text, actionLabel: 'Schließen' });
      expect(dialog.action).toBeUndefined();
      expect(campaign.snapshot).toEqual(before);
      expect(worldSignDialog(sign.id, 'valley')).toBeUndefined();
      expect(worldSignDialog(sign.id, 'village', 'library')).toBeUndefined();
    }
    expect(campaign.interact('sign:forest-west').text).toContain('Neria · Sonnenlichtung');
    expect(campaign.interact('sign:forest-east').text).toContain('Mooshain');
    expect(campaign.interact('sign:forest-village').text).toContain('Dorf Auenquell');
    expect(worldSignDialog('sign:missing', 'forest')).toBeUndefined();
  });
  it('lässt die Wegweiser nah ansprechen und hält nur die kleinen Pfosten blockiert', () => {
    const signs = signsForRegion('forest');
    const controller = new InteractionController(signs);
    for (const sign of signs) {
      const approach = { x: sign.x, y: sign.y + 40 };
      expect(forestBlocked(approach, 18)).toBe(false);
      expect(controller.nearestTo(approach.x, approach.y)?.id).toBe(sign.id);
      expect(controller.nearestTo(sign.x, sign.y + sign.range + 1)).toBeUndefined();
      expect(FOREST_OBSTACLES.some((body) => body.x === sign.x && body.y === sign.y - 6 && body.width === 14 && body.height === 12)).toBe(true);
      expect(forestBlocked({ x: sign.x, y: sign.y - 6 }, 0)).toBe(true);
    }
  });
});
