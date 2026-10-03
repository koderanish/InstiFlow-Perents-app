import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { ApiError } from '@/api/client';
import { apiClient, authApi } from '@/api/services';
import { secureTokenStorage } from '@/api/token-storage';
import { SECURE_STORE_KEYS } from '@/constants/storage-keys';
import { unregisterPush } from '@/notifications/service';
import { hasParentRole, type AuthUser, type LoginCredentials } from '@/types/auth';

export type AuthStatus = 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  restoreSession: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  handleSessionExpired: () => void;
}

const webStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const persistUser = async (user: AuthUser) => {
  const raw = JSON.stringify(user);
  if (Platform.OS === 'web') return webStorage()?.setItem(SECURE_STORE_KEYS.user, raw);
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.user, raw);
};

const clearUser = async () => {
  if (Platform.OS === 'web') return webStorage()?.removeItem(SECURE_STORE_KEYS.user);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.user).catch(() => undefined);
};

const readUser = async (): Promise<AuthUser | null> => {
  try {
    const raw =
      Platform.OS === 'web'
        ? (webStorage()?.getItem(SECURE_STORE_KEYS.user) ?? null)
        : await SecureStore.getItemAsync(SECURE_STORE_KEYS.user);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof parsed.id === 'number' && typeof parsed.email === 'string' && Array.isArray(parsed.roles)) {
      return parsed as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
};

/** Message shown to parents. Raw backend text is never displayed. */
const loginMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Incorrect email or password. Please try again.';
    if (error.status === 403) return 'This account cannot sign in here. Please contact the school office.';
    if (error.isNetworkError || error.isTimeout) return 'Could not reach the school. Check your internet and try again.';
  }
  return 'Sign-in failed. Please try again in a moment.';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,

  restoreSession: async () => {
    if (get().status === 'restoring') return;
    set({ status: 'restoring' });
    const [token, user] = await Promise.all([secureTokenStorage.getAccessToken(), readUser()]);
    if (!token || !user || !hasParentRole(user)) {
      await clearUser();
      set({ status: 'unauthenticated', user: null });
      return;
    }
    set({ status: 'authenticated', user });
  },

  login: async (credentials) => {
    let response;
    try {
      response = await authApi.login(credentials);
    } catch (error) {
      if (__DEV__) console.log('[login] failed:', error);
      throw new Error(loginMessage(error));
    }
    const { user, token, refreshToken } = response;
    if (!hasParentRole(user)) {
      throw new Error('This account is not a parent account. Please contact the school office.');
    }
    await secureTokenStorage.storeTokens({ token, refreshToken });
    await persistUser(user);
    set({ status: 'authenticated', user });
  },

  logout: async () => {
    // Before the tokens are cleared, so the request is still signed in. Best effort and quick.
    await unregisterPush();
    try {
      await authApi.logout();
    } catch {
      // An expired session is still a successful sign out locally.
    }
    await secureTokenStorage.clearTokens();
    await clearUser();
    set({ status: 'unauthenticated', user: null });
  },

  handleSessionExpired: () => {
    if (get().status !== 'authenticated') return;
    void clearUser();
    set({ status: 'unauthenticated', user: null });
  },
}));

apiClient.setSessionExpiredHandler(() => useAuthStore.getState().handleSessionExpired());
