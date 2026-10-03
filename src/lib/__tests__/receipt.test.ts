import { invoiceChip, receiptText } from '../receipt';
import type { Invoice, InvoiceDetail } from '@/types/parent';

const invoice = (over: Partial<Invoice> = {}): Invoice => ({
  id: 1,
  invoiceNo: 'INV-1',
  period: 'Term 1',
  dueDate: '2026-10-10',
  total: 4500,
  paid: 0,
  balance: 4500,
  fine: 0,
  status: 'pending',
  ...over,
});

describe('receipt', () => {
  it('chips an invoice by balance and due date', () => {
    expect(invoiceChip(invoice({ balance: 0, paid: 4500 }), '2026-10-03')).toEqual({ label: 'Paid', tone: 'good' });
    expect(invoiceChip(invoice(), '2026-10-03')).toEqual({ label: 'Due 10 October', tone: 'warn' });
    expect(invoiceChip(invoice(), '2026-10-11')).toEqual({ label: 'Overdue, ₹4,500', tone: 'bad' });
  });

  it('writes plain share text', () => {
    const detail: InvoiceDetail = {
      ...invoice({ paid: 4500, balance: 0, fine: 100 }),
      lines: [
        { label: 'Tuition', amount: 3800 },
        { label: 'Bus', amount: 700 },
      ],
      payments: [{ id: 9, receiptNo: 'RC-0412', amount: 4500, mode: 'upi', paidOn: '2026-07-04', reference: null }],
    };
    const text = receiptText(detail, 'Sample Public School', 'Aarav Sharma');
    expect(text).toContain('Sample Public School');
    expect(text).toContain('Tuition: ₹3,800');
    expect(text).toContain('Late fine: ₹100');
    expect(text).toContain('Total: ₹4,500');
    expect(text).toContain('Balance: ₹0');
    expect(text).toContain('4 July: ₹4,500 by upi, receipt RC-0412');
  });

  it('skips the payments block when nothing was paid', () => {
    const detail: InvoiceDetail = { ...invoice(), lines: [], payments: [] };
    expect(receiptText(detail, 'S', 'A')).not.toContain('Payments');
  });
});
