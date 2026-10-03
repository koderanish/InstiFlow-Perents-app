/** Calendar-day helpers on "YYYY-MM-DD" strings. Pure and timezone-safe (no Date parsing of day strings). */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

const monthName = (m: number): string => MONTHS[m - 1] ?? '';

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

const weekdayOf = (p: Parts): string => WEEKDAYS[new Date(stamp(p)).getUTCDay()] ?? '';

/** "2026-10-05" -> "Mon, 5 Oct". */
export const shortDate = (day: string | null | undefined): string | null => {
  const p = parse(day);
  if (!p) return null;
  return `${weekdayOf(p)}, ${p.d} ${monthName(p.m).slice(0, 3)}`;
};

/** "2014-03-14" -> "14 March 2014". */
export const fullDate = (day: string | null | undefined): string | null => {
  const p = parse(day);
  if (!p) return null;
  return `${p.d} ${monthName(p.m)} ${p.y}`;
};

export interface StripDay {
  iso: string;
  weekday: string;
  day: number;
  month: string;
}

/** `count` consecutive days starting at `start`, for the leave date chooser. */
export const dayStrip = (start: string, count: number): StripDay[] => {
  const out: StripDay[] = [];
  for (let i = 0; i < count; i += 1) {
    const iso = addDays(start, i);
    const p = parse(iso);
    if (!iso || !p) break;
    out.push({ iso, weekday: weekdayOf(p), day: p.d, month: monthName(p.m).slice(0, 3) });
  }
  return out;
};

/** "Today", "Yesterday" or "28 September" for a timestamp, in the phone's timezone. */
export const postedLabel = (iso: string, now: Date = new Date()): string => {
  const posted = new Date(iso);
  if (Number.isNaN(posted.getTime())) return '';
  const day = toISODate(posted);
  const today = toISODate(now);
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  const p = parse(day);
  if (!p) return '';
  return `${p.d} ${monthName(p.m)}`;
};
