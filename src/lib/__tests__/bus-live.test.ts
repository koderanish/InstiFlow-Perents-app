import { defaultT } from '@/i18n/translate';

import {
  POLL_IDLE_MS,
  POLL_LIVE_MS,
  STALE_AFTER_MS,
  agoLabel,
  agoParts,
  bearingBetween,
  busMapState,
  distanceMeters,
  easeInOut,
  initialRegion,
  isStale,
  lerpAngle,
  lerpPose,
  normaliseHeading,
  parseBusLive,
  pollInterval,
  progress,
  routePath,
  shortestAngleDelta,
  withResolvedHeading,
  type BusLive,
} from '../bus-live';

const now = new Date('2026-10-05T07:30:00.000Z');
const secondsAgo = (s: number) => new Date(now.getTime() - s * 1000).toISOString();

const live = (extra: Partial<BusLive> = {}, updatedAt = secondsAgo(5)): BusLive => ({
  live: true,
  location: { lat: 28.6, lng: 77.2, heading: 90, speedKmh: 32, updatedAt },
  routeName: 'Route 4',
  stops: [{ name: 'Green Park', order: 1, lat: 28.61, lng: 77.21 }],
  ...extra,
});

describe('parseBusLive', () => {
  it('reads a full response and sorts stops by order', () => {
    const parsed = parseBusLive({
      live: true,
      location: { lat: 28.6, lng: 77.2, heading: 450, speedKmh: 31.5, updatedAt: secondsAgo(3) },
      routeName: '  Route 4 ',
      stops: [
        { name: 'B', lat: 28.2, lng: 77.2, order: 2 },
        { name: 'A', lat: 28.1, lng: 77.1, order: 1 },
      ],
    });
    expect(parsed.live).toBe(true);
    expect(parsed.routeName).toBe('Route 4');
    expect(parsed.location).toMatchObject({ lat: 28.6, lng: 77.2, heading: 90, speedKmh: 31.5 });
    expect(parsed.stops.map((s) => s.name)).toEqual(['A', 'B']);
  });

  it('keeps nulls for a bus with no fix yet', () => {
    const parsed = parseBusLive({ live: false, location: null, routeName: null, stops: [] });
    expect(parsed).toEqual({ live: false, location: null, routeName: null, stops: [] });
  });

  it('treats a bad location as no location instead of failing', () => {
    expect(parseBusLive({ live: true, location: { lat: 200, lng: 77, updatedAt: secondsAgo(1) }, routeName: 'R', stops: [] }).location).toBeNull();
    expect(parseBusLive({ live: true, location: { lat: 28, lng: 77, updatedAt: 'yesterday-ish' }, routeName: 'R', stops: [] }).location).toBeNull();
    expect(parseBusLive({ live: true, location: 'nope', routeName: 'R', stops: [] }).location).toBeNull();
  });

  it('nulls missing heading and speed, and ignores a negative speed', () => {
    const { location } = parseBusLive({ live: true, location: { lat: 1, lng: 2, heading: null, speedKmh: -3, updatedAt: secondsAgo(1) }, stops: [] });
    expect(location?.heading).toBeNull();
    expect(location?.speedKmh).toBeNull();
  });

  it('drops nameless stops and blanks half-given coordinates', () => {
    const parsed = parseBusLive({
      live: false,
      stops: [{ name: ' ', lat: 1, lng: 1, order: 1 }, { name: 'Half', lat: 28.1, lng: null, order: 2 }, { name: 'Far', lat: 95, lng: 10, order: 3 }, 'junk'],
    });
    expect(parsed.stops).toEqual([
      { name: 'Half', order: 2, lat: null, lng: null },
      { name: 'Far', order: 3, lat: null, lng: null },
    ]);
  });

  it('rejects a response that is not an object with `live`', () => {
    expect(() => parseBusLive(null)).toThrow();
    expect(() => parseBusLive({ location: null })).toThrow();
  });
});

describe('freshness and copy', () => {
  it('knows when a fix is stale', () => {
    expect(isStale(secondsAgo(30), now)).toBe(false);
    expect(isStale(new Date(now.getTime() - STALE_AFTER_MS).toISOString(), now)).toBe(false);
    expect(isStale(secondsAgo(STALE_AFTER_MS / 1000 + 1), now)).toBe(true);
  });

  it('treats a fix from the future (clock skew) as fresh', () => {
    expect(isStale(secondsAgo(-20), now)).toBe(false);
  });

  it('splits an age into the biggest sensible unit', () => {
    expect(agoParts(4_000)).toEqual({ unit: 'now', count: 0 });
    expect(agoParts(42_000)).toEqual({ unit: 'seconds', count: 42 });
    expect(agoParts(5 * 60_000 + 20_000)).toEqual({ unit: 'minutes', count: 5 });
    expect(agoParts(3 * 3_600_000)).toEqual({ unit: 'hours', count: 3 });
    expect(agoParts(49 * 3_600_000)).toEqual({ unit: 'days', count: 2 });
  });

  it('words the age in English', () => {
    expect(agoLabel(secondsAgo(2), now, defaultT)).toBe('just now');
    expect(agoLabel(secondsAgo(42), now, defaultT)).toBe('42 sec ago');
    expect(agoLabel(secondsAgo(5 * 60), now, defaultT)).toBe('5 min ago');
    expect(agoLabel(secondsAgo(2 * 3600), now, defaultT)).toBe('2 hr ago');
  });
});

