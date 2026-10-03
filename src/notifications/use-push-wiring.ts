import type { NotificationResponse } from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { queryClient } from '@/providers/query-provider';
import { useChildStore } from '@/stores/child-store';
import { usePrefsStore } from '@/stores/prefs-store';

import { loadNotifications } from './native';
import { parsePushData, shouldRefresh } from './rules';
import { configureForegroundNotifications, refreshPushIfAllowed, schedulePrefsSync } from './service';

/** A tap that has been dealt with, so the same notification never opens twice. */
const handled = new Set<string>();

/** Waiting a moment on a cold start lets the app finish its first redirect before we move it again. */
const COLD_START_DELAY_MS = 600;

type Router = ReturnType<typeof useRouter>;

function openFromNotification(response: NotificationResponse, router: Router): void {
  const Notifications = loadNotifications();
  if (!Notifications || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const id = response.notification.request.identifier;
  if (handled.has(id)) return;
  handled.add(id);

  const data = parsePushData(response.notification.request.content.data);
  void queryClient.invalidateQueries({ predicate: (query) => shouldRefresh(query.queryKey, data.type) });
  if (data.studentId !== null) useChildStore.getState().select(data.studentId);
  if (data.route) router.navigate(data.route as Href);
}

/**
 * Connects push to the rest of the app. Mount once, in the root layout.
 * `signedIn` is true when a parent is signed in and past the first-run tips.
 */
export function usePushWiring(signedIn: boolean): void {
  const router = useRouter();

  useEffect(() => {
    configureForegroundNotifications();
  }, []);

  // After sign in, quietly refresh the token if the parent has already allowed notifications.
  // This never shows the permission prompt.
  useEffect(() => {
    if (signedIn) void refreshPushIfAllowed();
  }, [signedIn]);

  // When a switch changes, tell the server shortly after the last change.
  useEffect(() => {
    if (!signedIn) return undefined;
    return usePrefsStore.subscribe((state, previous) => {
      if (previous.hydrated && state.notifications !== previous.notifications) schedulePrefsSync();
    });
  }, [signedIn]);

  // Tapping a notification opens its screen (only if it is on the allowed list) and refreshes the data behind it.
  useEffect(() => {
    const Notifications = loadNotifications();
    if (!signedIn || !Notifications) return undefined;
    const last = Notifications.getLastNotificationResponse();
    const timer = last ? setTimeout(() => openFromNotification(last, router), COLD_START_DELAY_MS) : null;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => openFromNotification(response, router));
    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, [signedIn, router]);
}
