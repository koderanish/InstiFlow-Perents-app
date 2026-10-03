import { clock, clockFromTime, dayMonth, rupees } from './format';
import type { AttendanceStatus, FeeSummary, TodayBus } from '@/types/parent';

export type Tone = 'good' | 'warn' | 'bad' | 'neutral';

export interface Hero {
  chip: string;
  tone: Tone;
  title: string;
  subtitle: string;
}

/** Hero card on Today: what the parent most wants to know first. */
export const attendanceHero = (status: AttendanceStatus, childFirstName: string, classLabel: string): Hero => {
  switch (status) {
    case 'present':
      return { chip: 'Present', tone: 'good', title: `${childFirstName} is at school`, subtitle: classLabel };
    case 'late':
      return { chip: 'Late', tone: 'warn', title: `${childFirstName} arrived late`, subtitle: classLabel };
    case 'absent':
      return { chip: 'Absent', tone: 'bad', title: `${childFirstName} is absent today`, subtitle: classLabel };
    case 'leave':
      return { chip: 'On leave', tone: 'neutral', title: `${childFirstName} is on leave`, subtitle: classLabel };
    default:
      return { chip: 'Not marked yet', tone: 'neutral', title: 'Attendance is not marked yet', subtitle: classLabel };
  }
};

export interface Line {
  title: string;
  subtitle: string;
  /** Small dot at the end of the row. */
  tone?: Tone;
}

/** School bus row; null when the child does not use school transport. */
export const busLine = (bus: TodayBus | null): Line | null => {
  if (!bus || !bus.onTransport || !bus.status) return null;
  const { leg, pickedUpAt, droppedOffAt } = bus.status;
  if (leg === 'dropped_off') {
    const t = clock(droppedOffAt);
    return { title: 'School bus', subtitle: t ? `Dropped off at ${t}` : 'Dropped off', tone: 'good' };
  }
  if (leg === 'on_the_bus') {
    const t = clock(pickedUpAt);
    return { title: 'School bus', subtitle: t ? `On the bus, picked up at ${t}` : 'On the bus', tone: 'good' };
  }
  const due = clockFromTime(bus.stopTime);
  return { title: 'School bus', subtitle: due ? `Pickup due at ${due}` : 'Not picked up yet', tone: 'neutral' };
};

/** Fees row; null when nothing is due. */
export const feesLine = (fees: FeeSummary | null): Line | null => {
  if (!fees || fees.dueAmount <= 0) return null;
  const when = dayMonth(fees.nextDueDate);
  if (fees.overdue) {
    return { title: 'Fees overdue', subtitle: `${rupees(fees.dueAmount)}${when ? `, was due ${when}` : ''}`, tone: 'bad' };
  }
  return { title: 'Fees due', subtitle: `${rupees(fees.dueAmount)}${when ? ` by ${when}` : ''}`, tone: 'neutral' };
};

export const diaryLine = (diary: { classesDone: number; periodsToday: number } | null): Line => {
  if (!diary || diary.classesDone === 0) {
    return { title: 'Today in class', subtitle: 'Nothing added by the teachers yet' };
  }
  const of = diary.periodsToday >= diary.classesDone ? ` of ${diary.periodsToday}` : '';
  return { title: 'Today in class', subtitle: `${diary.classesDone}${of} classes updated` };
};
