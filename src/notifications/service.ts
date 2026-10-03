import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { parentApi } from '@/api/services';
import { useBrandingStore } from '@/branding';
import { usePrefsStore } from '@/stores/prefs-store';

import { loadNotifications, nativePushAvailable } from './native';
import { usePushStore } from './push-store';
import { buildRegisterPayload, isExpoPushToken, permissionFrom, type PushPermission } from './rules';

/** What happened when we tried to turn push on. */
export type PushResult = 'ok' | 'denied' | 'unavailable' | 'setup' | 'failed';

const CHANNEL_ID = 'default';
const PREFS_DEBOUNCE_MS = 800;
const LOGOUT_WAIT_MS = 4000;

/** Push needs a real phone (and not the web). Simulators and browsers get a quiet note instead. */
export const pushSupported = (): boolean => nativePushAvailable() && Device.isDevice;

const notifications = () => {
  const module = loadNotifications();
  if (!module) throw new Error('Push notifications are not available in this app');
  return module;
};

/** Shows a banner and plays the sound when a notification arrives while the app is open. */
export function configureForegroundNotifications(): void {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = notifications();
  const { name, accent } = useBrandingStore.getState().branding;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name,
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: accent,
  });
}

const readPermission = async (): Promise<{ permission: PushPermission; canAskAgain: boolean }> => {
  const result = await notifications().getPermissionsAsync();
  return { permission: permissionFrom(result), canAskAgain: result.canAskAgain };
};

/** The project id that Expo needs to issue a token. It exists once `eas init` has been run. */
function projectId(): string | null {
  const extra: unknown = Constants.expoConfig?.extra;
  const fromExtra =
    typeof extra === 'object' && extra !== null && 'eas' in extra
      ? (extra as { eas?: { projectId?: unknown } }).eas?.projectId
      : undefined;
  const id = fromExtra ?? Constants.easConfig?.projectId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

type TokenOutcome = { token: string } | { problem: 'setup' | 'failed' };

async function fetchToken(): Promise<TokenOutcome> {
  const id = projectId();
  if (!id) return { problem: 'setup' };
  try {
    const { data } = await notifications().getExpoPushTokenAsync({ projectId: id });
    return isExpoPushToken(data) ? { token: data } : { problem: 'failed' };
  } catch {
    return { problem: 'failed' };
  }
}

async function sendToServer(token: string): Promise<boolean> {
  const payload = buildRegisterPayload(token, Platform.OS, usePrefsStore.getState().notifications);
  if (!payload) return false;
  try {
    const response = await parentApi.registerPushToken(payload);
    return response.registered === true;
  } catch {
    return false;
  }
}

/**
 * Gets this phone's push token and tells the server about it. `askUser` may only be true when the parent
 * has just tapped a button: the permission prompt must never appear on its own.
 */
async function register(askUser: boolean): Promise<PushResult> {
  const store = usePushStore.getState();
  if (!pushSupported()) {
    store.set({ permission: 'unavailable', token: null, registered: false, busy: false });
    return 'unavailable';
  }
  if (store.busy) return 'failed';
  store.set({ busy: true, error: null });
  try {
    await ensureAndroidChannel();
    const current = await readPermission();
    let permission = current.permission;
    if (permission !== 'granted' && askUser && current.canAskAgain) {
      permission = permissionFrom(await notifications().requestPermissionsAsync());
    }
    if (permission !== 'granted') {
      usePushStore.getState().set({ permission, token: null, registered: false });
      return askUser ? 'denied' : 'ok';
    }
    usePushStore.getState().set({ permission: 'granted' });
    const outcome = await fetchToken();
    if ('problem' in outcome) {
      usePushStore.getState().set({ error: outcome.problem });
      return outcome.problem;
    }
    const { token } = outcome;
    const registered = await sendToServer(token);
    usePushStore.getState().set({ token, registered, error: registered ? null : 'failed' });
    return registered ? 'ok' : 'failed';
  } catch {
    usePushStore.getState().set({ error: 'failed' });
    return 'failed';
  } finally {
    usePushStore.getState().set({ busy: false });
  }
}

/** The "Turn on notifications" button. Asks for permission, then registers. Call it only from a tap. */
export const registerForPush = (): Promise<PushResult> => register(true);

/** After sign in: only re-registers when the parent already allowed notifications (tokens can change). */
export async function refreshPushIfAllowed(): Promise<void> {
  if (!pushSupported()) {
    usePushStore.getState().set({ permission: 'unavailable' });
    return;
  }
  try {
    const { permission } = await readPermission();
    if (permission === 'granted') await register(false);
    else usePushStore.getState().set({ permission });
  } catch {
    // Nothing to do: the parent can still turn it on from Notification settings.
  }
}

/**
 * Reads what the phone currently allows, for the Notification settings card. Picks up a change made in the
 * phone's settings. Never shows the prompt.
 */
export async function checkPushPermission(): Promise<void> {
  if (!pushSupported()) {
    usePushStore.getState().set({ permission: 'unavailable' });
    return;
  }
  try {
    const { permission } = await readPermission();
    usePushStore.getState().set({ permission });
    if (permission === 'granted' && !usePushStore.getState().registered) await register(false);
  } catch {
    // Keep showing what we last knew.
  }
}

let prefsTimer: ReturnType<typeof setTimeout> | null = null;

/** Sends the changed choices to the server shortly after the last switch was flipped. Does nothing without a token. */
export function schedulePrefsSync(): void {
  if (prefsTimer) clearTimeout(prefsTimer);
  prefsTimer = setTimeout(() => {
    prefsTimer = null;
    const { token } = usePushStore.getState();
    if (token) void sendToServer(token);
  }, PREFS_DEBOUNCE_MS);
}

/** On sign out: tells the server to stop sending to this phone. Best effort, and it never holds sign out up for long. */
export async function unregisterPush(): Promise<void> {
  if (prefsTimer) {
    clearTimeout(prefsTimer);
    prefsTimer = null;
  }
  const work = async () => {
    if (!pushSupported()) return;
    let token = usePushStore.getState().token;
    if (!token) {
      const { permission } = await readPermission();
      if (permission !== 'granted') return;
      const fetched = await fetchToken();
      token = 'token' in fetched ? fetched.token : null;
    }
    if (token) await parentApi.removePushToken(token);
  };
  try {
    await Promise.race([work(), new Promise<void>((resolve) => setTimeout(resolve, LOGOUT_WAIT_MS))]);
  } catch {
    // The server drops dead tokens by itself when delivery fails.
  } finally {
    usePushStore.getState().reset();
  }
}
