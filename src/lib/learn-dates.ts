import { monthShort } from '@/i18n/names';
import type { Locale } from '@/i18n/types';

/** Calendar-day helpers. Work on "YYYY-MM-DD" keys so time zones never shift a school date. */

const pad = (n: number) => String(n).padStart(2, '0');

/** The device's local calendar day as "YYYY-MM-DD". */
export const dateKey = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toDayNumber = (key: string | null | undefined): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(key ?? '');
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return Math.round(Date.UTC(Number(match[1]), month - 1, day) / 86_400_000);
};

/** Whole days from `now` (local day) to the given date. 0 = today, 1 = tomorrow, -1 = yesterday. */
export const daysFromToday = (key: string | null | undefined, now: Date): number | null => {
  const target = toDayNumber(key);
  const today = toDayNumber(dateKey(now));
  if (target === null || today === null) return null;
  return target - today;
};

/** "2026-10-09" -> { day: "9", month: "Oct" } for date tiles. */
export const shortDateParts = (key: string | null | undefined, locale: Locale = 'en'): { day: string; month: string } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(key ?? '');
  if (!match) return null;
  const month = monthShort(locale, Number(match[2]));
  return month ? { day: String(Number(match[3])), month } : null;
};
