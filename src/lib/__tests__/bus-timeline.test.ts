import { buildTimeline, fillLength, lineLength } from '../bus-timeline';

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
