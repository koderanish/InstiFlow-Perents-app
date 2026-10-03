/** SecureStore keys: session credentials only (never logged). */
export const SECURE_STORE_KEYS = {
  accessToken: 'ifp.accessToken',
  refreshToken: 'ifp.refreshToken',
  user: 'ifp.user',
  selectedChild: 'ifp.selectedChild',
  /** Notification choices and the first-run tips flag (not secret, but small and per phone). */
  prefs: 'ifp.prefs',
} as const;
