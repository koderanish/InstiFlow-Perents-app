import type { BusLeg } from '@/types/parent';

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
