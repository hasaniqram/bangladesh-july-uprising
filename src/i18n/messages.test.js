import { describe, expect, test } from 'vitest';
import { messages, translate, formatLocalizedNumber } from './messages';
import { localizeEvent, bengaliTimeline } from './timeline-bn';
import evidence from '../data/historical-evidence.json';

describe('Phase 1.5 bilingual interface', () => {
  test('English and Bengali interface keys are aligned', () => {
    expect(Object.keys(messages.bn).sort()).toEqual(Object.keys(messages.en).sort());
    for (const language of ['en', 'bn']) {
      Object.entries(messages[language]).forEach(([key, value]) => {
        expect(value.trim().length, key).toBeGreaterThan(0);
      });
    }
  });
  test('Bengali numbers and interface translation are available', () => {
    expect(formatLocalizedNumber(1400, 'bn')).toBe('১,৪০০');
    expect(translate('bn', 'chronology')).toBe('ঘটনাপঞ্জি');
    expect(translate('en', 'chronology')).toBe('Timeline of Events');
    expect(translate('bn', 'nonexistent')).toBe('nonexistent');
  });
  test('every published event has Bengali text and unchanged attribution', () => {
    expect(Object.keys(bengaliTimeline).sort()).toEqual(evidence.timeline.map(event => event.date).sort());
    evidence.timeline.forEach(event => {
      const translated = localizeEvent(event, 'bn');
      expect(translated.event).toMatch(/[\u0980-\u09ff]/);
      expect(translated.description).toMatch(/[\u0980-\u09ff]/);
      expect(translated.date).toBe(event.date);
      expect(translated.sourceIds).toEqual(event.sourceIds);
      expect(localizeEvent(event, 'en')).toBe(event);
    });
  });
});
