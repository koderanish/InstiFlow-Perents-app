import { dateKey, daysFromToday, shortDateParts } from '../dates';

describe('dates', () => {
  // Friday 2 October 2026, late evening: must still count as 2 October.
  const now = new Date(2026, 9, 2, 23, 40);

  it('builds a local date key', () => {
    expect(dateKey(now)).toBe('2026-10-02');
    expect(dateKey(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05');
  });

  it('counts whole days from today', () => {
    expect(daysFromToday('2026-10-02', now)).toBe(0);
    expect(daysFromToday('2026-10-03', now)).toBe(1);
    expect(daysFromToday('2026-10-09', now)).toBe(7);
    expect(daysFromToday('2026-10-01', now)).toBe(-1);
    expect(daysFromToday('2026-10-09T00:00:00.000Z', now)).toBe(7);
  });

  it('crosses month and year boundaries', () => {
    expect(daysFromToday('2026-11-01', now)).toBe(30);
    expect(daysFromToday('2027-01-01', new Date(2026, 11, 31, 8, 0))).toBe(1);
  });

  it('returns null for unreadable dates', () => {
    expect(daysFromToday(null, now)).toBeNull();
    expect(daysFromToday('soon', now)).toBeNull();
    expect(daysFromToday('2026-13-01', now)).toBeNull();
  });

  it('splits a date for tiles', () => {
    expect(shortDateParts('2026-10-09')).toEqual({ day: '9', month: 'Oct' });
    expect(shortDateParts('2026-12-25')).toEqual({ day: '25', month: 'Dec' });
    expect(shortDateParts('nope')).toBeNull();
    expect(shortDateParts(undefined)).toBeNull();
  });
});
