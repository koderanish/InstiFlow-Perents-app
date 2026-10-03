import { defaultT, type TFunction, type TKey } from '@/i18n/translate';
import type { Locale } from '@/i18n/types';
import type { LeaveInput, LeaveStatus } from '@/types/parent';

import { daysBetween, isValidDay, shortDate } from './dates';
import type { Tone } from './status-copy';

export const MAX_LEAVE_DAYS = 30;
export const REASON_MIN = 3;
export const REASON_MAX = 500;

/** The English words are what the school receives, whichever language the parent reads the app in. */
export const REASON_CHOICES = ['Not well', 'Family event', 'Other'] as const;
export type ReasonChoice = (typeof REASON_CHOICES)[number];

export const reasonLabelKey = (choice: ReasonChoice): TKey => {
  switch (choice) {
    case 'Not well':
      return 'account.leave.reason.notWell';
    case 'Family event':
      return 'account.leave.reason.familyEvent';
    default:
      return 'account.leave.reason.other';
  }
};

export type LeaveCheck = { ok: true } | { ok: false; field: 'dates' | 'reason'; message: string };

/** Quick checks before sending. The backend re-checks everything (including overlap with earlier notes) and is the final word. */
export const validateLeave = (input: LeaveInput, t: TFunction = defaultT): LeaveCheck => {
  if (!isValidDay(input.startDate) || !isValidDay(input.endDate)) {
    return { ok: false, field: 'dates', message: t('account.leave.check.chooseDays') };
  }
  const span = daysBetween(input.startDate, input.endDate);
  if (span === null || span < 0) {
    return { ok: false, field: 'dates', message: t('account.leave.check.endBeforeStart') };
  }
  if (span + 1 > MAX_LEAVE_DAYS) {
    return { ok: false, field: 'dates', message: t('account.leave.check.tooLong', { max: MAX_LEAVE_DAYS }) };
  }
  const reason = input.reason.trim();
  if (reason.length < REASON_MIN) {
    return { ok: false, field: 'reason', message: t('account.leave.check.reasonShort') };
  }
  if (reason.length > REASON_MAX) {
    return { ok: false, field: 'reason', message: t('account.leave.check.reasonLong', { max: REASON_MAX }) };
  }
  return { ok: true };
};

/** One reason string for the API from the quick choice and the free-text note. */
export const composeReason = (choice: ReasonChoice | null, note: string): string => {
  const text = note.trim();
  if (choice && text) return `${choice}: ${text}`;
  return text || choice || '';
};

export const leaveRange = (start: string, end: string, t: TFunction = defaultT, locale: Locale = 'en'): string => {
  const a = shortDate(start, locale) ?? start;
  if (start === end) return a;
  return t('account.leave.range', { from: a, to: shortDate(end, locale) ?? end });
};

export const leaveStatusChip = (status: LeaveStatus, t: TFunction = defaultT): { label: string; tone: Tone } => {
  switch (status) {
    case 'approved':
      return { label: t('account.leave.status.approved'), tone: 'good' };
    case 'rejected':
      return { label: t('account.leave.status.rejected'), tone: 'bad' };
    default:
      return { label: t('account.leave.status.pending'), tone: 'warn' };
  }
};
