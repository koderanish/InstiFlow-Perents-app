import { weekdayName, weekdayShort } from '@/i18n/names';
import { defaultT, type TFunction } from '@/i18n/translate';
import type { Locale } from '@/i18n/types';

import { clockFromTime } from './format';
import type { TimetableSlot } from '@/types/parent';

/** Monday-first day indexes as the API sends them. Names come from `schoolDayNames`. */
export const SCHOOL_DAYS = [{ index: 0 }, { index: 1 }, { index: 2 }, { index: 3 }, { index: 4 }, { index: 5 }] as const;

/** Short and long weekday name for a Monday-first index (0 = Monday), in the chosen language. */
export const schoolDayNames = (locale: Locale, index: number): { short: string; long: string } => {
  const sunday0 = (index + 1) % 7;
  return { short: weekdayShort(locale, sunday0), long: weekdayName(locale, sunday0) };
};

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
export const slotTimeRange = (slot: TimetableSlot, t: TFunction = defaultT, locale: Locale = 'en'): string => {
  const start = clockFromTime(slot.start, locale);
  const end = clockFromTime(slot.end, locale);
  if (start && end) return t('learn.timetable.timeRange', { start, end });
  return start ?? end ?? '';
};

/** "1" -> "Period 1"; anything else (e.g. "Assembly") is shown as given. */
export const periodLabel = (period: string, t: TFunction = defaultT): string =>
  /^\d+$/.test(period.trim()) ? t('learn.timetable.period', { number: period.trim() }) : period.trim();

export const periodCount = (daySlots: TimetableSlot[]): number => daySlots.filter((s) => !s.isBreak).length;
