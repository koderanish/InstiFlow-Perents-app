import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { SECURE_STORE_KEYS } from '@/constants/storage-keys';
import type { TokenPair } from '@/types/auth';
import type { SessionTokenProvider } from './client';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const isWeb = Platform.OS === 'web';

function getWebStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Production SessionTokenProvider backed by expo-secure-store.
 * Tokens are stored in the device keychain / Keystore and never logged.
 * This is the only module in the app allowed to touch SecureStore for tokens.
 */
export const secureTokenStorage: SessionTokenProvider = {
  async getAccessToken(): Promise<string | null> {
    if (isWeb) {
      return getWebStorage()?.getItem(SECURE_STORE_KEYS.accessToken) ?? null;
    }

    return SecureStore.getItemAsync(SECURE_STORE_KEYS.accessToken, secureStoreOptions);
  },

  async getRefreshToken(): Promise<string | null> {
    if (isWeb) {
      return getWebStorage()?.getItem(SECURE_STORE_KEYS.refreshToken) ?? null;
    }

    return SecureStore.getItemAsync(SECURE_STORE_KEYS.refreshToken, secureStoreOptions);
  },

  async storeTokens(tokens: TokenPair): Promise<void> {
    if (isWeb) {
      const storage = getWebStorage();
      storage?.setItem(SECURE_STORE_KEYS.accessToken, tokens.token);
      storage?.setItem(SECURE_STORE_KEYS.refreshToken, tokens.refreshToken);
      return;
    }

    await Promise.all([
      SecureStore.setItemAsync(
        SECURE_STORE_KEYS.accessToken,
        tokens.token,
        secureStoreOptions,
      ),
      SecureStore.setItemAsync(
        SECURE_STORE_KEYS.refreshToken,
        tokens.refreshToken,
        secureStoreOptions,
      ),
    ]);
  },

  async clearTokens(): Promise<void> {
    if (isWeb) {
      const storage = getWebStorage();
      storage?.removeItem(SECURE_STORE_KEYS.accessToken);
      storage?.removeItem(SECURE_STORE_KEYS.refreshToken);
      return;
    }

    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_STORE_KEYS.accessToken, secureStoreOptions).catch(
        () => undefined,
      ),
      SecureStore.deleteItemAsync(SECURE_STORE_KEYS.refreshToken, secureStoreOptions).catch(
        () => undefined,
      ),
    ]);
  },
};
