import { newPasswordRules } from './password';

export type StrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface Strength {
  level: StrengthLevel;
  label: string;
  /** 0 to 1, for the width of the strength bar. */
  fraction: number;
  /** Rules met, plus one for a long (12+ characters) password. 0 to 6. */
  points: number;
}

export const STRENGTH_MAX_POINTS = 6;
const LONG_PASSWORD = 12;

const LABELS: Record<StrengthLevel, string> = {
  empty: '',
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

/** A friendly cue next to the rule list. The backend rules stay the authority. */
export const passwordStrength = (password: string): Strength => {
  const met = newPasswordRules(password).filter((r) => r.met).length;
  const points = password.length === 0 ? 0 : met + (password.length >= LONG_PASSWORD ? 1 : 0);
  let level: StrengthLevel;
  if (password.length === 0) level = 'empty';
  else if (points <= 2) level = 'weak';
  else if (points === 3) level = 'fair';
  else if (points === 4) level = 'good';
  else level = 'strong';
  return { level, label: LABELS[level], fraction: points / STRENGTH_MAX_POINTS, points };
};
