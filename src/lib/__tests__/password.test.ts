import { checkChangePassword, newPasswordRules } from '../password';

describe('password', () => {
  it('reports each backend rule', () => {
    const met = (pw: string) => newPasswordRules(pw).filter((r) => r.met).map((r) => r.id);
    expect(met('')).toEqual([]);
    expect(met('abcdefgh')).toEqual(['length', 'lower']);
    expect(met('Abcdef1!')).toEqual(['length', 'lower', 'upper', 'number', 'special']);
    expect(met('Ab1!')).toEqual(['lower', 'upper', 'number', 'special']);
  });

  it('passes a valid change', () => {
    const r = checkChangePassword({ current: 'Old#pass1', next: 'New#pass2', confirm: 'New#pass2' });
    expect(r.ok).toBe(true);
    expect(r.blocker).toBeNull();
    expect(r.matches).toBe(true);
    expect(r.differs).toBe(true);
  });

  it('blocks on each problem in turn', () => {
    expect(checkChangePassword({ current: '', next: 'New#pass2', confirm: 'New#pass2' }).blocker).toMatch(/current/);
    expect(checkChangePassword({ current: 'x', next: 'short', confirm: 'short' }).blocker).toMatch(/every rule/);
    expect(checkChangePassword({ current: 'New#pass2', next: 'New#pass2', confirm: 'New#pass2' }).blocker).toMatch(/different/);
    const mismatch = checkChangePassword({ current: 'x', next: 'New#pass2', confirm: 'New#pass3' });
    expect(mismatch.blocker).toMatch(/do not match/);
    expect(mismatch.ok).toBe(false);
  });
});
