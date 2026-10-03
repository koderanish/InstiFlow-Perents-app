import { dayMonth, rupees } from './format';
import type { Tone } from './status-copy';
import type { Invoice, InvoiceDetail } from '@/types/parent';

export const invoiceChip = (inv: Invoice, today: string): { label: string; tone: Tone } => {
  if (inv.balance <= 0) return { label: 'Paid', tone: 'good' };
  if (inv.dueDate.slice(0, 10) < today) return { label: `Overdue, ${rupees(inv.balance)}`, tone: 'bad' };
  return { label: `Due ${dayMonth(inv.dueDate) ?? ''}`.trim(), tone: 'warn' };
};

const payMode = (mode: string | null): string => (mode ? ` by ${mode.replace(/[_-]+/g, ' ')}` : '');

/** Plain text for the Share sheet. */
export const receiptText = (inv: InvoiceDetail, schoolName: string, studentName: string): string => {
  const lines = [schoolName, `Fee statement: ${inv.period}`, `Student: ${studentName}`, `Invoice no: ${inv.invoiceNo}`, ''];
  for (const l of inv.lines) lines.push(`${l.label}: ${rupees(l.amount)}`);
  if (inv.fine > 0) lines.push(`Late fine: ${rupees(inv.fine)}`);
  lines.push(`Total: ${rupees(inv.total)}`, `Paid: ${rupees(inv.paid)}`, `Balance: ${rupees(inv.balance)}`);
  if (inv.payments.length > 0) {
    lines.push('', 'Payments');
    for (const p of inv.payments) {
      const when = dayMonth(p.paidOn) ?? p.paidOn;
      lines.push(`${when}: ${rupees(p.amount)}${payMode(p.mode)}${p.receiptNo ? `, receipt ${p.receiptNo}` : ''}`);
    }
  }
  return lines.join('\n');
};
