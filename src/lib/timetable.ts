import { clockFromTime } from './format';
import type { TimetableSlot } from '@/types/parent';

export const SCHOOL_DAYS = [
  { index: 0, short: 'Mon', long: 'Monday' },
  { index: 1, short: 'Tue', long: 'Tuesday' },
  { index: 2, short: 'Wed', long: 'Wednesday' },
  { index: 3, short: 'Thu', long: 'Thursday' },
  { index: 4, short: 'Fri', long: 'Friday' },
  { index: 5, short: 'Sat', long: 'Saturday' },
] as const;

/** Monday = 0 … Sunday = 6, to match the API. */
export const weekdayIndex = (now: Date): number => (now.getDay() + 6) % 7;

/** Day to open on: today, or Monday on a Sunday. */
export const defaultDayIndex = (now: Date): number => {
  const today = weekdayIndex(now);
  return today > 5 ? 0 : today;
};

export const minutesOf = (time: string | null | undefined): number | null => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes <= 24 * 60 ? minutes : null;
};

const byStart = (a: TimetableSlot, b: TimetableSlot): number =>
  (minutesOf(a.start) ?? 0) - (minutesOf(b.start) ?? 0) || a.period.localeCompare(b.period);

/** Slots keyed by day index (Monday = 0), each day sorted by start time. */
export const groupByDay = (slots: TimetableSlot[]): Map<number, TimetableSlot[]> => {
  const days = new Map<number, TimetableSlot[]>();
  for (const slot of slots) days.set(slot.dayIndex, [...(days.get(slot.dayIndex) ?? []), slot]);
  for (const [day, list] of days) days.set(day, list.sort(byStart));
  return days;
};

/** Index (within the day's sorted list) of the slot running at `now`, or -1. Only meaningful for today. */
export const currentSlotIndex = (daySlots: TimetableSlot[], now: Date): number => {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return daySlots.findIndex((slot) => {
    const start = minutesOf(slot.start);
    const end = minutesOf(slot.end);
    return start !== null && end !== null && minutes >= start && minutes < end;
  });
};

/** "8:30 am to 9:15 am". */
export const slotTimeRange = (slot: TimetableSlot): string => {
  const start = clockFromTime(slot.start);
  const end = clockFromTime(slot.end);
  if (start && end) return `${start} to ${end}`;
  return start ?? end ?? '';
};

/** "1" -> "Period 1"; anything else (e.g. "Assembly") is shown as given. */
export const periodLabel = (period: string): string => (/^\d+$/.test(period.trim()) ? `Period ${period.trim()}` : period.trim());

export const periodCount = (daySlots: TimetableSlot[]): number => daySlots.filter((s) => !s.isBreak).length;
