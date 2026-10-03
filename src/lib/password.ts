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

export const newPasswordRules = (password: string): PasswordRule[] => [
  { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
  { id: 'lower', label: 'One lower case letter', met: /[a-z]/.test(password) },
  { id: 'upper', label: 'One upper case letter', met: /[A-Z]/.test(password) },
  { id: 'number', label: 'One number', met: /[0-9]/.test(password) },
  { id: 'special', label: 'One special character, like ! or @', met: /[^a-zA-Z0-9]/.test(password) },
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

export const checkChangePassword = ({ current, next, confirm }: ChangePasswordInput): ChangePasswordCheck => {
  const rules = newPasswordRules(next);
  const matches = next.length > 0 && next === confirm;
  const differs = next.length > 0 && next !== current;
  let blocker: string | null = null;
  if (current.length === 0) blocker = 'Enter your current password.';
  else if (!rules.every((r) => r.met)) blocker = 'The new password does not meet every rule yet.';
  else if (!differs) blocker = 'The new password must be different from the current one.';
  else if (!matches) blocker = 'The two new passwords do not match.';
  return { ok: blocker === null, rules, matches, differs, blocker };
};
