import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

/** Expo Go on Android cannot do remote push (removed in SDK 53); merely importing the module throws there. */
const runsInExpoGo = (): boolean => Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Push needs a development or store build: not the web, and not Expo Go. */
export const nativePushAvailable = (): boolean => Platform.OS !== 'web' && !(Platform.OS === 'android' && runsInExpoGo());

/**
 * Loads expo-notifications only when it is safe to. A top-level import would crash the whole app in Expo Go,
 * so every caller goes through here and copes with `null`.
 */
export function loadNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (!nativePushAvailable()) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}
