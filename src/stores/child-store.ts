import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { SECURE_STORE_KEYS } from '@/constants/storage-keys';

interface ChildState {
  selectedId: number | null;
  select: (id: number) => void;
  restore: () => Promise<void>;
}

export const useChildStore = create<ChildState>((set) => ({
  selectedId: null,
  select: (id) => {
    set({ selectedId: id });
    if (Platform.OS !== 'web') void SecureStore.setItemAsync(SECURE_STORE_KEYS.selectedChild, String(id)).catch(() => undefined);
  },
  restore: async () => {
    if (Platform.OS === 'web') return;
    const raw = await SecureStore.getItemAsync(SECURE_STORE_KEYS.selectedChild).catch(() => null);
    const id = Number(raw);
    if (Number.isInteger(id) && id > 0) set({ selectedId: id });
  },
}));
