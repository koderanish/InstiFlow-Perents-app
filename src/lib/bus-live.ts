import { z } from 'zod';

import { defaultT, type TFunction } from '@/i18n/translate';

/** Live bus position from the driver app, plus the pure helpers the map screen uses. Nothing here touches the phone. */

export interface Point {
  latitude: number;
  longitude: number;
}

export interface BusLocation {
  lat: number;
  lng: number;
  /** Degrees clockwise from north, 0 to 359. Null when the driver app did not send one. */
  heading: number | null;
  speedKmh: number | null;
  /** ISO timestamp of the GPS fix. */
  updatedAt: string;
}

export interface BusStopPoint {
  name: string;
  order: number;
  lat: number | null;
  lng: number | null;
}

export interface BusLive {
  live: boolean;
  location: BusLocation | null;
  routeName: string | null;
  stops: BusStopPoint[];
}

const validLat = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90;
const validLng = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180;

/** Any angle (including negative or over 360) as 0 to 359.99. */
export const normaliseHeading = (degrees: number): number => ((degrees % 360) + 360) % 360;

const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    const text = v?.trim();
    return text ? text : null;
  });

const locationSchema = z
  .object({
    lat: z.number(),
    lng: z.number(),
    heading: z.number().nullish(),
    speedKmh: z.number().nullish(),
    updatedAt: z.string(),
  })
  .refine((v) => validLat(v.lat) && validLng(v.lng) && !Number.isNaN(Date.parse(v.updatedAt)))
  .transform(
    (v): BusLocation => ({
      lat: v.lat,
      lng: v.lng,
      heading: typeof v.heading === 'number' ? normaliseHeading(v.heading) : null,
      speedKmh: typeof v.speedKmh === 'number' && v.speedKmh >= 0 ? v.speedKmh : null,
      updatedAt: v.updatedAt,
    }),
  );

const stopSchema = z
  .object({
    name: optionalText,
    lat: z.number().nullish(),
    lng: z.number().nullish(),
    order: z.number(),
  })
  .transform((v): BusStopPoint | null => {
    if (!v.name) return null;
    const { lat, lng } = v;
    const hasPoint = validLat(lat) && validLng(lng);
    return { name: v.name, order: v.order, lat: hasPoint ? lat : null, lng: hasPoint ? lng : null };
  });

const responseSchema = z.object({
  live: z.boolean(),
  location: z.unknown().nullish(),
  routeName: optionalText,
  stops: z.array(z.unknown()).nullish(),
});

/**
 * Reads GET /parent/children/:id/bus-location. A bad location becomes "no location" and a bad stop is
 * dropped, so one odd value never blanks the whole map. Stops come back sorted by `order`.
 */
export const parseBusLive = (raw: unknown): BusLive => {
  const outer = responseSchema.parse(raw);
  const location = locationSchema.safeParse(outer.location);
  const stops: BusStopPoint[] = [];
  for (const item of outer.stops ?? []) {
    const parsed = stopSchema.safeParse(item);
    if (parsed.success && parsed.data) stops.push(parsed.data);
  }
  stops.sort((a, b) => a.order - b.order);
  return { live: outer.live, location: location.success ? location.data : null, routeName: outer.routeName, stops };
};

/* ---------- freshness ---------- */

/** A fix older than this is treated as "not live" even if the server still says live. */
export const STALE_AFTER_MS = 2 * 60_000;

export const ageMs = (updatedAt: string, now: Date): number => {
  const at = Date.parse(updatedAt);
  return Number.isNaN(at) ? 0 : Math.max(0, now.getTime() - at);
};

export const isStale = (updatedAt: string, now: Date, limitMs: number = STALE_AFTER_MS): boolean => ageMs(updatedAt, now) > limitMs;

export type AgoUnit = 'now' | 'seconds' | 'minutes' | 'hours' | 'days';

export const agoParts = (ms: number): { unit: AgoUnit; count: number } => {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  if (seconds < 10) return { unit: 'now', count: 0 };
  if (seconds < 60) return { unit: 'seconds', count: seconds };
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return { unit: 'minutes', count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: 'hours', count: hours };
  return { unit: 'days', count: Math.floor(hours / 24) };
};

/** "just now", "42 sec ago", "5 min ago", "3 hr ago", "2 d ago". */
export const agoLabel = (updatedAt: string, now: Date, t: TFunction = defaultT): string => {
  const { unit, count } = agoParts(ageMs(updatedAt, now));
  switch (unit) {
    case 'now':
      return t('busMap.agoNow');
    case 'seconds':
      return t('busMap.agoSeconds', { count });
    case 'minutes':
      return t('busMap.agoMinutes', { count });
    case 'hours':
      return t('busMap.agoHours', { count });
    case 'days':
      return t('busMap.agoDays', { count });
  }
};

/* ---------- what the screen shows ---------- */

