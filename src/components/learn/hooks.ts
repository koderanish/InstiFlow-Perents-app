import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

/** Props for `Screen`: pull down to refetch every parent query that is on screen. */
export function usePullRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void queryClient.invalidateQueries({ queryKey: ['parent'] }).finally(() => setRefreshing(false));
  }, [queryClient]);
  return { refreshing, onRefresh };
}

/** The current time, refreshed every `everyMs` so "Now" and "due today" stay right while the screen is open. */
export function useNow(everyMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
