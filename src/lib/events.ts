import { z } from 'zod';

import { daysFromToday } from './learn-dates';

/** One school event. Optional fields from the server are normalised to null. */
export interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  /** YYYY-MM-DD */
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
}

const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    const text = v?.trim();
    return text ? text : null;
  });

const eventSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(String),
  title: z.string().trim().min(1),
  description: optionalText,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/).transform((v) => v.slice(0, 10)),
  startTime: optionalText,
  endTime: optionalText,
  location: optionalText,
});

const responseSchema = z.object({ events: z.array(z.unknown()) });

/** Reads GET /parent/events. A malformed event is dropped rather than failing the whole list. */
export const parseEvents = (raw: unknown): SchoolEvent[] => {
  const outer = responseSchema.parse(raw);
  const events: SchoolEvent[] = [];
  for (const item of outer.events) {
    const parsed = eventSchema.safeParse(item);
    if (parsed.success) events.push(parsed.data);
  }
  return events;
};

export interface MonthGroup {
  /** "YYYY-MM" */
  key: string;
  year: number;
  month: number;
  events: SchoolEvent[];
}

export interface EventPlan {
  upcoming: MonthGroup[];
  past: MonthGroup[];
  pastCount: number;
}

const LAST = '99:99';

const compare = (a: SchoolEvent, b: SchoolEvent): number =>
  a.date.localeCompare(b.date) || (a.startTime ?? LAST).localeCompare(b.startTime ?? LAST) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);

const groupByMonth = (events: SchoolEvent[]): MonthGroup[] => {
  const groups: MonthGroup[] = [];
  for (const event of events) {
    const key = event.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.events.push(event);
    } else {
      groups.push({ key, year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)), events: [event] });
    }
  }
  return groups;
};

/**
 * Today and later go in `upcoming` (soonest first); earlier days go in `past` (most recent first).
 * Both are grouped by calendar month.
 */
export const buildEventPlan = (events: readonly SchoolEvent[], now: Date): EventPlan => {
  const sorted = [...events].sort(compare);
  const isPast = (e: SchoolEvent) => {
    const days = daysFromToday(e.date, now);
    return days !== null && days < 0;
  };
  const past = sorted.filter(isPast).reverse();
  const upcoming = sorted.filter((e) => !isPast(e));
  return { upcoming: groupByMonth(upcoming), past: groupByMonth(past), pastCount: past.length };
};
