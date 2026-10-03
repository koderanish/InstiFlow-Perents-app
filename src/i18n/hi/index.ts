import type { en } from '../en';

import { accountHi } from './account';
import { busmapHi } from './busmap';
import { chatHi } from './chat';
import { commonHi } from './common';
import { eventsHi } from './events';
import { learnHi } from './learn';

export const hi: Record<keyof typeof en, string> = { ...commonHi, ...learnHi, ...accountHi, ...chatHi, ...eventsHi, ...busmapHi };
