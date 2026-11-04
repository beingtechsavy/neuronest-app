import { describe, expect, it } from 'vitest';
import { shiftWeekDate } from '@/lib/safeTimeUtils';

describe('shiftWeekDate', () => {
  it('moves both directions by exactly one week', () => {
    expect(shiftWeekDate('2026-11-04', 'next')).toBe('2026-11-11');
    expect(shiftWeekDate('2026-11-04', 'prev')).toBe('2026-10-28');
  });

  it('round-trips in either direction', () => {
    for (const key of ['2026-01-01', '2026-12-31', '2028-02-29', '2026-03-08']) {
      expect(shiftWeekDate(shiftWeekDate(key, 'next'), 'prev')).toBe(key);
      expect(shiftWeekDate(shiftWeekDate(key, 'prev'), 'next')).toBe(key);
    }
  });

  it('handles month and year boundaries', () => {
    expect(shiftWeekDate('2026-12-29', 'next')).toBe('2027-01-05');
    expect(shiftWeekDate('2027-01-01', 'prev')).toBe('2026-12-25');
    expect(shiftWeekDate('2028-02-29', 'next')).toBe('2028-03-07');
  });

  it('leaves malformed input untouched', () => {
    expect(shiftWeekDate('not-a-date', 'next')).toBe('not-a-date');
  });
});
