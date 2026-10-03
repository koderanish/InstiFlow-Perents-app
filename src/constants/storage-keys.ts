/** SecureStore keys: session credentials only (never logged). */
export const SECURE_STORE_KEYS = {
  accessToken: 'ifp.accessToken',
  refreshToken: 'ifp.refreshToken',
  user: 'ifp.user',
  selectedChild: 'ifp.selectedChild',
  /** Notification choices and the first-run tips flag (not secret, but small and per phone). */
  prefs: 'ifp.prefs',
  /** The school's logo and colour as the admin set them, so the next launch starts in the right colours. */
  branding: 'ifp.branding',
} as const;
