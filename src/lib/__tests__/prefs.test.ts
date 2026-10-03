import { defaultPrefs, parsePrefs, serializePrefs } from '../prefs';

describe('prefs', () => {
  it('defaults everything on and tips unseen', () => {
    const d = defaultPrefs();
    expect(Object.values(d.notifications).every(Boolean)).toBe(true);
    expect(d.tipsSeen).toBe(false);
  });

  it('round-trips saved choices', () => {
    const p = defaultPrefs();
    p.notifications.fees = false;
    p.tipsSeen = true;
    expect(parsePrefs(serializePrefs(p))).toEqual(p);
  });

  it('saves theme and language, and ignores unknown values', () => {
    const p = defaultPrefs();
    expect(p.themeMode).toBe('system');
    expect(p.language).toBeNull();
    p.themeMode = 'dark';
    p.language = 'hi';
    expect(parsePrefs(serializePrefs(p))).toEqual(p);
    const bad = parsePrefs(JSON.stringify({ themeMode: 'purple', language: 'fr' }));
    expect(bad.themeMode).toBe('system');
    expect(bad.language).toBeNull();
  });

  it('falls back safely on damaged data', () => {
    expect(parsePrefs(null)).toEqual(defaultPrefs());
    expect(parsePrefs('not json')).toEqual(defaultPrefs());
    expect(parsePrefs('42')).toEqual(defaultPrefs());
    expect(parsePrefs('null')).toEqual(defaultPrefs());
    const mixed = parsePrefs(JSON.stringify({ notifications: { bus: false, fees: 'no', extra: false }, tipsSeen: 'yes' }));
    expect(mixed.notifications.bus).toBe(false);
    expect(mixed.notifications.fees).toBe(true);
    expect(mixed.tipsSeen).toBe(false);
  });
});
