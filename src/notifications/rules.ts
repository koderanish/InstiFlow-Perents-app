import type { NotificationPrefs } from '@/lib/prefs';

/** Pure helpers for push notifications. Nothing in here touches the phone, so all of it is tested. */

export type PushPermission = 'unknown' | 'granted' | 'denied' | 'unavailable';

/**
 * The only screens a notification may open. A push payload is data from the network, so it never
 * decides the destination on its own: anything not on this list is ignored and the app just opens.
 * Screens that need an id in the address (a single notice or receipt) are left out on purpose.
 */
export const ALLOWED_ROUTES = [
  '/(app)/(tabs)',
  '/(app)/(tabs)/inbox',
  '/(app)/(tabs)/fees',
  '/(app)/(tabs)/progress',
  '/(app)/attendance',
  '/(app)/bus',
  '/(app)/diary',
  '/(app)/events',
  '/(app)/exams',
  '/(app)/homework',
  '/(app)/leave',
  '/(app)/messages',
  '/(app)/timetable',
  '/(app)/report-card',
  '/(app)/contact',
] as const;

export type AllowedRoute = (typeof ALLOWED_ROUTES)[number];

export const isAllowedRoute = (value: unknown): value is AllowedRoute =>
  typeof value === 'string' && (ALLOWED_ROUTES as readonly string[]).includes(value);

export interface PushData {
  type: string | null;
  route: AllowedRoute | null;
  studentId: number | null;
}

const MAX_TYPE_LENGTH = 40;

/** Reads a notification's `data` safely. Odd shapes give nulls, never throw. */
export function parsePushData(data: unknown): PushData {
  const empty: PushData = { type: null, route: null, studentId: null };
  if (typeof data !== 'object' || data === null) return empty;
  const record = data as Record<string, unknown>;
  const type = typeof record.type === 'string' && /^[a-z_]{1,40}$/i.test(record.type) ? record.type.slice(0, MAX_TYPE_LENGTH) : null;
  const route = isAllowedRoute(record.route) ? record.route : null;
  const rawId = typeof record.studentId === 'string' ? Number(record.studentId) : record.studentId;
  const studentId = typeof rawId === 'number' && Number.isInteger(rawId) && rawId > 0 ? rawId : null;
  return { type, route, studentId };
}

/**
 * The permission result from the phone, as one of our states. "Not asked yet" and "denied but the phone
 * will still show the prompt" both count as unknown, so the button can ask. Only a final no is denied.
 */
export function permissionFrom(result: { granted: boolean; canAskAgain: boolean; status: string }): PushPermission {
  if (result.granted || result.status === 'granted') return 'granted';
  if (result.status === 'denied' && !result.canAskAgain) return 'denied';
  return 'unknown';
}

/** Expo push tokens look like ExponentPushToken[xxxx] (or ExpoPushToken[xxxx]). */
export const isExpoPushToken = (value: unknown): value is string =>
  typeof value === 'string' && /^Expo(nent)?PushToken\[[^\]\s]+\]$/.test(value);

export type PushPlatform = 'ios' | 'android';

export interface RegisterPayload {
  token: string;
  platform: PushPlatform;
  prefs: NotificationPrefs;
}

/** Body of POST /parent/push-token. Returns null for a token or platform the server would not accept. */
export function buildRegisterPayload(token: string, platform: string, prefs: NotificationPrefs): RegisterPayload | null {
  if (!isExpoPushToken(token)) return null;
  if (platform !== 'ios' && platform !== 'android') return null;
  return {
    token,
    platform,
    prefs: {
      bus: prefs.bus,
      attendance: prefs.attendance,
      fees: prefs.fees,
      notices: prefs.notices,
      homework: prefs.homework,
      quietHours: prefs.quietHours,
    },
  };
}

/** Which parts of the app to refresh when a notification of this type arrives. Unknown types refresh everything. */
export function refreshScopes(type: string | null): readonly string[] {
  switch (type) {
    case 'attendance':
      return ['attendance', 'today', 'dashboard'];
    case 'bus':
      return ['bus', 'today'];
    case 'fees':
    case 'fee':
      return ['fees', 'invoice', 'today', 'dashboard'];
    case 'notice':
    case 'notices':
      return ['notices', 'today'];
    case 'homework':
    case 'diary':
      return ['homework', 'diary', 'today'];
    case 'message':
    case 'messages':
      return ['messages', 'notices'];
    default:
      return [];
  }
}

/** True if a TanStack query key such as ['parent', 4, 'fees'] should be refreshed for this notification type. */
export function shouldRefresh(queryKey: readonly unknown[], type: string | null): boolean {
  if (queryKey[0] !== 'parent') return false;
  const scopes = refreshScopes(type);
  if (scopes.length === 0) return true;
  return queryKey.some((part) => typeof part === 'string' && scopes.includes(part));
}