describe('busMapState', () => {
  it('is live for a fresh fix on a live bus', () => {
    expect(busMapState(live(), now).kind).toBe('live');
  });

  it('is offline with the last seen time when the fix is stale', () => {
    const updatedAt = secondsAgo(600);
    expect(busMapState(live({}, updatedAt), now)).toEqual({ kind: 'offline', lastSeenAt: updatedAt, hasMapContent: true });
  });

  it('is offline when the server says not live, even with a fresh fix', () => {
    expect(busMapState(live({ live: false }), now).kind).toBe('offline');
  });

  it('is offline with nothing to draw when there is no fix and no stop coordinates', () => {
    const data: BusLive = { live: false, location: null, routeName: 'Route 4', stops: [{ name: 'A', order: 1, lat: null, lng: null }] };
    expect(busMapState(data, now)).toEqual({ kind: 'offline', lastSeenAt: null, hasMapContent: false });
  });

  it('can still draw the route of a bus that has no fix yet', () => {
    const data: BusLive = { live: false, location: null, routeName: 'Route 4', stops: [{ name: 'A', order: 1, lat: 1, lng: 2 }] };
    expect(busMapState(data, now)).toMatchObject({ kind: 'offline', hasMapContent: true });
  });

  it('reports no route when nothing is assigned', () => {
    expect(busMapState({ live: false, location: null, routeName: null, stops: [] }, now)).toEqual({ kind: 'noRoute' });
  });
});

describe('pollInterval', () => {
  it('polls fast while live, slowly otherwise, and never while inactive', () => {
    expect(pollInterval(true, true)).toBe(POLL_LIVE_MS);
    expect(pollInterval(false, true)).toBe(POLL_IDLE_MS);
    expect(pollInterval(undefined, true)).toBe(POLL_IDLE_MS);
    expect(pollInterval(true, false)).toBe(false);
  });
});

describe('geometry', () => {
  const a = { latitude: 28.6, longitude: 77.2 };

  it('measures distance in metres', () => {
    expect(distanceMeters(a, a)).toBe(0);
    expect(distanceMeters(a, { latitude: 28.601, longitude: 77.2 })).toBeGreaterThan(100);
    expect(distanceMeters(a, { latitude: 28.601, longitude: 77.2 })).toBeLessThan(120);
  });

  it('gives compass bearings', () => {
    expect(Math.round(bearingBetween(a, { latitude: 28.7, longitude: 77.2 }))).toBe(0);
    expect(Math.round(bearingBetween(a, { latitude: 28.6, longitude: 77.3 }))).toBe(90);
    expect(Math.round(bearingBetween(a, { latitude: 28.5, longitude: 77.2 }))).toBe(180);
    expect(Math.round(bearingBetween(a, { latitude: 28.6, longitude: 77.1 }))).toBe(270);
  });

  it('wraps headings into 0 to 360', () => {
    expect(normaliseHeading(-90)).toBe(270);
    expect(normaliseHeading(720)).toBe(0);
  });

  it('builds a route path from stops that have coordinates only', () => {
    expect(
      routePath([
        { name: 'A', order: 1, lat: 1, lng: 2 },
        { name: 'B', order: 2, lat: null, lng: null },
        { name: 'C', order: 3, lat: 3, lng: 4 },
      ]),
    ).toEqual([
      { latitude: 1, longitude: 2 },
      { latitude: 3, longitude: 4 },
    ]);
  });

  it('starts the map on the bus, else around the stops, else on India', () => {
    expect(initialRegion(live().location, [])).toMatchObject({ latitude: 28.6, longitude: 77.2 });
    const stops = [
      { name: 'A', order: 1, lat: 28, lng: 77 },
      { name: 'B', order: 2, lat: 29, lng: 78 },
    ];
    const around = initialRegion(null, stops);
    expect(around.latitude).toBeCloseTo(28.5);
    expect(around.latitudeDelta).toBeCloseTo(1.6);
    expect(initialRegion(null, []).latitudeDelta).toBeGreaterThan(5);
  });
});

describe('withResolvedHeading', () => {
  const at = (lat: number, lng: number, heading: number | null): BusLive => ({
    live: true,
    routeName: 'R',
    stops: [],
    location: { lat, lng, heading, speedKmh: null, updatedAt: secondsAgo(1) },
  });

  it('keeps a heading the driver app sent', () => {
    expect(withResolvedHeading(at(28.7, 77.2, 45), at(28.6, 77.2, 10)).location?.heading).toBe(45);
  });

  it('works the heading out from the move when none was sent', () => {
    const resolved = withResolvedHeading(at(28.7, 77.2, null), at(28.6, 77.2, 10));
    expect(Math.round(resolved.location?.heading ?? -1)).toBe(0);
  });

  it('keeps the previous heading when the bus has hardly moved', () => {
    expect(withResolvedHeading(at(28.600001, 77.2, null), at(28.6, 77.2, 123)).location?.heading).toBe(123);
  });

  it('stays null with no previous fix', () => {
    expect(withResolvedHeading(at(28.7, 77.2, null), null).location?.heading).toBeNull();
  });
});

describe('smooth movement', () => {
  it('turns the short way round', () => {
    expect(shortestAngleDelta(350, 10)).toBe(20);
    expect(shortestAngleDelta(10, 350)).toBe(-20);
    expect(lerpAngle(350, 10, 0.5)).toBe(0);
  });

  it('blends two poses and ends exactly on the target', () => {
    const from = { lat: 0, lng: 0, heading: 350 };
    const to = { lat: 10, lng: 20, heading: 10 };
    expect(lerpPose(from, to, 0.5)).toEqual({ lat: 5, lng: 10, heading: 0 });
    expect(lerpPose(from, to, 1)).toEqual({ lat: 10, lng: 20, heading: 10 });
    expect(lerpPose(from, { ...to, heading: null }, 0.5).heading).toBeNull();
  });

  it('eases from 0 to 1 and treats zero duration as finished', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(progress(500, 1000)).toBe(0.5);
    expect(progress(5000, 1000)).toBe(1);
    expect(progress(0, 0)).toBe(1);
  });
});
