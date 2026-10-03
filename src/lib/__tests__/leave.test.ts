import { composeReason, leaveRange, leaveStatusChip, validateLeave } from '../leave';

const ok = { startDate: '2026-10-05', endDate: '2026-10-06', reason: 'Not well' };

describe('leave', () => {
  it('accepts a valid note', () => {
    expect(validateLeave(ok)).toEqual({ ok: true });
    expect(validateLeave({ ...ok, endDate: '2026-10-05' })).toEqual({ ok: true });
  });

  it('rejects an end before the start', () => {
    expect(validateLeave({ ...ok, endDate: '2026-10-04' })).toEqual({
      ok: false,
      field: 'dates',
      message: 'The last day cannot be before the first day.',
    });
  });

  it('rejects missing or impossible dates', () => {
    const r = validateLeave({ ...ok, startDate: '' });
    expect(r.ok).toBe(false);
    expect(validateLeave({ ...ok, endDate: '2026-02-31' }).ok).toBe(false);
  });

  it('allows exactly 30 days but not 31', () => {
    expect(validateLeave({ ...ok, startDate: '2026-10-01', endDate: '2026-10-30' }).ok).toBe(true);
    const r = validateLeave({ ...ok, startDate: '2026-10-01', endDate: '2026-10-31' });
    expect(r).toEqual({ ok: false, field: 'dates', message: 'A leave note can cover at most 30 days.' });
  });

  it('checks the reason length after trimming', () => {
    expect(validateLeave({ ...ok, reason: '  ab  ' })).toMatchObject({ ok: false, field: 'reason' });
    expect(validateLeave({ ...ok, reason: 'abc' }).ok).toBe(true);
    expect(validateLeave({ ...ok, reason: 'a'.repeat(500) }).ok).toBe(true);
    expect(validateLeave({ ...ok, reason: 'a'.repeat(501) })).toMatchObject({ ok: false, field: 'reason' });
  });

  it('composes the reason from choice and note', () => {
    expect(composeReason('Not well', 'Fever since last night')).toBe('Not well: Fever since last night');
    expect(composeReason('Not well', '  ')).toBe('Not well');
    expect(composeReason(null, ' Visiting grandparents ')).toBe('Visiting grandparents');
    expect(composeReason(null, '')).toBe('');
  });

  it('describes ranges and statuses', () => {
    expect(leaveRange('2026-10-05', '2026-10-05')).toBe('Mon, 5 Oct');
    expect(leaveRange('2026-10-05', '2026-10-07')).toBe('Mon, 5 Oct to Wed, 7 Oct');
    expect(leaveStatusChip('pending')).toEqual({ label: 'Pending', tone: 'warn' });
    expect(leaveStatusChip('approved').tone).toBe('good');
    expect(leaveStatusChip('rejected').tone).toBe('bad');
  });
});
