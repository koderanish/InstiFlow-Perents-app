import { account } from './account';
import { chat } from './chat';
import { common } from './common';
import { events } from './events';
import { learn } from './learn';

/** English is the source of truth: Hindi must have exactly the same keys (the type enforces it). */
export const en = { ...common, ...learn, ...account, ...chat, ...events } as const;
