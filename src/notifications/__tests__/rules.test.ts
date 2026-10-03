import { defaultPrefs } from '@/lib/prefs';

import { ALLOWED_ROUTES, buildRegisterPayload, isExpoPushToken, parsePushData, permissionFrom, shouldRefresh } from '../rules';

describe('parsePushData', () => {
  it('accepts a known route and a student id', () => {
    expect(parsePushData({ type: 'attendance', route: '/(app)/attendance', studentId: 7 })).toEqual({
      type: 'attendance',
      route: '/(app)/attendance',
      studentId: 7,
    });
  });

  it('accepts a numeric string student id (some senders stringify data)', () => {
    expect(parsePushData({ route: '/(app)/bus', studentId: '12' }).studentId).toBe(12);
  });

  it('never lets an unknown or odd route through', () => {
    const bad = [
      'https://evil.example.com',
      '//evil.example.com',
      'instiflowparents://login',
      '/(auth)/login',
      '/(app)/attendance?x=1',
      '/(app)/../(auth)/login',
      '/(app)/notice',
      ' /(app)/attendance',
      '/(app)/Attendance',
      '',
      42,
      null,
      undefined,
      { route: '/(app)/attendance' },
    ];
    for (const route of bad) expect(parsePushData({ route }).route).toBeNull();
  });

  it('survives data that is not an object', () => {
    for (const data of [null, undefined, 'text', 5, [], true]) {
      expect(parsePushData(data)).toEqual({ type: null, route: null, studentId: null });
    }
  });

  it('rejects bad student ids and odd types', () => {
    expect(parsePushData({ studentId: -1 }).studentId).toBeNull();
    expect(parsePushData({ studentId: 1.5 }).studentId).toBeNull();
    expect(parsePushData({ studentId: 'abc' }).studentId).toBeNull();
    expect(parsePushData({ type: '<script>' }).type).toBeNull();
  });

  it('only lists screens that need no extra address', () => {
    for (const route of ALLOWED_ROUTES) expect(route.startsWith('/(app)')).toBe(true);
    expect(ALLOWED_ROUTES as readonly string[]).not.toContain('/(app)/notice');
    expect(ALLOWED_ROUTES as readonly string[]).not.toContain('/(app)/receipt');
  });
});

describe('permissionFrom', () => {
  it('maps the phone result', () => {
    expect(permissionFrom({ granted: true, canAskAgain: true, status: 'granted' })).toBe('granted');
    expect(permissionFrom({ granted: false, canAskAgain: true, status: 'undetermined' })).toBe('unknown');
    expect(permissionFrom({ granted: false, canAskAgain: false, status: 'denied' })).toBe('denied');
    expect(permissionFrom({ granted: false, canAskAgain: true, status: 'denied' })).toBe('unknown');
  });
});

describe('buildRegisterPayload', () => {
  const token = 'ExponentPushToken[abc123_-XYZ]';

  it('builds the body the server expects', () => {
    const prefs = defaultPrefs().notifications;
    expect(buildRegisterPayload(token, 'android', prefs)).toEqual({
      token,
      platform: 'android',
      prefs: { bus: true, attendance: true, fees: true, notices: true, homework: true, quietHours: true },
    });
  });

  it('refuses a bad token or platform', () => {
    const prefs = defaultPrefs().notifications;
    expect(buildRegisterPayload('nope', 'ios', prefs)).toBeNull();
    expect(buildRegisterPayload(token, 'web', prefs)).toBeNull();
    expect(isExpoPushToken('ExpoPushToken[x]')).toBe(true);
    expect(isExpoPushToken('ExpoPushToken[]')).toBe(false);
  });
});

describe('shouldRefresh', () => {
  it('refreshes the matching parts for a known type', () => {
    expect(shouldRefresh(['parent', 3, 'fees'], 'fees')).toBe(true);
    expect(shouldRefresh(['parent', 3, 'attendance', 'current'], 'fees')).toBe(false);
    expect(shouldRefresh(['parent', 'messages'], 'message')).toBe(true);
    expect(shouldRefresh(['parent', 3, 'bus-alerts'], 'bus')).toBe(true);
    expect(shouldRefresh(['parent', 3, 'bus'], 'bus')).toBe(true);
    expect(shouldRefresh(['parent', 3, 'bus-alerts'], 'fees')).toBe(false);
  });

  it('refreshes everything under parent for an unknown type, and nothing else', () => {
    expect(shouldRefresh(['parent', 3, 'timetable'], null)).toBe(true);
    expect(shouldRefresh(['other', 'fees'], 'fees')).toBe(false);
  });
});
