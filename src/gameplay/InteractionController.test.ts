import { describe, expect, it } from 'vitest';
import { InteractionController } from './InteractionController';

describe('Verfügbare Weltinteraktionen', () => {
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
