import { currentSlotIndex, defaultDayIndex, groupByDay, minutesOf, periodCount, periodLabel, slotTimeRange, weekdayIndex } from '../timetable';
import type { TimetableSlot } from '@/types/parent';

const slot = (dayIndex: number, period: string, start: string, end: string, extra: Partial<TimetableSlot> = {}): TimetableSlot => ({
  dayIndex,
  period,
  start,
  end,
  isBreak: false,
  subject: 'Maths',
  teacher: null,
  ...extra,
});

describe('weekdays', () => {
  it('maps Monday to 0 and Sunday to 6', () => {
    expect(weekdayIndex(new Date(2026, 9, 5))).toBe(0); // Monday
    expect(weekdayIndex(new Date(2026, 9, 2))).toBe(4); // Friday
    expect(weekdayIndex(new Date(2026, 9, 3))).toBe(5); // Saturday
    expect(weekdayIndex(new Date(2026, 9, 4))).toBe(6); // Sunday
  });

  it('opens on today, or Monday on Sunday', () => {
    expect(defaultDayIndex(new Date(2026, 9, 2))).toBe(4);
    expect(defaultDayIndex(new Date(2026, 9, 3))).toBe(5);
    expect(defaultDayIndex(new Date(2026, 9, 4))).toBe(0);
  });
});

describe('groupByDay', () => {
  it('groups by day and sorts by start time', () => {
    const grouped = groupByDay([
      slot(1, '2', '09:15', '10:00', { subject: 'English' }),
      slot(0, '1', '08:30', '09:15'),
      slot(1, '1', '08:30', '09:15', { subject: 'Hindi' }),
      slot(1, 'Break', '10:00', '10:15', { isBreak: true, subject: null }),
    ]);
    expect([...grouped.keys()].sort()).toEqual([0, 1]);
    expect(grouped.get(1)?.map((s) => s.subject)).toEqual(['Hindi', 'English', null]);
    expect(grouped.get(3)).toBeUndefined();
  });

  it('handles an empty timetable', () => {
    expect(groupByDay([]).size).toBe(0);
  });
});

describe('currentSlotIndex', () => {
  const day = [slot(4, '1', '08:30', '09:15'), slot(4, 'Break', '09:15', '09:30', { isBreak: true }), slot(4, '2', '09:30', '10:15')];

  it('finds the running period', () => {
    expect(currentSlotIndex(day, new Date(2026, 9, 2, 8, 30))).toBe(0);
    expect(currentSlotIndex(day, new Date(2026, 9, 2, 9, 14))).toBe(0);
    expect(currentSlotIndex(day, new Date(2026, 9, 2, 9, 20))).toBe(1);
    expect(currentSlotIndex(day, new Date(2026, 9, 2, 10, 0))).toBe(2);
  });

  it('is -1 before, after and with no slots', () => {
    expect(currentSlotIndex(day, new Date(2026, 9, 2, 8, 0))).toBe(-1);
    expect(currentSlotIndex(day, new Date(2026, 9, 2, 10, 15))).toBe(-1);
    expect(currentSlotIndex([], new Date(2026, 9, 2, 9, 0))).toBe(-1);
  });
});

describe('slot copy', () => {
  it('reads times', () => {
    expect(minutesOf('08:30')).toBe(510);
    expect(minutesOf('08:30:00')).toBe(510);
    expect(minutesOf('later')).toBeNull();
    expect(minutesOf(null)).toBeNull();
  });

  it('formats a time range', () => {
    expect(slotTimeRange(slot(0, '1', '08:30', '09:15'))).toBe('8:30 am to 9:15 am');
    expect(slotTimeRange(slot(0, '1', '12:00', '12:45'))).toBe('12:00 pm to 12:45 pm');
  });

  it('labels periods', () => {
    expect(periodLabel('3')).toBe('Period 3');
    expect(periodLabel(' Assembly ')).toBe('Assembly');
  });

  it('counts classes, not breaks', () => {
    expect(periodCount([slot(0, '1', '08:30', '09:15'), slot(0, 'B', '09:15', '09:30', { isBreak: true })])).toBe(1);
  });
});
