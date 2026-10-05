import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { apiClient } from '@/api/services';
import { SECURE_STORE_KEYS } from '@/constants/storage-keys';
import { SCHOOL } from '@/config/school';

import { DEFAULT_BRANDING, parseBranding, parseSaved, toSaved, type Branding } from './rules';

type BrandingState = {
  branding: Branding;
  /** False until the saved copy has been read. The app waits for this so the first frame already has the right colour. */
  hydrated: boolean;
  restore: () => Promise<void>;
  /** Asks the server for the school's current logo and colour. Quiet on failure: the saved copy stays. */
  refresh: () => Promise<void>;
  /** Signed-in parents: takes the colour and logo of the school their children are in, which can differ from the compiled-in school code. */
  refreshForParent: () => Promise<void>;
};

const read = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') return typeof window === 'undefined' ? null : window.localStorage.getItem(SECURE_STORE_KEYS.branding);
    return await SecureStore.getItemAsync(SECURE_STORE_KEYS.branding);
  } catch {
    return null;
  }
};

const write = (raw: string): void => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(SECURE_STORE_KEYS.branding, raw);
      return;
    }
    void SecureStore.setItemAsync(SECURE_STORE_KEYS.branding, raw).catch(() => undefined);
  } catch {
    // Saving is a nicety; the fresh copy still applies for this launch.
  }
};

export const useBrandingStore = create<BrandingState>((set, get) => ({
  branding: DEFAULT_BRANDING,
  hydrated: false,
  restore: async () => {
    const saved = parseSaved(await read());
    set({ branding: saved ?? DEFAULT_BRANDING, hydrated: true });
  },
  refresh: async () => {
    try {
      const data = await apiClient.get<unknown>('/parent/branding', { school_code: SCHOOL.code }, { auth: false });
      const next = parseBranding(data, get().branding);
      set({ branding: next });
      write(toSaved(next));
    } catch {
      // Offline or the school is not found: keep what we have.
    }
  },
  refreshForParent: async () => {
    try {
      const data = await apiClient.get<unknown>('/parent/school');
      const next = parseBranding(data, get().branding);
      set({ branding: next });
      write(toSaved(next));
    } catch {
      // Not signed in yet or offline: keep what we have.
    }
  },
}));

/** Name, initials, logo and colour for this school. Re-renders when the admin's choice arrives. */
export const useSchool = (): Branding => useBrandingStore((s) => s.branding);
