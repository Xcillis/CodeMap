// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { setLearningText } from './LearningText';

describe('Hervorgehobene Lernbegriffe', () => {
  it('erhält Absätze und Text, erkennt Mehrzahl und markiert keine Wortbestandteile', () => {
    const p = document.createElement('p');
    const text = 'Anweisungen bilden eine Sequenz.\n\nSchleifen wiederholen sie. Sequenznummer und Lebenspunkteanzeige bleiben unverändert.';
    setLearningText(p, text);
    expect(p.textContent).toBe(text);
    expect(Array.from(p.querySelectorAll('strong')).map((item) => item.textContent)).toEqual(['Anweisungen', 'Sequenz', 'Schleifen']);
    setLearningText(p, 'Eine Anweisung.');
    expect(p.querySelectorAll('strong')).toHaveLength(1); expect(p.querySelector('strong strong')).toBeNull();
  });
  it('behandelt enthaltenes HTML weiterhin als Text', () => {
    const p = document.createElement('p'); const text = '<img src=x onerror="alert(1)"> Sequenz';
    setLearningText(p, text);
    expect(p.textContent).toBe(text); expect(p.querySelector('img')).toBeNull();
    expect(p.querySelector('[data-term="sequence"]')?.textContent).toBe('Sequenz');
  });
});
