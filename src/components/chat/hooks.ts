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
import { useChildren } from '@/features/parent/hooks';
import { makeClientId } from '@/lib/client-id';
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
  // The backend accepts an optional studentId so the school knows which child a message is about.
  const studentId = useChildren().child?.id;
  const query = useMessagesQuery(focused);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  // Tier-1: bodies currently in flight (send dedupes by body while sending).
  const sendingBodies = useRef<Set<string>>(new Set());
  /** Ids on screen when the conversation first loaded. Only bubbles outside this set animate in. */
  const [baseline, setBaseline] = useState<ReadonlySet<string> | null>(null);

  const data = query.data;
  if (baseline === null && data) setBaseline(new Set(data.messages.map((m) => m.id)));

  useMarkRead(focused, data?.unreadCount ?? 0);

  const items = useMemo(() => buildThread(data?.messages ?? [], pending), [data, pending]);
  const rows = useMemo(() => buildRows(items), [items]);

  const submit = useCallback(
    async (message: PendingMessage) => {
      const { localId, body, clientId } = message;
      try {
        const payload = message.studentId === null ? { body, clientId } : { body, clientId, studentId: message.studentId };
        const created = await apiClient.post<ChatMessage>('/parent/messages', payload);
        queryClient.setQueryData<MessagesData>(messagesKey, (old) => appendMessage(old, created));
        setBaseline((prev) => (prev ? new Set(prev).add(created.id) : prev));
        setPending((list) => list.filter((p) => p.localId !== localId));
      } catch {
        errorHaptic();
        setPending((list) => list.map((p) => (p.localId === localId ? { ...p, status: 'failed' } : p)));
      } finally {
        sendingBodies.current.delete(body);
      }
    },
    [queryClient],
  );

  /** Returns true when the text was accepted, so the composer knows to clear. */
  const send = useCallback(
    (raw: string): boolean => {
      const checked = validateMessage(raw);
      if (!checked.ok) return false;
      // Tier-1 guard: a second tap while the same text is still sending must
      // not mint a second clientId (the server dedupes by clientId only).
      if (sendingBodies.current.has(checked.body)) return true;
      sendingBodies.current.add(checked.body);
      const localId = makeLocalId();
      const pendingMessage: PendingMessage = {
        localId,
        body: checked.body,
        createdAt: new Date().toISOString(),
        status: 'sending',
        clientId: makeClientId(),
        studentId: studentId ?? null,
      };
      setPending((list) => [...list, pendingMessage]);
      void submit(pendingMessage);
      return true;
    },
    [submit, studentId],
  );

  const retry = useCallback(
    (localId: string) => {
      const target = pending.find((p) => p.localId === localId);
      if (!target || target.status !== 'failed') return;
      // Tier-1: same clientId resubmitted — server dedupes, but don't spam it.
      if (sendingBodies.current.has(target.body)) return;
      sendingBodies.current.add(target.body);
      setPending((list) => list.map((p) => (p.localId === localId ? { ...p, status: 'sending' } : p)));
      void submit(target);
    },
    [pending, submit],
  );

  const discard = useCallback((localId: string) => {
    setPending((list) => list.filter((p) => p.localId !== localId));
  }, []);

  const isFresh = useCallback((key: string) => baseline !== null && !baseline.has(key), [baseline]);

  return { query, rows, hasMessages: items.length > 0, send, retry, discard, isFresh };
}
