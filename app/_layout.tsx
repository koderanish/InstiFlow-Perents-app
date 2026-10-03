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
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandSplash } from '@/components/account/brand';
import { AppProviders, queryClient } from '@/providers/query-provider';
import { useAuthStore } from '@/stores/auth-store';
import { usePrefsStore } from '@/stores/prefs-store';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    void restorePrefs();
  }, [restorePrefs]);

  const ready = fontsLoaded && prefsReady && (status === 'authenticated' || status === 'unauthenticated');

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

  if (!fontsLoaded) return null;
  if (!ready) return <BrandSplash />;

  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </AppProviders>
    </SafeAreaProvider>
  );
}
