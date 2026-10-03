import { daysBetween, isValidDay, shortDate } from './dates';
import type { Tone } from './status-copy';
import type { LeaveInput, LeaveStatus } from '@/types/parent';

export const MAX_LEAVE_DAYS = 30;
export const REASON_MIN = 3;
export const REASON_MAX = 500;

export const REASON_CHOICES = ['Not well', 'Family event', 'Other'] as const;
export type ReasonChoice = (typeof REASON_CHOICES)[number];

export type LeaveCheck = { ok: true } | { ok: false; field: 'dates' | 'reason'; message: string };

/** Quick checks before sending. The backend re-checks everything (including overlap with earlier notes) and is the final word. */
export const validateLeave = (input: LeaveInput): LeaveCheck => {
  if (!isValidDay(input.startDate) || !isValidDay(input.endDate)) {
    return { ok: false, field: 'dates', message: 'Please choose the first and last day of the leave.' };
  }
  const span = daysBetween(input.startDate, input.endDate);
  if (span === null || span < 0) {
    return { ok: false, field: 'dates', message: 'The last day cannot be before the first day.' };
  }
  if (span + 1 > MAX_LEAVE_DAYS) {
    return { ok: false, field: 'dates', message: `A leave note can cover at most ${MAX_LEAVE_DAYS} days.` };
  }
  const reason = input.reason.trim();
  if (reason.length < REASON_MIN) {
    return { ok: false, field: 'reason', message: 'Please tell the teacher why, in a few words.' };
  }
  if (reason.length > REASON_MAX) {
    return { ok: false, field: 'reason', message: `Please keep the reason under ${REASON_MAX} characters.` };
  }
  return { ok: true };
};

/** One reason string for the API from the quick choice and the free-text note. */
export const composeReason = (choice: ReasonChoice | null, note: string): string => {
  const text = note.trim();
  if (choice && text) return `${choice}: ${text}`;
  return text || choice || '';
};

export const leaveRange = (start: string, end: string): string => {
  const a = shortDate(start) ?? start;
  if (start === end) return a;
  return `${a} to ${shortDate(end) ?? end}`;
};

export const leaveStatusChip = (status: LeaveStatus): { label: string; tone: Tone } => {
  switch (status) {
    case 'approved':
      return { label: 'Approved', tone: 'good' };
    case 'rejected':
      return { label: 'Rejected', tone: 'bad' };
    default:
      return { label: 'Pending', tone: 'warn' };
  }
};
