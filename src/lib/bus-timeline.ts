import type { Locale } from '@/i18n/types';
import type { BusLeg } from '@/types/parent';

import { clockFromTime } from './format';
import { minutesOf } from './timetable';

export type StopState = 'passed' | 'current' | 'upcoming';

export interface Timeline {
  /** One per stop, same order. */
  states: StopState[];
  /** The line is drawn from the first stop down to this stop. Null = not drawn at all. */
  filledIndex: number | null;
}

/**
 * Where the child is along the route.
 * Not picked up: nothing is filled. On the bus: filled up to the child's stop, which is "current".
 * Dropped off: the whole route is filled.
 */
export const buildTimeline = (stops: { isChildStop: boolean }[], leg: BusLeg): Timeline => {
  const count = stops.length;
  if (count === 0) return { states: [], filledIndex: null };
  if (leg === 'dropped_off') return { states: stops.map((): StopState => 'passed'), filledIndex: count - 1 };
  if (leg === 'on_the_bus') {
    const at = stops.findIndex((s) => s.isChildStop);
    if (at >= 0) {
      return { states: stops.map((_, i): StopState => (i < at ? 'passed' : i === at ? 'current' : 'upcoming')), filledIndex: at };
    }
  }
  return { states: stops.map((): StopState => 'upcoming'), filledIndex: null };
};

/** Pixel length of the filled part of the line, from the vertical centres of the stops. */
export const fillLength = (centers: number[], filledIndex: number | null): number => {
  if (filledIndex === null) return 0;
  const first = centers[0];
  const last = centers[Math.min(filledIndex, centers.length - 1)];
  if (first === undefined || last === undefined) return 0;
  return Math.max(0, last - first);
};

/** Pixel length of the whole line, first stop to last stop. */
export const lineLength = (centers: number[]): number => fillLength(centers, centers.length - 1);

/** Within this many minutes the copy counts down ("in about 12 min") instead of only naming the time. */
const SOON_MINUTES = 90;

export type BusEta =
  | { kind: 'pickupNow'; stop: string }
  | { kind: 'pickupSoon'; stop: string; time: string; minutes: number }
  | { kind: 'pickupAt'; stop: string; time: string }
  | { kind: 'pickupPast'; stop: string; time: string }
  | { kind: 'finishSoon'; time: string; minutes: number }
  | { kind: 'finishAt'; time: string };

/**
 * What to tell the parent about timing, using only the planned times the school sent.
 * Not picked up: the child's stop time. On the bus: when the route is planned to finish. Dropped off: nothing.
 * This is a schedule, not a live position, so the copy always says "planned".
 */
export const busEta = (
  stops: { name: string; time: string | null; isChildStop: boolean }[],
  route: { arrivalTime: string | null },
  leg: BusLeg,
  now: Date,
  locale: Locale = 'en',
): BusEta | null => {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (leg === 'not_started') {
    const stop = stops.find((s) => s.isChildStop);
    const time = clockFromTime(stop?.time, locale);
    const planned = minutesOf(stop?.time);
    if (!stop || !time || planned === null) return null;
    const away = planned - nowMinutes;
    if (away < 0) return { kind: 'pickupPast', stop: stop.name, time };
    if (away === 0) return { kind: 'pickupNow', stop: stop.name };
    if (away <= SOON_MINUTES) return { kind: 'pickupSoon', stop: stop.name, time, minutes: away };
    return { kind: 'pickupAt', stop: stop.name, time };
  }
  if (leg === 'on_the_bus') {
    const time = clockFromTime(route.arrivalTime, locale);
    const planned = minutesOf(route.arrivalTime);
    if (!time || planned === null) return null;
    const away = planned - nowMinutes;
    return away > 0 && away <= SOON_MINUTES ? { kind: 'finishSoon', time, minutes: away } : { kind: 'finishAt', time };
  }
  return null;
};
