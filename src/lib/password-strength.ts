import { defaultT, type TFunction } from '@/i18n/translate';

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

const labelFor = (level: StrengthLevel, t: TFunction): string => {
  switch (level) {
    case 'weak':
      return t('account.password.strength.weak');
    case 'fair':
      return t('account.password.strength.fair');
    case 'good':
      return t('account.password.strength.good');
    case 'strong':
      return t('account.password.strength.strong');
    default:
      return '';
  }
};

/** A friendly cue next to the rule list. The backend rules stay the authority. */
export const passwordStrength = (password: string, t: TFunction = defaultT): Strength => {
  const met = newPasswordRules(password).filter((r) => r.met).length;
  const points = password.length === 0 ? 0 : met + (password.length >= LONG_PASSWORD ? 1 : 0);
  let level: StrengthLevel;
  if (password.length === 0) level = 'empty';
  else if (points <= 2) level = 'weak';
  else if (points === 3) level = 'fair';
  else if (points === 4) level = 'good';
  else level = 'strong';
  return { level, label: labelFor(level, t), fraction: points / STRENGTH_MAX_POINTS, points };
};
