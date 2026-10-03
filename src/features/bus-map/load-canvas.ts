import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type CanvasModule = typeof import('./bus-map-canvas');

let cached: CanvasModule | null | undefined;

/**
 * Android builds need a Google Maps key baked in (GOOGLE_MAPS_API_KEY at build time). Expo Go carries its
 * own, and iOS uses Apple Maps. Opening a Google map without a key crashes the app, so we refuse instead.
 */
const mapsSupported = (): boolean => {
  if (Platform.OS === 'web') return false;
  if (Platform.OS !== 'android') return true;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return true;
  return Constants.expoConfig?.extra?.googleMapsConfigured === true;
};

/**
 * Loads the map view only when it is safe to. react-native-maps touches native code as soon as it is
 * imported, so a top-level import could take the whole app down where it is missing. Callers show a
 * text-only fallback when this returns null.
 */
export function loadBusMapCanvas(): CanvasModule | null {
  if (cached !== undefined) return cached;
  if (!mapsSupported()) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('./bus-map-canvas') as CanvasModule;
  } catch {
    cached = null;
  }
  return cached;
}
