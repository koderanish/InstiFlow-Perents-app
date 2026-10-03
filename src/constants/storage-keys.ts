/** SecureStore keys: session credentials only (never logged). */
export const SECURE_STORE_KEYS = {
  accessToken: 'ifp.accessToken',
  refreshToken: 'ifp.refreshToken',
  user: 'ifp.user',
  selectedChild: 'ifp.selectedChild',
} as const;
