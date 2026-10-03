import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { apiClient } from '@/api/services';
import {
  appendMessage,
  buildRows,
  buildThread,
  clearUnread,
  makeLocalId,
  validateMessage,
  type ChatMessage,
  type MessagesData,
  type PendingMessage,
} from '@/lib/messages';
import { errorHaptic } from '@/motion/haptics';

/** Under the `parent` prefix so pull-to-refresh elsewhere also refreshes the chat. */
export const messagesKey = ['parent', 'messages'] as const;

export const POLL_MS = 15_000;

/** True while this screen is the one the parent is looking at. */
export function useScreenFocused(): boolean {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}

/** Messages, refreshed every 15 seconds while the screen is focused. */
export function useMessagesQuery(focused: boolean) {
  return useQuery({
    queryKey: messagesKey,
    queryFn: () => apiClient.get<MessagesData>('/parent/messages'),
    refetchInterval: focused ? POLL_MS : false,
    refetchIntervalInBackground: false,
  });
}

/** Unread count for badges elsewhere in the app. Cheap: shares the chat's cache entry. */
export function useUnreadMessages(): number {
  const query = useQuery({ queryKey: messagesKey, queryFn: () => apiClient.get<MessagesData>('/parent/messages') });
  return query.data?.unreadCount ?? 0;
}

/** Tell the school the parent has read everything, when focused and something is unread. */
function useMarkRead(focused: boolean, unreadCount: number) {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  useEffect(() => {
    if (!focused || unreadCount <= 0 || inFlight.current) return;
    inFlight.current = true;
    apiClient
      .post<{ unreadCount: number }>('/parent/messages/read')
      .then(() => {
        queryClient.setQueryData<MessagesData | undefined>(messagesKey, (old) => clearUnread(old));
      })
      .catch(() => undefined)
      .finally(() => {
        inFlight.current = false;
      });
  }, [focused, unreadCount, queryClient]);
}

/** The whole conversation: server messages, optimistic sends, retry, and which bubbles are new. */
export function useChatThread() {
  const queryClient = useQueryClient();
  const focused = useScreenFocused();
  const query = useMessagesQuery(focused);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  /** Ids on screen when the conversation first loaded. Only bubbles outside this set animate in. */
  const [baseline, setBaseline] = useState<ReadonlySet<string> | null>(null);

  const data = query.data;
  if (baseline === null && data) setBaseline(new Set(data.messages.map((m) => m.id)));

  useMarkRead(focused, data?.unreadCount ?? 0);

  const items = useMemo(() => buildThread(data?.messages ?? [], pending), [data, pending]);
  const rows = useMemo(() => buildRows(items), [items]);

  const submit = useCallback(
    async (localId: string, body: string) => {
      try {
        const created = await apiClient.post<ChatMessage>('/parent/messages', { body });
        queryClient.setQueryData<MessagesData>(messagesKey, (old) => appendMessage(old, created));
        setBaseline((prev) => (prev ? new Set(prev).add(created.id) : prev));
        setPending((list) => list.filter((p) => p.localId !== localId));
      } catch {
        errorHaptic();
        setPending((list) => list.map((p) => (p.localId === localId ? { ...p, status: 'failed' } : p)));
      }
    },
    [queryClient],
  );

  /** Returns true when the text was accepted, so the composer knows to clear. */
  const send = useCallback(
    (raw: string): boolean => {
      const checked = validateMessage(raw);
      if (!checked.ok) return false;
      const localId = makeLocalId();
      setPending((list) => [...list, { localId, body: checked.body, createdAt: new Date().toISOString(), status: 'sending' }]);
      void submit(localId, checked.body);
      return true;
    },
    [submit],
  );

  const retry = useCallback(
    (localId: string) => {
      const target = pending.find((p) => p.localId === localId);
      if (!target || target.status !== 'failed') return;
      setPending((list) => list.map((p) => (p.localId === localId ? { ...p, status: 'sending' } : p)));
      void submit(localId, target.body);
    },
    [pending, submit],
  );

  const discard = useCallback((localId: string) => {
    setPending((list) => list.filter((p) => p.localId !== localId));
  }, []);

  const isFresh = useCallback((key: string) => baseline !== null && !baseline.has(key), [baseline]);

  return { query, rows, hasMessages: items.length > 0, send, retry, discard, isFresh };
}
