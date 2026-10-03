import { buildTimeline, busEta, fillLength, lineLength } from '../bus-timeline';

const stops = [{ isChildStop: false }, { isChildStop: true }, { isChildStop: false }];

describe('bus timeline', () => {
  it('draws nothing before pickup', () => {
    const t = buildTimeline(stops, 'not_started');
    expect(t.filledIndex).toBeNull();
    expect(t.states).toEqual(['upcoming', 'upcoming', 'upcoming']);
  });

  it('fills up to the child stop while on the bus', () => {
    const t = buildTimeline(stops, 'on_the_bus');
    expect(t.filledIndex).toBe(1);
    expect(t.states).toEqual(['passed', 'current', 'upcoming']);
  });

  it('fills everything once dropped off', () => {
    const t = buildTimeline(stops, 'dropped_off');
    expect(t.filledIndex).toBe(2);
    expect(t.states).toEqual(['passed', 'passed', 'passed']);
  });

  it('draws nothing on the bus when the child stop is unknown', () => {
    expect(buildTimeline([{ isChildStop: false }], 'on_the_bus').filledIndex).toBeNull();
  });

  it('handles an empty route', () => {
    expect(buildTimeline([], 'dropped_off')).toEqual({ states: [], filledIndex: null });
  });

  it('measures the line from stop centres', () => {
    const centers = [10, 70, 150];
    expect(fillLength(centers, null)).toBe(0);
    expect(fillLength(centers, 0)).toBe(0);
    expect(fillLength(centers, 1)).toBe(60);
    expect(fillLength(centers, 9)).toBe(140);
    expect(lineLength(centers)).toBe(140);
    expect(lineLength([])).toBe(0);
  });
});

describe('busEta', () => {
  const route = { arrivalTime: '08:45:00' };
  const stopList = [
    { name: 'Depot', time: '07:00', isChildStop: false },
    { name: 'Green Park', time: '07:42:00', isChildStop: true },
  ];
  const at = (h: number, m: number) => new Date(2026, 9, 2, h, m);

  it('counts down to a pickup that is close', () => {
    expect(busEta(stopList, route, 'not_started', at(7, 30))).toEqual({ kind: 'pickupSoon', stop: 'Green Park', time: '7:42 am', minutes: 12 });
  });

  it('says due now at the planned minute', () => {
    expect(busEta(stopList, route, 'not_started', at(7, 42))).toEqual({ kind: 'pickupNow', stop: 'Green Park' });
  });

  it('only names the time when pickup is far off', () => {
    expect(busEta(stopList, route, 'not_started', at(5, 0))).toEqual({ kind: 'pickupAt', stop: 'Green Park', time: '7:42 am' });
  });

  it('admits when the planned pickup has passed without a record', () => {
    expect(busEta(stopList, route, 'not_started', at(7, 55))).toEqual({ kind: 'pickupPast', stop: 'Green Park', time: '7:42 am' });
  });

  it('gives nothing without the child stop time', () => {
    expect(busEta([{ name: 'Depot', time: '07:00', isChildStop: false }], route, 'not_started', at(7, 0))).toBeNull();
    expect(busEta([{ name: 'Green Park', time: null, isChildStop: true }], route, 'not_started', at(7, 0))).toBeNull();
  });

  it('talks about the route finishing while on the bus', () => {
    expect(busEta(stopList, route, 'on_the_bus', at(8, 30))).toEqual({ kind: 'finishSoon', time: '8:45 am', minutes: 15 });
    expect(busEta(stopList, route, 'on_the_bus', at(8, 50))).toEqual({ kind: 'finishAt', time: '8:45 am' });
    expect(busEta(stopList, { arrivalTime: null }, 'on_the_bus', at(8, 30))).toBeNull();
  });

  it('stays quiet once dropped off', () => {
    expect(busEta(stopList, route, 'dropped_off', at(15, 0))).toBeNull();
  });
});
