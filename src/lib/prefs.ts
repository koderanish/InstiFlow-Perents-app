/** Notification choices and first-run flags, saved on this phone only. */

export const PREF_KEYS = ['bus', 'attendance', 'fees', 'notices', 'homework', 'quietHours'] as const;
export type PrefKey = (typeof PREF_KEYS)[number];

export type NotificationPrefs = Record<PrefKey, boolean>;

export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const LANGUAGES = ['en', 'hi'] as const;
export type Language = (typeof LANGUAGES)[number];

export interface SavedPrefs {
  notifications: NotificationPrefs;
  tipsSeen: boolean;
  /** Follows the phone unless the parent picks light or dark. */
  themeMode: ThemeMode;
  /** null = follow the phone's language (Hindi if it is Hindi, otherwise English). */
  language: Language | null;
}

export const defaultPrefs = (): SavedPrefs => ({
  notifications: { bus: true, attendance: true, fees: true, notices: true, homework: true, quietHours: true },
  tipsSeen: false,
  themeMode: 'system',
  language: null,
});

/** Reads what was saved. Unknown or damaged data falls back to the defaults, key by key. */
export const parsePrefs = (raw: string | null | undefined): SavedPrefs => {
  const base = defaultPrefs();
  if (!raw) return base;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return base;
    const record = data as Record<string, unknown>;
    const saved = record.notifications;
    if (typeof saved === 'object' && saved !== null) {
      const flags = saved as Record<string, unknown>;
      for (const key of PREF_KEYS) {
        const value = flags[key];
        if (typeof value === 'boolean') base.notifications[key] = value;
      }
    }
    if (record.tipsSeen === true) base.tipsSeen = true;
    if (typeof record.themeMode === 'string' && (THEME_MODES as readonly string[]).includes(record.themeMode)) {
      base.themeMode = record.themeMode as ThemeMode;
    }
    if (typeof record.language === 'string' && (LANGUAGES as readonly string[]).includes(record.language)) {
      base.language = record.language as Language;
    }
    return base;
  } catch {
    return base;
  }
};

export const serializePrefs = (prefs: SavedPrefs): string => JSON.stringify(prefs);
