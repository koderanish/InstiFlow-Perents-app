import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Back button action that still works when the screen was opened from a link with no history. */
export function useGoBack(): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)');
  }, [router]);
}
