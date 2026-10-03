import { useNetInfo } from '@react-native-community/netinfo';
import { useCallback } from 'react';

import { useT } from '@/i18n';
import { friendlyError } from '@/lib/errors';

/** True when the phone itself says it has no internet. Only an explicit "no" counts: unknown is treated as online. */
export function useIsOffline(): boolean {
  const net = useNetInfo();
  return net.isConnected === false || net.isInternetReachable === false;
}

/**
 * Parent-friendly text for a failed request, in the chosen language. While the phone is offline it is
 * always the offline wording, whatever the underlying error was.
 */
export function useErrorText(): (error: unknown) => string {
  const t = useT();
  const offline = useIsOffline();
  return useCallback((error: unknown) => (offline ? t('error.network') : friendlyError(error, t)), [offline, t]);
}