export type BusMapState =
  | { kind: 'noRoute' }
  | { kind: 'offline'; lastSeenAt: string | null; hasMapContent: boolean }
  | { kind: 'live'; location: BusLocation };

export const hasStopPoint = (s: BusStopPoint): s is BusStopPoint & { lat: number; lng: number } => s.lat !== null && s.lng !== null;

/**
 * Live only when the server says so and the last fix is fresh. Otherwise the bus is offline, and the
 * map is still worth drawing when there is a last position or stops with coordinates to show.
 */
export const busMapState = (data: BusLive, now: Date): BusMapState => {
  const { location } = data;
  if (data.live && location && !isStale(location.updatedAt, now)) return { kind: 'live', location };
  if (!location && !data.routeName && data.stops.length === 0) return { kind: 'noRoute' };
  return { kind: 'offline', lastSeenAt: location?.updatedAt ?? null, hasMapContent: location !== null || data.stops.some(hasStopPoint) };
};

/* ---------- polling ---------- */

export const POLL_LIVE_MS = 10_000;
/** While the bus is not live we still check now and then, so the map comes alive when the trip starts. */
export const POLL_IDLE_MS = 30_000;

/** `active` is false while the screen is not focused or the app is in the background: no polling at all. */
export const pollInterval = (live: boolean | undefined, active: boolean): number | false => {
  if (!active) return false;
  return live ? POLL_LIVE_MS : POLL_IDLE_MS;
};

/* ---------- geometry ---------- */

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export const distanceMeters = (a: Point, b: Point): number => {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Initial compass bearing from `a` to `b`, 0 to 359.99 (0 = north, 90 = east). */
export const bearingBetween = (a: Point, b: Point): number => {
  const dLng = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLng) * Math.cos(toRad(b.latitude));
  const x = Math.cos(toRad(a.latitude)) * Math.sin(toRad(b.latitude)) - Math.sin(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.cos(dLng);
  return normaliseHeading(toDeg(Math.atan2(y, x)));
};

/** Below this the bus is treated as standing still, so GPS jitter does not spin the arrow. */
export const MIN_MOVE_METERS = 8;

const toPoint = (l: BusLocation): Point => ({ latitude: l.lat, longitude: l.lng });

/**
 * When the driver app sends no heading, work it out from the previous fix: the bearing of the move, or
 * the previous heading if the bus has hardly moved. A heading that was sent always wins.
 */
export const withResolvedHeading = (next: BusLive, previous: BusLive | null): BusLive => {
  const here = next.location;
  const before = previous?.location;
  if (!here || here.heading !== null || !before) return next;
  const moved = distanceMeters(toPoint(before), toPoint(here)) >= MIN_MOVE_METERS;
  const heading = moved ? bearingBetween(toPoint(before), toPoint(here)) : before.heading;
  return { ...next, location: { ...here, heading } };
};

/** Stops that have coordinates, in route order, ready for a polyline. */
export const routePath = (stops: BusStopPoint[]): Point[] => stops.filter(hasStopPoint).map((s) => ({ latitude: s.lat, longitude: s.lng }));

export interface MapRegion extends Point {
  latitudeDelta: number;
  longitudeDelta: number;
}

const MIN_DELTA = 0.012;

/** Where the map first looks: around the bus when it has a position, otherwise around the stops. */
export const initialRegion = (location: BusLocation | null, stops: BusStopPoint[]): MapRegion => {
  if (location) return { latitude: location.lat, longitude: location.lng, latitudeDelta: MIN_DELTA, longitudeDelta: MIN_DELTA };
  const points = routePath(stops);
  if (points.length === 0) return { latitude: 22.5, longitude: 79, latitudeDelta: 20, longitudeDelta: 20 };
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(MIN_DELTA, (maxLat - minLat) * 1.6),
    longitudeDelta: Math.max(MIN_DELTA, (maxLng - minLng) * 1.6),
  };
};

/* ---------- smooth movement ---------- */

/** How long the marker glides from one fix to the next. */
export const MOVE_ANIMATION_MS = 1800;

export interface Pose {
  lat: number;
  lng: number;
  heading: number | null;
}

/** Signed shortest turn from `from` to `to`, -180 to 180, so 350 to 10 turns 20 degrees, not 340. */
export const shortestAngleDelta = (from: number, to: number): number => ((((to - from) % 360) + 540) % 360) - 180;

export const lerpAngle = (from: number, to: number, k: number): number => normaliseHeading(from + shortestAngleDelta(from, to) * k);

export const lerpPose = (from: Pose, to: Pose, k: number): Pose => ({
  lat: from.lat + (to.lat - from.lat) * k,
  lng: from.lng + (to.lng - from.lng) * k,
  heading: from.heading !== null && to.heading !== null ? lerpAngle(from.heading, to.heading, k) : to.heading,
});

export const easeInOut = (k: number): number => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

/** 0 to 1 through an animation. A zero duration is already finished. */
export const progress = (elapsedMs: number, durationMs: number): number => (durationMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsedMs / durationMs)));
