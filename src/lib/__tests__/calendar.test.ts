import { monthGrid, monthLabel, shiftMonth, statusColor } from '../calendar';

describe('calendar', () => {
  it('labels months', () => {
    expect(monthLabel('2026-10')).toBe('October 2026');
  });

  it('shifts across year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-10', 0)).toBe('2026-10');
  });

  it('builds a Monday-first grid with statuses', () => {
    // 1 October 2026 is a Thursday, so there are three leading blanks.
    const cells = monthGrid('2026-10', [{ date: '2026-10-02', status: 'Present' }]);
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]).toEqual({ day: 1, status: null });
    expect(cells[4]).toEqual({ day: 2, status: 'present' });
    expect(cells.length).toBe(3 + 31);
  });

  it('colours statuses', () => {
    expect(statusColor('present')).toBe('#1F9D63');
    expect(statusColor('unknown')).toBe('transparent');
  });
});
