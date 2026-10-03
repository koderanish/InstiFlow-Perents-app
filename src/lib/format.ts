import { defaultT, type TFunction } from '@/i18n/translate';
import { monthName } from '@/i18n/names';
import type { Locale } from '@/i18n/types';

/** Presentation helpers. Pure, so they can be tested without a device. */

export const firstName = (fullName: string): string => fullName.trim().split(/\s+/)[0] ?? fullName.trim();

export const initials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
};

export const greeting = (date: Date = new Date(), t: TFunction = defaultT): string => {
  const hour = date.getHours();
  if (hour < 12) return t('greeting.morning');
  if (hour < 17) return t('greeting.afternoon');
  return t('greeting.evening');
};

/** Indian digit grouping: 1234567 -> 12,34,567. Rounds to whole rupees unless paise are present. */
export const rupees = (amount: number): string => {
  const hasPaise = Math.abs(amount % 1) > 0;
  const fixed = Math.abs(amount).toFixed(hasPaise ? 2 : 0);
  const [whole = '0', paise] = fixed.split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${amount < 0 ? '-' : ''}₹${grouped}${paise ? `.${paise}` : ''}`;
};

/** Before-noon and after-noon markers. Hindi matches the chat bubbles ('chat.am' / 'chat.pm'). */
const MERIDIEM: Record<Locale, { am: string; pm: string }> = {
  en: { am: 'am', pm: 'pm' },
  hi: { am: 'पूर्वाह्न', pm: 'अपराह्न' },
};

/** 12-hour time such as "7:42 am" or "7:42 अपराह्न". `hour` is 0 to 23. */
const twelveHour = (hour: number, minute: string, locale: Locale): string =>
  `${hour % 12 === 0 ? 12 : hour % 12}:${minute} ${hour < 12 ? MERIDIEM[locale].am : MERIDIEM[locale].pm}`;

export const clock = (iso: string | null | undefined, locale: Locale = 'en'): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return twelveHour(d.getHours(), String(d.getMinutes()).padStart(2, '0'), locale);
};

/** "07:42" or "07:42:00" -> "7:42 am" (or "7:42 पूर्वाह्न"). */
export const clockFromTime = (time: string | null | undefined, locale: Locale = 'en'): string | null => {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const h = Number(match[1]);
  if (h > 23) return null;
  return twelveHour(h, match[2] ?? '00', locale);
};

/** "2026-10-10" -> "10 October" (or "10 अक्टूबर"). */
export const dayMonth = (day: string | null | undefined, locale: Locale = 'en'): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day ?? '');
  if (!match) return null;
  const month = monthName(locale, Number(match[2]));
  return month ? `${Number(match[3])} ${month}` : null;
};
