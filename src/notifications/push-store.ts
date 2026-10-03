import { create } from 'zustand';

import type { PushPermission } from './rules';

interface PushValues {
  permission: PushPermission;
  /** The Expo push token for this phone, once we have it. */
  token: string | null;
  /** True once the server has accepted the token. */
  registered: boolean;
  /** True while asking for permission or registering. */
  busy: boolean;
  /** Why turning on did not finish: no EAS project id yet ('setup'), or Expo or the server was not reachable ('failed'). */
  error: 'setup' | 'failed' | null;
}

interface PushState extends PushValues {
  set: (patch: Partial<PushValues>) => void;
  reset: () => void;
}

const initial: PushValues = { permission: 'unknown', token: null, registered: false, busy: false, error: null };

export const usePushStore = create<PushState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set({ ...initial }),
}));
