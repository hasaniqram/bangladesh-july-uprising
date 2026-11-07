import dataset from './uprising-data.json';

describe('memorial dataset structural integrity', () => {
  test('every mapped division has a valid data record, color, and marker', () => {
    const keys = Object.keys(dataset.divisions);
    expect(keys).toHaveLength(8);

    Object.values(dataset.divisionMapping).forEach(key => {
      expect(keys).toContain(key);
    });

    keys.forEach(key => {
      const division = dataset.divisions[key];
      expect(division.name).toEqual(expect.any(String));
      expect(division.name.trim()).not.toBe('');
      expect(Number.isInteger(division.deaths)).toBe(true);
      expect(Number.isInteger(division.injured)).toBe(true);
      expect(division.deaths).toBeGreaterThanOrEqual(0);
      expect(division.injured).toBeGreaterThanOrEqual(0);
      expect(dataset.divisionColors[key]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(dataset.labelPositions[key]).toHaveLength(2);
      dataset.labelPositions[key].forEach(coordinate => {
        expect(Number.isFinite(coordinate)).toBe(true);
      });
    });
  });

  test('timeline events have parsable dates and descriptions', () => {
    expect(dataset.timeline.length).toBeGreaterThan(0);
    dataset.timeline.forEach(event => {
      expect(event.date).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(event.date))).toBe(false);
      expect(event.event.trim().length).toBeGreaterThan(0);
      if (event.casualties !== undefined) {
        expect(Number.isInteger(event.casualties)).toBe(true);
        expect(event.casualties).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

// These checks validate data shape, NOT the historical accuracy of any value.
