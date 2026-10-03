import { addDays, dayStrip, daysBetween, fullDate, isValidDay, postedLabel, shortDate, toISODate } from '../dates';

describe('dates', () => {
  it('validates calendar days', () => {
    expect(isValidDay('2026-10-05')).toBe(true);
    expect(isValidDay('2026-02-30')).toBe(false);
    expect(isValidDay('nope')).toBe(false);
    expect(isValidDay(null)).toBe(false);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('bad', 1)).toBeNull();
  });

  it('counts days between', () => {
    expect(daysBetween('2026-10-05', '2026-10-05')).toBe(0);
    expect(daysBetween('2026-10-05', '2026-10-08')).toBe(3);
    expect(daysBetween('2026-10-08', '2026-10-05')).toBe(-3);
    expect(daysBetween('x', '2026-10-05')).toBeNull();
  });

  it('formats short and full dates', () => {
    expect(shortDate('2026-10-05')).toBe('Mon, 5 Oct');
    expect(shortDate('x')).toBeNull();
    expect(fullDate('2014-03-14')).toBe('14 March 2014');
    expect(fullDate(null)).toBeNull();
  });

  it('formats the local day of a Date', () => {
    expect(toISODate(new Date(2026, 0, 9, 23, 59))).toBe('2026-01-09');
  });

  it('builds a strip of consecutive days', () => {
    const strip = dayStrip('2026-10-30', 4);
    expect(strip.map((d) => d.iso)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(strip[0]).toEqual({ iso: '2026-10-30', weekday: 'Fri', day: 30, month: 'Oct' });
    expect(dayStrip('bad', 3)).toEqual([]);
  });

  it('labels when something was posted', () => {
    const now = new Date(2026, 9, 3, 12, 0);
    expect(postedLabel(new Date(2026, 9, 3, 8, 15).toISOString(), now)).toBe('Today');
    expect(postedLabel(new Date(2026, 9, 2, 20, 0).toISOString(), now)).toBe('Yesterday');
    expect(postedLabel(new Date(2026, 8, 28, 9, 0).toISOString(), now)).toBe('28 September');
    expect(postedLabel('nonsense', now)).toBe('');
  });
});
