import { monthName, monthShort, weekdayShort } from '@/i18n/names';
import { defaultT, type TFunction } from '@/i18n/translate';
import type { Locale } from '@/i18n/types';

/** Calendar-day helpers on "YYYY-MM-DD" strings. Pure and timezone-safe (no Date parsing of day strings). */

interface Parts {
  y: number;
  m: number;
  d: number;
}

const parse = (day: string | null | undefined): Parts | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day ?? '');
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null;
  return { y, m, d };
};

const stamp = (p: Parts): number => Date.UTC(p.y, p.m - 1, p.d);

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local calendar day of a Date as "YYYY-MM-DD". */
export const toISODate = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const isValidDay = (day: string | null | undefined): boolean => parse(day) !== null;

export const addDays = (day: string, count: number): string | null => {
  const p = parse(day);
  if (!p) return null;
  const next = new Date(stamp(p) + count * 86_400_000);
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
};

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export const daysBetween = (from: string, to: string): number | null => {
  const a = parse(from);
  const b = parse(to);
  if (!a || !b) return null;
  return Math.round((stamp(b) - stamp(a)) / 86_400_000);
};

const weekdayOf = (p: Parts, locale: Locale): string => weekdayShort(locale, new Date(stamp(p)).getUTCDay());

/** "2026-10-05" -> "Mon, 5 Oct" (Hindi uses its own day and month names). */
export const shortDate = (day: string | null | undefined, locale: Locale = 'en'): string | null => {
  const p = parse(day);
  if (!p) return null;
  return `${weekdayOf(p, locale)}, ${p.d} ${monthShort(locale, p.m)}`;
};

/** "2014-03-14" -> "14 March 2014". */
export const fullDate = (day: string | null | undefined, locale: Locale = 'en'): string | null => {
  const p = parse(day);
  if (!p) return null;
  return `${p.d} ${monthName(locale, p.m)} ${p.y}`;
};

export interface StripDay {
  iso: string;
  weekday: string;
  day: number;
  month: string;
}

/** `count` consecutive days starting at `start`, for the leave date chooser. */
export const dayStrip = (start: string, count: number, locale: Locale = 'en'): StripDay[] => {
  const out: StripDay[] = [];
  for (let i = 0; i < count; i += 1) {
    const iso = addDays(start, i);
    const p = parse(iso);
    if (!iso || !p) break;
    out.push({ iso, weekday: weekdayOf(p, locale), day: p.d, month: monthShort(locale, p.m) });
  }
  return out;
};

export interface PostedInfo {
  kind: 'today' | 'yesterday' | 'date';
  day: number;
  /** 1 to 12. */
  month: number;
}

/** Where a timestamp falls relative to `now`, in the phone's timezone. Null when it cannot be read. */
export const postedInfo = (iso: string, now: Date = new Date()): PostedInfo | null => {
  const posted = new Date(iso);
  if (Number.isNaN(posted.getTime())) return null;
  const day = toISODate(posted);
  const today = toISODate(now);
  const p = parse(day);
  if (!p) return null;
  if (day === today) return { kind: 'today', day: p.d, month: p.m };
  if (day === addDays(today, -1)) return { kind: 'yesterday', day: p.d, month: p.m };
  return { kind: 'date', day: p.d, month: p.m };
};

/** "Today", "Yesterday" or "28 September" for a timestamp, in the phone's timezone. */
export const postedLabel = (iso: string, now: Date = new Date(), t: TFunction = defaultT, locale: Locale = 'en'): string => {
  const info = postedInfo(iso, now);
  if (!info) return '';
  if (info.kind === 'today') return t('common.today');
  if (info.kind === 'yesterday') return t('common.yesterday');
  return `${info.day} ${monthName(locale, info.month)}`;
};
