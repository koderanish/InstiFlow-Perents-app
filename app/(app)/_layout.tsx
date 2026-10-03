import { Stack } from 'expo-router';

import { colors } from '@/theme';

/**
 * Screens slide in from the right like the rest of the OS. Forms that interrupt the
 * flow (leave note, change password) rise from the bottom so they feel like a task.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 260,
        contentStyle: { backgroundColor: colors.bg },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="leave" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="change-password" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="tips" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
