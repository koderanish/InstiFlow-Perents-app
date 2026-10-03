import { attendanceHero, busLine, diaryLine, feesLine } from '../status-copy';

describe('status copy', () => {
  it('attendance hero covers every status', () => {
    expect(attendanceHero('present', 'Aarav', 'Class 6 B')).toMatchObject({ chip: 'Present', tone: 'good', title: 'Aarav is at school' });
    expect(attendanceHero('late', 'Aarav', 'x').tone).toBe('warn');
    expect(attendanceHero('absent', 'Aarav', 'x').title).toBe('Aarav is absent today');
    expect(attendanceHero('leave', 'Aarav', 'x').chip).toBe('On leave');
    expect(attendanceHero('not_marked', 'Aarav', 'x').title).toBe('Attendance is not marked yet');
  });

  it('hides the bus row for children without transport', () => {
    expect(busLine(null)).toBeNull();
    expect(busLine({ onTransport: false })).toBeNull();
  });

  it('describes the bus legs', () => {
    const picked = new Date(2026, 9, 2, 7, 42).toISOString();
    expect(busLine({ onTransport: true, status: { leg: 'on_the_bus', pickedUpAt: picked, droppedOffAt: null } })?.subtitle).toBe('On the bus, picked up at 7:42 am');
    expect(busLine({ onTransport: true, stopTime: '07:40', status: { leg: 'not_started', pickedUpAt: null, droppedOffAt: null } })?.subtitle).toBe('Pickup due at 7:40 am');
    expect(busLine({ onTransport: true, status: { leg: 'dropped_off', pickedUpAt: picked, droppedOffAt: new Date(2026, 9, 2, 14, 10).toISOString() } })?.subtitle).toBe('Dropped off at 2:10 pm');
  });

  it('hides fees when nothing is due and flags overdue', () => {
    expect(feesLine(null)).toBeNull();
    expect(feesLine({ dueAmount: 0, overdue: false, nextDueDate: null, daysUntilDue: null, unpaidCount: 0 })).toBeNull();
    expect(feesLine({ dueAmount: 4500, overdue: false, nextDueDate: '2026-10-10', daysUntilDue: 8, unpaidCount: 1 })?.subtitle).toBe('₹4,500 by 10 October');
    expect(feesLine({ dueAmount: 4500, overdue: true, nextDueDate: '2026-09-20', daysUntilDue: -12, unpaidCount: 1 })).toMatchObject({ title: 'Fees overdue', tone: 'bad' });
  });

  it('diary line handles empty and partial days', () => {
    expect(diaryLine(null).subtitle).toBe('Nothing added by the teachers yet');
    expect(diaryLine({ classesDone: 0, periodsToday: 6 }).subtitle).toBe('Nothing added by the teachers yet');
    expect(diaryLine({ classesDone: 4, periodsToday: 6 }).subtitle).toBe('4 of 6 classes updated');
    expect(diaryLine({ classesDone: 4, periodsToday: 0 }).subtitle).toBe('4 classes updated');
  });
});
