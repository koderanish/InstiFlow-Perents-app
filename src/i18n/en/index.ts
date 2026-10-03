import { account } from './account';
import { chat } from './chat';
import { common } from './common';
import { learn } from './learn';

/** English is the source of truth: Hindi must have exactly the same keys (the type enforces it). */
export const en = { ...common, ...learn, ...account, ...chat } as const;
