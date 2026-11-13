import { describe, expect, it } from 'vitest';
import { InteractionController } from './InteractionController';
import { Campaign } from './Campaign';
import { LESSON_IDS } from './WorldQuests';
import { instanceId } from './ArkanaCatalog';

describe('Verfügbare Weltinteraktionen', () => {
  it('bietet den späteren Fund nur bei Freischaltung an und entfernt ihn nach der Aufnahme', () => {
    const state = { version: 2, introduced: true, owned: [{ speciesId: 'glutling' }], team: [instanceId('glutling')] };
    let campaign = new Campaign(state);
    const targets = () => campaign.availableEncounters.map((encounter) => ({ ...encounter, label: encounter.name, range: 70 }));
    const controller = new InteractionController(targets());
    expect(controller.nearestTo(1450, 915)).toBeUndefined();
    campaign = new Campaign({ ...state, completed: LESSON_IDS }); controller.setTargets(targets());
    expect(controller.nearestTo(1450, 915)?.id).toBe('moosling');
    campaign.apply('recruit-moosling'); controller.setTargets(targets()); expect(controller.nearestTo(1450, 915)).toBeUndefined();
  });
  it('entfernt eine Fundbegegnung und lässt benachbarte Questorte ansprechbar', () => {
    const controller = new InteractionController([
      { id: 'moosling', label: 'Moosling', x: 600, y: 650, range: 70 },
      { id: 'quest', label: 'Runenstein', x: 620, y: 650, range: 70 },
    ]);
    expect(controller.nearestTo(600, 650)?.id).toBe('moosling');
    controller.removeTarget('moosling');
    expect(controller.nearestTo(600, 650)?.id).toBe('quest');
    controller.removeTarget('moosling');
    expect(controller.nearestTo(620, 650)?.id).toBe('quest');
    expect(controller.nearestTo(1000, 650)).toBeUndefined();
  });

  it('bietet an einer entfernten Fundstelle keine unsichtbare Interaktion mehr an', () => {
    const controller = new InteractionController([{ id: 'glutling', label: 'Glutling', x: 1290, y: 650, range: 70 }]);
    controller.removeTarget('glutling');
    expect(controller.nearestTo(1290, 650)).toBeUndefined();
  });
});
