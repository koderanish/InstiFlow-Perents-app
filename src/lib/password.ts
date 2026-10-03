import { defaultT, type TFunction } from '@/i18n/translate';

/**
 * Password rules. `newPasswordRules` mirror the backend `passwordSchema`
 * (8+ characters, lower case, upper case, number, special character), so the
 * parent sees what is missing before sending. The backend stays the authority.
 */

export interface PasswordRule {
  id: 'length' | 'lower' | 'upper' | 'number' | 'special';
  label: string;
  met: boolean;
}

export const newPasswordRules = (password: string, t: TFunction = defaultT): PasswordRule[] => [
  { id: 'length', label: t('account.password.rule.length'), met: password.length >= 8 },
  { id: 'lower', label: t('account.password.rule.lower'), met: /[a-z]/.test(password) },
  { id: 'upper', label: t('account.password.rule.upper'), met: /[A-Z]/.test(password) },
  { id: 'number', label: t('account.password.rule.number'), met: /[0-9]/.test(password) },
  { id: 'special', label: t('account.password.rule.special'), met: /[^a-zA-Z0-9]/.test(password) },
];

export interface ChangePasswordInput {
  current: string;
  next: string;
  confirm: string;
}

export interface ChangePasswordCheck {
  ok: boolean;
  rules: PasswordRule[];
  matches: boolean;
  differs: boolean;
  /** First thing blocking the button, or null when ready. */
  blocker: string | null;
}

export const checkChangePassword = ({ current, next, confirm }: ChangePasswordInput, t: TFunction = defaultT): ChangePasswordCheck => {
  const rules = newPasswordRules(next, t);
  const matches = next.length > 0 && next === confirm;
  const differs = next.length > 0 && next !== current;
  let blocker: string | null = null;
  if (current.length === 0) blocker = t('account.password.blocker.current');
  else if (!rules.every((r) => r.met)) blocker = t('account.password.blocker.rules');
  else if (!differs) blocker = t('account.password.blocker.different');
  else if (!matches) blocker = t('account.password.blocker.match');
  return { ok: blocker === null, rules, matches, differs, blocker };
};
