import { Stack } from 'expo-router';
import { View } from 'react-native';

import { OfflineBanner } from '@/components/offline-banner';
import { useTheme } from '@/theme';

/**
 * Screens slide in from the right like the rest of the OS. Forms that interrupt the
 * flow (leave note, change password) rise from the bottom so they feel like a task.
 */
export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 260,
          contentStyle: { backgroundColor: colors.bg },
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="leave" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="change-password" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="tips" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </View>
  );
}
