/** Month calendar helpers for the attendance screen. Pure and unit tested. */

export type CalendarCell = { day: number; status: string | null } | null;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-10" -> "October 2026". */
export const monthLabel = (month: string): string => {
  const [y, m] = month.split('-');
  const name = MONTHS[Number(m) - 1];
  return name && y ? `${name} ${y}` : month;
};

/** Moves a "YYYY-MM" month by `delta` months. */
export const shiftMonth = (month: string, delta: number): string => {
  const [y = 0, m = 1] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + delta;
  const year = Math.floor(index / 12);
  const mon = (index % 12) + 1;
  return `${year}-${String(mon).padStart(2, '0')}`;
};

/** Cells for a Monday-first grid: leading blanks, then each day with its status. */
export const monthGrid = (month: string, days: { date: string; status: string }[]): CalendarCell[] => {
  const [y = 0, m = 1] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const lead = (first + 6) % 7;
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const byDay = new Map(days.map((d) => [Number(d.date.slice(8, 10)), d.status.toLowerCase()]));
  const cells: CalendarCell[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= total; day += 1) cells.push({ day, status: byDay.get(day) ?? null });
  return cells;
};

/** Soft background for a day cell: the status colour at about 15% opacity. */
export const statusTint = (status: string | null): string => {
  if (!status) return 'transparent';
  const solid = statusColor(status);
  return solid === 'transparent' ? solid : `${solid}26`;
};

export const statusColor = (status: string): string => {
  switch (status) {
    case 'present':
      return '#1F9D63';
    case 'late':
      return '#D98A00';
    case 'absent':
      return '#B4233A';
    case 'leave':
      return '#8A8179';
    default:
      return 'transparent';
  }
};
