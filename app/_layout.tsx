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

import { AppProviders, queryClient } from '@/providers/query-provider';
import { useAuthStore } from '@/stores/auth-store';
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
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const ready = fontsLoaded && (status === 'authenticated' || status === 'unauthenticated');

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Send signed-out parents to sign in, and signed-in parents away from it.
  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === '(auth)';
    if (status === 'unauthenticated' && !inAuth) router.replace('/(auth)/login');
    if (status === 'authenticated' && inAuth) router.replace('/(app)/(tabs)');
  }, [ready, status, segments, router]);

  // A different parent signing in must never see the previous parent's cached data.
  useEffect(() => {
    if (status === 'unauthenticated') queryClient.clear();
  }, [status]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </AppProviders>
    </SafeAreaProvider>
  );
}
