import { defaultT, type TFunction } from '@/i18n/translate';
import type { Locale } from '@/i18n/types';
import type { Invoice, InvoiceDetail } from '@/types/parent';

import { dayMonth, rupees } from './format';
import type { Tone } from './status-copy';

export const invoiceChip = (inv: Invoice, today: string, t: TFunction = defaultT, locale: Locale = 'en'): { label: string; tone: Tone } => {
  if (inv.balance <= 0) return { label: t('account.receipt.chipPaid'), tone: 'good' };
  if (inv.dueDate.slice(0, 10) < today) return { label: t('account.receipt.chipOverdue', { amount: rupees(inv.balance) }), tone: 'bad' };
  const date = dayMonth(inv.dueDate, locale);
  return { label: date ? t('account.receipt.chipDueOn', { date }) : t('account.receipt.chipDue'), tone: 'warn' };
};

const payMode = (mode: string | null, t: TFunction): string => (mode ? t('account.receipt.text.by', { mode: mode.replace(/[_-]+/g, ' ') }) : '');

/** Plain text for the Share sheet. */
export const receiptText = (inv: InvoiceDetail, schoolName: string, studentName: string, t: TFunction = defaultT, locale: Locale = 'en'): string => {
  const lines = [
    schoolName,
    t('account.receipt.text.statement', { period: inv.period }),
    t('account.receipt.text.student', { name: studentName }),
    t('account.receipt.text.invoiceNo', { no: inv.invoiceNo }),
    '',
  ];
  for (const l of inv.lines) lines.push(`${l.label}: ${rupees(l.amount)}`);
  if (inv.fine > 0) lines.push(t('account.receipt.text.fine', { amount: rupees(inv.fine) }));
  lines.push(
    t('account.receipt.text.total', { amount: rupees(inv.total) }),
    t('account.receipt.text.paid', { amount: rupees(inv.paid) }),
    t('account.receipt.text.balance', { amount: rupees(inv.balance) }),
  );
  if (inv.payments.length > 0) {
    lines.push('', t('account.receipt.text.payments'));
    for (const p of inv.payments) {
      const when = dayMonth(p.paidOn, locale) ?? p.paidOn;
      const receipt = p.receiptNo ? t('account.receipt.text.receiptNo', { no: p.receiptNo }) : '';
      lines.push(`${when}: ${rupees(p.amount)}${payMode(p.mode, t)}${receipt}`);
    }
  }
  return lines.join('\n');
};
