import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/auth-store';
import { usePrefsStore } from '@/stores/prefs-store';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const tipsSeen = usePrefsStore((s) => s.tipsSeen);
  if (status !== 'authenticated') return <Redirect href="/(auth)/login" />;
  return <Redirect href={tipsSeen ? '/(app)/(tabs)' : '/(app)/tips'} />;
}
