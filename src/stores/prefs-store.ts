import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { SECURE_STORE_KEYS } from '@/constants/storage-keys';
import { defaultPrefs, parsePrefs, serializePrefs, type NotificationPrefs, type PrefKey } from '@/lib/prefs';

interface PrefsState {
  /** False until the saved choices have been read from the phone. */
  hydrated: boolean;
  notifications: NotificationPrefs;
  tipsSeen: boolean;
  restore: () => Promise<void>;
  setNotification: (key: PrefKey, value: boolean) => void;
  markTipsSeen: () => void;
}

const webStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const read = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') return webStorage()?.getItem(SECURE_STORE_KEYS.prefs) ?? null;
    return await SecureStore.getItemAsync(SECURE_STORE_KEYS.prefs);
  } catch {
    return null;
  }
};

const write = (raw: string): void => {
  if (Platform.OS === 'web') {
    try {
      webStorage()?.setItem(SECURE_STORE_KEYS.prefs, raw);
    } catch {
      // Private browsing: the choice still applies until the page closes.
    }
    return;
  }
  void SecureStore.setItemAsync(SECURE_STORE_KEYS.prefs, raw).catch(() => undefined);
};

export const usePrefsStore = create<PrefsState>((set, get) => {
  const save = () => {
    const { notifications, tipsSeen } = get();
    write(serializePrefs({ notifications, tipsSeen }));
  };
  return {
    hydrated: false,
    ...defaultPrefs(),
    restore: async () => {
      if (get().hydrated) return;
      const saved = parsePrefs(await read());
      set({ hydrated: true, notifications: saved.notifications, tipsSeen: saved.tipsSeen });
    },
    setNotification: (key, value) => {
      set((s) => ({ notifications: { ...s.notifications, [key]: value } }));
      save();
    },
    markTipsSeen: () => {
      set({ tipsSeen: true });
      save();
    },
  };
});
