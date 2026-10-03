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
  },
};

export default config;
