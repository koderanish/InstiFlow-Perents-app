import type { ExpoConfig } from 'expo/config';

import school from './school.config.json';

/**
 * Each school gets its own compiled app. Everything school specific lives in
 * `school.config.json` (name, short name, school code, accent colour, bundle id).
 * To build for another school, change that file and replace the images in
 * `assets/images` with the school's logo.
 */
const APP_ENV = (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as
  | 'development'
  | 'staging'
  | 'production';

/**
 * Google Maps key for the live bus map on Android builds. Optional: without it the app still builds and
 * the map screen shows its text-only fallback on Android. Expo Go and iOS (Apple Maps) need no key.
 */
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY?.trim() || undefined;

const config: ExpoConfig = {
  name: school.name,
  slug: school.slug,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'instiflowparents',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: school.bundleId,
    supportsTablet: false,
  },
  android: {
    package: school.bundleId,
    adaptiveIcon: {
      backgroundColor: school.accent,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    ...(GOOGLE_MAPS_API_KEY ? { config: { googleMaps: { apiKey: GOOGLE_MAPS_API_KEY } } } : {}),
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        // Android: the tint on the small status-bar icon and the channel alerts arrive on.
        color: school.accent,
        defaultChannel: 'default',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FAF7F4',
        image: './assets/images/splash-icon.png',
        imageWidth: 140,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
    googleMapsConfigured: GOOGLE_MAPS_API_KEY !== undefined,
  },
};

export default config;
