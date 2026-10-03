import { makeT } from '@/i18n/translate';

import { contactActions } from '../contact';
import { fullDate, postedInfo, postedLabel, shortDate } from '../dates';
import { composeReason, leaveRange, leaveStatusChip, REASON_CHOICES, reasonLabelKey, validateLeave } from '../leave';
import { priorityInfo } from '../notices';
import { checkChangePassword } from '../password';
import { passwordStrength } from '../password-strength';
import { invoiceChip } from '../receipt';

const hi = makeT('hi');
const en = makeT('en');

describe('account helpers in Hindi', () => {
  it('writes dates with Hindi names', () => {
    expect(shortDate('2026-10-05', 'hi')).toBe('सोम, 5 अक्टू॰');
    expect(fullDate('2014-03-14', 'hi')).toBe('14 मार्च 2014');
    const now = new Date(2026, 9, 3, 12, 0);
    expect(postedLabel(new Date(2026, 9, 3, 8, 15).toISOString(), now, hi, 'hi')).toBe('आज');
    expect(postedLabel(new Date(2026, 8, 28, 9, 0).toISOString(), now, hi, 'hi')).toBe('28 सितंबर');
  });

  it('says where a timestamp falls', () => {
    const now = new Date(2026, 9, 3, 12, 0);
    expect(postedInfo(new Date(2026, 9, 3, 8, 15).toISOString(), now)).toEqual({ kind: 'today', day: 3, month: 10 });
    expect(postedInfo(new Date(2026, 9, 2, 20, 0).toISOString(), now)?.kind).toBe('yesterday');
    expect(postedInfo(new Date(2026, 8, 28, 9, 0).toISOString(), now)).toEqual({ kind: 'date', day: 28, month: 9 });
    expect(postedInfo('nonsense', now)).toBeNull();
  });

  it('translates leave checks, ranges and statuses', () => {
    const base = { startDate: '2026-10-05', endDate: '2026-10-04', reason: 'Not well' };
    expect(validateLeave(base, hi)).toMatchObject({ ok: false, message: 'आख़िरी दिन, पहले दिन से पहले का नहीं हो सकता।' });
    expect(validateLeave({ ...base, endDate: '2026-12-31' }, en)).toMatchObject({ message: 'A leave note can cover at most 30 days.' });
    expect(leaveRange('2026-10-05', '2026-10-07', hi, 'hi')).toBe('सोम, 5 अक्टू॰ से बुध, 7 अक्टू॰');
    expect(leaveStatusChip('approved', hi).label).toBe('मंज़ूर');
  });

  it('keeps the reason the school receives in English', () => {
    expect(composeReason('Not well', 'x')).toBe('Not well: x');
    for (const choice of REASON_CHOICES) expect(hi(reasonLabelKey(choice))).not.toBe(en(reasonLabelKey(choice)));
  });

  it('translates invoice chips, contact rows and notice priorities', () => {
    const invoice = { id: 1, invoiceNo: 'INV-1', period: 'Term 1', dueDate: '2026-10-10', total: 4500, paid: 0, balance: 4500, fine: 0, status: 'pending' };
    expect(invoiceChip(invoice, '2026-10-03', hi, 'hi')).toEqual({ label: '10 अक्टूबर तक देय', tone: 'warn' });
    expect(invoiceChip(invoice, '2026-10-11', hi, 'hi').label).toBe('देर हो चुकी, ₹4,500');
    const school = { name: 'S', phone: '123', email: null, website: null, address: null };
    expect(contactActions(school, hi)[0]?.title).toBe('स्कूल कार्यालय को कॉल करें');
    expect(priorityInfo('urgent', hi)).toEqual({ label: 'ज़रूरी', tone: 'bad' });
  });

  it('translates password rules and strength', () => {
    const check = checkChangePassword({ current: '', next: 'abc', confirm: 'abc' }, hi);
    expect(check.rules[0]?.label).toBe('कम से कम 8 अक्षर');
    expect(check.blocker).toBe('अपना मौजूदा पासवर्ड लिखें।');
    expect(passwordStrength('abc', hi).label).toBe('कमज़ोर');
  });
});
