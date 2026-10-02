import { clock, clockFromTime, dayMonth, firstName, greeting, initials, rupees } from '../format';

describe('format', () => {
  it('groups rupees the Indian way', () => {
    expect(rupees(4500)).toBe('₹4,500');
    expect(rupees(123)).toBe('₹123');
    expect(rupees(1234567)).toBe('₹12,34,567');
    expect(rupees(1000.5)).toBe('₹1,000.50');
    expect(rupees(0)).toBe('₹0');
  });

  it('formats clock times', () => {
    expect(clock(new Date(2026, 9, 2, 7, 42).toISOString())).toBe('7:42 am');
    expect(clock(new Date(2026, 9, 2, 14, 5).toISOString())).toBe('2:05 pm');
    expect(clock(new Date(2026, 9, 2, 0, 0).toISOString())).toBe('12:00 am');
    expect(clock(null)).toBeNull();
    expect(clock('nonsense')).toBeNull();
  });

  it('formats HH:MM strings', () => {
    expect(clockFromTime('07:40')).toBe('7:40 am');
    expect(clockFromTime('13:05:00')).toBe('1:05 pm');
    expect(clockFromTime('25:00')).toBeNull();
    expect(clockFromTime(undefined)).toBeNull();
  });

  it('formats day and month', () => {
    expect(dayMonth('2026-10-10')).toBe('10 October');
    expect(dayMonth('2026-02-01T00:00:00.000Z')).toBe('1 February');
    expect(dayMonth('x')).toBeNull();
  });

  it('names and initials', () => {
    expect(firstName('Meera Sharma')).toBe('Meera');
    expect(initials('Meera Sharma')).toBe('MS');
    expect(initials('  ')).toBe('?');
  });

  it('greets by time of day', () => {
    expect(greeting(new Date(2026, 9, 2, 8))).toBe('Good morning');
    expect(greeting(new Date(2026, 9, 2, 13))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 9, 2, 19))).toBe('Good evening');
  });
});
