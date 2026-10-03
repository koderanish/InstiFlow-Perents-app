import type { en } from '../en';

import { accountHi } from './account';
import { chatHi } from './chat';
import { commonHi } from './common';
import { learnHi } from './learn';

export const hi: Record<keyof typeof en, string> = { ...commonHi, ...learnHi, ...accountHi, ...chatHi };
