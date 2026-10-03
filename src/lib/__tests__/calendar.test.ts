import { darkPalette, lightPalette } from '@/theme/palette';

import { monthGrid, monthLabel, shiftMonth, statusColor, statusColorFor, statusTint, statusTintFor } from '../calendar';

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

  it('tints day cells softly', () => {
    expect(statusTint('present')).toBe('#1F9D6326');
    expect(statusTint(null)).toBe('transparent');
    expect(statusTint('unknown')).toBe('transparent');
  });

  it('picks status colours from the active palette', () => {
    expect(statusColorFor('present', lightPalette)).toBe(lightPalette.goodDot);
    expect(statusColorFor('present', darkPalette)).toBe(darkPalette.goodDot);
    expect(statusColorFor('absent', darkPalette)).toBe(darkPalette.badFg);
    expect(statusColorFor('leave', lightPalette)).toBe(lightPalette.faint);
    expect(statusColorFor(null, lightPalette)).toBe('transparent');
    expect(statusColorFor('unknown', darkPalette)).toBe('transparent');
  });

  it('tints themed day cells softly', () => {
    expect(statusTintFor('late', darkPalette)).toBe(`${darkPalette.warnFg}26`);
    expect(statusTintFor(null, lightPalette)).toBe('transparent');
  });
});
