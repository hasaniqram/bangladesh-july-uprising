import { describe, expect, test } from 'vitest';
import legacyDataset from './uprising-data.json';
import evidence from './historical-evidence.json';

describe('Phase 1.4 historical evidence and editorial guardrails', () => {
  const sourceMap = new Map(evidence.sources.map(source => [source.id, source]));

  test('every displayed timeline entry cites a source with a date and HTTPS URL', () => {
    expect(evidence.timeline.length).toBeGreaterThanOrEqual(7);
    expect(sourceMap.size).toBe(evidence.sources.length);
    evidence.sources.forEach(source => {
      expect(source.published).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.publisher).toBeTruthy();
      expect(source.scope).toBeTruthy();
      expect(source.methodology).toBeTruthy();
    });
    evidence.timeline.forEach(entry => {
      expect(entry.date).toMatch(/^2024-\d{2}-\d{2}$/);
      expect(entry.event.trim().length).toBeGreaterThan(10);
      expect(entry.description.trim().length).toBeGreaterThan(15);
      expect(entry.sourceIds.length).toBeGreaterThan(0);
      entry.sourceIds.forEach(id => expect(sourceMap.has(id)).toBe(true));
      expect(entry.casualties).toBeUndefined();
      expect(entry.arrests).toBeUndefined();
    });
  });

  test('selected chronology fixes 8 August swearing-in and 18 July shutdown', () => {
    expect(evidence.timeline.some(e => e.date === '2024-08-08' && /Yunus/.test(e.event))).toBe(true);
    expect(evidence.timeline.some(e => e.date === '2024-07-18' && /internet/i.test(e.event))).toBe(true);
    expect(evidence.timeline.some(e => e.date === '2024-08-06' && /sworn/i.test(e.event))).toBe(false);
  });

  test('national estimate cannot be confused with uncited regional aggregates', () => {
    expect(evidence.nationalAssessment.status).toBe('estimate');
    expect(evidence.nationalAssessment.value).toBe(1400);
    expect(evidence.nationalAssessment.sourceIds).toContain('ohchr-2025');
    expect(evidence.regionalAssessment.status).toBe('unverified');
    expect(legacyDataset.divisions).toBeTruthy();
    expect(evidence.regionalAssessment.note).toMatch(/unverified|source|traceable|methodology/i);
  });
});
