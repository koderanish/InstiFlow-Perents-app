import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut, ReduceMotion } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandSplash } from '@/components/account/brand';
import { useBrandingStore } from '@/branding';
import { AppProviders, queryClient } from '@/providers/query-provider';
import { useAuthStore } from '@/stores/auth-store';
import { usePrefsStore } from '@/stores/prefs-store';
import { I18nProvider } from '@/i18n';
import { ThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/** The branded splash stays up at least this long, so the logo can finish settling in. */
const SPLASH_MIN_MS = 700;
const splashOut = FadeOut.duration(320).reduceMotion(ReduceMotion.System);

/** Everything that needs the theme and language sits below the providers. */
export default function RootLayout() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <RootShell />
      </I18nProvider>
    </ThemeProvider>
  );
}

function RootShell() {
  const { colors, isDark } = useTheme();
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    DMSerifDisplay_400Regular,
  });
  const status = useAuthStore((s) => s.status);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const prefsReady = usePrefsStore((s) => s.hydrated);
  const tipsSeen = usePrefsStore((s) => s.tipsSeen);
  const restorePrefs = usePrefsStore((s) => s.restore);
  const brandingReady = useBrandingStore((s) => s.hydrated);
  const restoreBranding = useBrandingStore((s) => s.restore);
  const refreshBranding = useBrandingStore((s) => s.refresh);
  const segments = useSegments();
  const router = useRouter();
  const [splashGone, setSplashGone] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    void restorePrefs();
  }, [restorePrefs]);

  // The saved logo and colour load first so the very first frame is already in the school's colours;
  // the fresh copy is fetched in the background and applied when it arrives.
  useEffect(() => {
    void restoreBranding().then(() => refreshBranding());
  }, [restoreBranding, refreshBranding]);

  const ready = fontsLoaded && prefsReady && brandingReady && (status === 'authenticated' || status === 'unauthenticated');

  // The native splash only covers the first moments. Once fonts are in, our own
  // branded splash takes over until the saved sign-in has been checked.
  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Send signed-out parents to sign in, new parents to the tips once, and signed-in parents away from sign in.
  useEffect(() => {
    if (!ready) return;
    const parts: readonly string[] = segments;
    const inAuth = parts[0] === '(auth)';
    if (status === 'unauthenticated') {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    if (!tipsSeen) {
      if (parts[1] !== 'tips') router.replace('/(app)/tips');
      return;
    }
    if (inAuth) router.replace('/(app)/(tabs)');
  }, [ready, status, tipsSeen, segments, router]);

  // A different parent signing in must never see the previous parent's cached data.
  useEffect(() => {
    if (status === 'unauthenticated') queryClient.clear();
  }, [status]);

  // Once everything is ready the app mounts underneath the splash, which then fades away.
  // The splash is the same element throughout, so its entrance never replays.
  useEffect(() => {
    if (!ready) return undefined;
    const wait = Math.max(150, SPLASH_MIN_MS - (Date.now() - startedAt.current));
    const timer = setTimeout(() => setSplashGone(true), wait);
    return () => clearTimeout(timer);
  }, [ready]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.bg }]}>
      {ready ? (
        <SafeAreaProvider>
          <AppProviders>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
          </AppProviders>
        </SafeAreaProvider>
      ) : null}
      {splashGone ? null : (
        <Animated.View exiting={splashOut} style={[styles.splash, { backgroundColor: colors.bg }]}>
          <BrandSplash />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
});
