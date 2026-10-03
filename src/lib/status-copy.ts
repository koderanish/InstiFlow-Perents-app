import { defaultT, type TFunction } from '@/i18n/translate';
import type { Locale } from '@/i18n/types';
import type { AttendanceStatus, FeeSummary, TodayBus } from '@/types/parent';

import { clock, clockFromTime, dayMonth, rupees } from './format';

export type Tone = 'good' | 'warn' | 'bad' | 'neutral';

export interface Hero {
  chip: string;
  tone: Tone;
  title: string;
  subtitle: string;
}

/** Hero card on Today: what the parent most wants to know first. */
export const attendanceHero = (status: AttendanceStatus, childFirstName: string, classLabel: string, t: TFunction = defaultT): Hero => {
  const name = childFirstName;
  switch (status) {
    case 'present':
      return { chip: t('status.chip.present'), tone: 'good', title: t('status.title.present', { name }), subtitle: classLabel };
    case 'late':
      return { chip: t('status.chip.late'), tone: 'warn', title: t('status.title.late', { name }), subtitle: classLabel };
    case 'absent':
      return { chip: t('status.chip.absent'), tone: 'bad', title: t('status.title.absent', { name }), subtitle: classLabel };
    case 'leave':
      return { chip: t('status.chip.leave'), tone: 'neutral', title: t('status.title.leave', { name }), subtitle: classLabel };
    default:
      return { chip: t('status.chip.notMarked'), tone: 'neutral', title: t('status.title.notMarked'), subtitle: classLabel };
  }
};

export interface Line {
  title: string;
  subtitle: string;
  /** Small dot at the end of the row. */
  tone?: Tone;
}

/** School bus row; null when the child does not use school transport. */
export const busLine = (bus: TodayBus | null, t: TFunction = defaultT): Line | null => {
  if (!bus || !bus.onTransport || !bus.status) return null;
  const { leg, pickedUpAt, droppedOffAt } = bus.status;
  const title = t('bus.title');
  if (leg === 'dropped_off') {
    const time = clock(droppedOffAt);
    return { title, subtitle: time ? t('bus.droppedAt', { time }) : t('bus.dropped'), tone: 'good' };
  }
  if (leg === 'on_the_bus') {
    const time = clock(pickedUpAt);
    return { title, subtitle: time ? t('bus.onBusAt', { time }) : t('bus.onBus'), tone: 'good' };
  }
  const due = clockFromTime(bus.stopTime);
  return { title, subtitle: due ? t('bus.pickupDue', { time: due }) : t('bus.notPicked'), tone: 'neutral' };
};

/** Fees row; null when nothing is due. */
export const feesLine = (fees: FeeSummary | null, t: TFunction = defaultT, locale: Locale = 'en'): Line | null => {
  if (!fees || fees.dueAmount <= 0) return null;
  const date = dayMonth(fees.nextDueDate, locale);
  const amount = rupees(fees.dueAmount);
  if (fees.overdue) {
    return { title: t('fees.line.overdue'), subtitle: date ? t('fees.line.overdueSince', { amount, date }) : t('fees.line.amountOnly', { amount }), tone: 'bad' };
  }
  return { title: t('fees.line.due'), subtitle: date ? t('fees.line.dueBy', { amount, date }) : t('fees.line.amountOnly', { amount }), tone: 'neutral' };
};

export const diaryLine = (diary: { classesDone: number; periodsToday: number } | null, t: TFunction = defaultT): Line => {
  const title = t('diary.title');
  if (!diary || diary.classesDone === 0) return { title, subtitle: t('diary.none') };
  if (diary.periodsToday >= diary.classesDone) {
    return { title, subtitle: t('diary.updatedOf', { done: diary.classesDone, total: diary.periodsToday }) };
  }
  return { title, subtitle: t('diary.updated', { count: diary.classesDone }) };
};
