import { alertAge, parseBusAlerts } from '../bus-alerts';

const good = { id: 1, kind: 'delay', message: 'Bus 4 is running 15 minutes late', createdAt: '2026-10-02T07:10:00.000Z', routeName: 'Green Park' };

describe('parseBusAlerts', () => {
  it('reads alerts and normalises ids and the route name', () => {
    expect(parseBusAlerts({ alerts: [good, { ...good, id: 'b', kind: 'info', routeName: null }] })).toEqual([
      { id: '1', kind: 'delay', message: 'Bus 4 is running 15 minutes late', createdAt: '2026-10-02T07:10:00.000Z', routeName: 'Green Park' },
      { id: 'b', kind: 'info', message: 'Bus 4 is running 15 minutes late', createdAt: '2026-10-02T07:10:00.000Z', routeName: null },
    ]);
  });

  it('drops malformed items and keeps the rest', () => {
    const alerts = parseBusAlerts({
      alerts: [
        good,
        null,
        'text',
        { ...good, id: 2, message: '   ' },
        { ...good, id: 3, createdAt: 'not a date' },
        { ...good, id: 4, kind: 7 },
        { kind: 'delay', message: 'no id', createdAt: good.createdAt },
        { ...good, id: 5, kind: 'cancelled', routeName: '  ' },
      ],
    });
    expect(alerts.map((a) => a.id)).toEqual(['1', '5']);
    expect(alerts[1]).toMatchObject({ kind: 'cancelled', routeName: null });
  });

  it('shows an unknown kind as info', () => {
    expect(parseBusAlerts({ alerts: [{ ...good, kind: 'reroute' }] })[0]?.kind).toBe('info');
  });

  it('puts the newest first and keeps server order for ties', () => {
    const alerts = parseBusAlerts({
      alerts: [
        { ...good, id: 'old', createdAt: '2026-10-01T07:00:00.000Z' },
        { ...good, id: 'new', createdAt: '2026-10-02T07:00:00.000Z' },
        { ...good, id: 'tie', createdAt: '2026-10-02T07:00:00.000Z' },
      ],
    });
    expect(alerts.map((a) => a.id)).toEqual(['new', 'tie', 'old']);
  });

  it('returns an empty list for no alerts and throws on a wrong outer shape', () => {
    expect(parseBusAlerts({ alerts: [] })).toEqual([]);
    expect(() => parseBusAlerts({})).toThrow();
    expect(() => parseBusAlerts(null)).toThrow();
  });
});

describe('alertAge', () => {
  const now = new Date('2026-10-02T12:00:00.000Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it('rounds down to minutes, hours and days', () => {
    expect(alertAge(ago(30_000), now)).toEqual({ unit: 'now' });
    expect(alertAge(ago(60_000), now)).toEqual({ unit: 'minutes', count: 1 });
    expect(alertAge(ago(59 * 60_000), now)).toEqual({ unit: 'minutes', count: 59 });
    expect(alertAge(ago(60 * 60_000), now)).toEqual({ unit: 'hours', count: 1 });
    expect(alertAge(ago(23.9 * 3_600_000), now)).toEqual({ unit: 'hours', count: 23 });
    expect(alertAge(ago(50 * 3_600_000), now)).toEqual({ unit: 'days', count: 2 });
  });

  it('treats the future and unreadable times as now', () => {
    expect(alertAge(ago(-5 * 60_000), now)).toEqual({ unit: 'now' });
    expect(alertAge('nonsense', now)).toEqual({ unit: 'now' });
  });
});
