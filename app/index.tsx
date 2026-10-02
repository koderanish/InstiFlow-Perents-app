import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  return <Redirect href={status === 'authenticated' ? '/(app)/(tabs)' : '/(auth)/login'} />;
}
