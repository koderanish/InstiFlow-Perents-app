/** Presentation helpers. Pure, so they can be tested without a device. */

export const firstName = (fullName: string): string => fullName.trim().split(/\s+/)[0] ?? fullName.trim();

export const initials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
};

export const greeting = (date: Date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Indian digit grouping: 1234567 -> 12,34,567. Rounds to whole rupees unless paise are present. */
export const rupees = (amount: number): string => {
  const hasPaise = Math.abs(amount % 1) > 0;
  const fixed = Math.abs(amount).toFixed(hasPaise ? 2 : 0);
  const [whole = '0', paise] = fixed.split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${amount < 0 ? '-' : ''}₹${grouped}${paise ? `.${paise}` : ''}`;
};

export const clock = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'am' : 'pm'}`;
};

/** "07:42" or "07:42:00" -> "7:42 am". */
export const clockFromTime = (time: string | null | undefined): string | null => {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const h = Number(match[1]);
  if (h > 23) return null;
  return `${h % 12 === 0 ? 12 : h % 12}:${match[2]} ${h < 12 ? 'am' : 'pm'}`;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-10-10" -> "10 October". */
export const dayMonth = (day: string | null | undefined): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day ?? '');
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${Number(match[3])} ${month}` : null;
};
