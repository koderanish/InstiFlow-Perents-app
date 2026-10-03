import { buildEventPlan, parseEvents, type SchoolEvent } from '../events';

const event = (id: string, date: string, extra: Partial<SchoolEvent> = {}): SchoolEvent => ({
  id,
  title: `Event ${id}`,
  description: null,
  date,
  startTime: null,
  endTime: null,
  location: null,
  ...extra,
});

// Friday 2 October 2026.
const now = new Date(2026, 9, 2, 10, 0);

describe('buildEventPlan', () => {
  it('groups upcoming events by month, soonest first, and keeps today upcoming', () => {
    const plan = buildEventPlan([event('3', '2026-11-05'), event('1', '2026-10-02'), event('2', '2026-10-20'), event('4', '2026-11-01')], now);
    expect(plan.upcoming.map((g) => g.key)).toEqual(['2026-10', '2026-11']);
    expect(plan.upcoming[0]?.events.map((e) => e.id)).toEqual(['1', '2']);
    expect(plan.upcoming[1]?.events.map((e) => e.id)).toEqual(['4', '3']);
    expect(plan.past).toEqual([]);
    expect(plan.pastCount).toBe(0);
  });

  it('puts earlier days in past, most recent month first', () => {
    const plan = buildEventPlan([event('1', '2026-08-10'), event('2', '2026-10-01'), event('3', '2026-09-30'), event('4', '2026-09-02')], now);
    expect(plan.upcoming).toEqual([]);
    expect(plan.pastCount).toBe(4);
    expect(plan.past.map((g) => g.key)).toEqual(['2026-10', '2026-09', '2026-08']);
    expect(plan.past[1]?.events.map((e) => e.id)).toEqual(['3', '4']);
    expect(plan.past[1]).toMatchObject({ year: 2026, month: 9 });
  });

  it('orders a day by start time with untimed events last', () => {
    const plan = buildEventPlan([event('a', '2026-10-10'), event('b', '2026-10-10', { startTime: '14:00' }), event('c', '2026-10-10', { startTime: '09:00' })], now);
    expect(plan.upcoming[0]?.events.map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });

  it('separates the same month in different years', () => {
    const plan = buildEventPlan([event('1', '2027-01-05'), event('2', '2026-12-30'), event('3', '2027-01-20')], now);
    expect(plan.upcoming.map((g) => g.key)).toEqual(['2026-12', '2027-01']);
  });

  it('handles an empty list', () => {
    expect(buildEventPlan([], now)).toEqual({ upcoming: [], past: [], pastCount: 0 });
  });
});

describe('parseEvents', () => {
  it('reads full events and fills missing optional fields with null', () => {
    const parsed = parseEvents({
      events: [
        { id: 7, title: 'Sports day', description: 'Bring water', date: '2026-10-12', startTime: '09:00', endTime: '12:30', location: 'Main ground' },
        { id: 8, title: 'Holiday', date: '2026-10-20' },
      ],
    });
    expect(parsed[0]).toEqual({ id: '7', title: 'Sports day', description: 'Bring water', date: '2026-10-12', startTime: '09:00', endTime: '12:30', location: 'Main ground' });
    expect(parsed[1]).toEqual({ id: '8', title: 'Holiday', description: null, date: '2026-10-20', startTime: null, endTime: null, location: null });
  });

  it('treats blank text and null as missing', () => {
    const [first] = parseEvents({ events: [{ id: 1, title: 'Fair', description: '  ', date: '2026-10-12', startTime: null, location: '' }] });
    expect(first).toMatchObject({ description: null, startTime: null, location: null });
  });

  it('drops malformed events but keeps the rest', () => {
    const parsed = parseEvents({ events: [{ id: 1, title: '', date: '2026-10-12' }, { id: 2, title: 'No date' }, { id: 3, title: 'Ok', date: 'soon' }, { id: 4, title: 'Good', date: '2026-10-13' }, null] });
    expect(parsed.map((e) => e.id)).toEqual(['4']);
  });

  it('throws when the response has no events array', () => {
    expect(() => parseEvents({})).toThrow();
    expect(() => parseEvents(null)).toThrow();
  });
});
