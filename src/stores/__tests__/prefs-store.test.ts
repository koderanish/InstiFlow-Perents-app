import * as SecureStore from 'expo-secure-store';

import { SECURE_STORE_KEYS } from '@/constants/storage-keys';
import { defaultPrefs } from '@/lib/prefs';

import { usePrefsStore } from '../prefs-store';

const getItem = jest.mocked(SecureStore.getItemAsync);
const setItem = jest.mocked(SecureStore.setItemAsync);

const reset = () => usePrefsStore.setState({ hydrated: false, ...defaultPrefs() });

describe('prefs store', () => {
  beforeEach(reset);

  it('restores saved choices once', async () => {
    getItem.mockResolvedValueOnce(JSON.stringify({ notifications: { notices: false }, tipsSeen: true }));
    await usePrefsStore.getState().restore();
    const s = usePrefsStore.getState();
    expect(s.hydrated).toBe(true);
    expect(s.notifications.notices).toBe(false);
    expect(s.notifications.bus).toBe(true);
    expect(s.tipsSeen).toBe(true);
    await s.restore();
    expect(getItem).toHaveBeenCalledTimes(1);
  });

  it('uses defaults when nothing is saved', async () => {
    getItem.mockResolvedValueOnce(null);
    await usePrefsStore.getState().restore();
    expect(usePrefsStore.getState().hydrated).toBe(true);
    expect(usePrefsStore.getState().tipsSeen).toBe(false);
  });

  it('saves a toggle to the phone', () => {
    usePrefsStore.getState().setNotification('homework', false);
    expect(usePrefsStore.getState().notifications.homework).toBe(false);
    const [key, raw] = setItem.mock.calls[0] ?? [];
    expect(key).toBe(SECURE_STORE_KEYS.prefs);
    expect(JSON.parse(String(raw)).notifications.homework).toBe(false);
  });

  it('remembers that the tips were seen', () => {
    usePrefsStore.getState().markTipsSeen();
    expect(usePrefsStore.getState().tipsSeen).toBe(true);
    expect(JSON.parse(String(setItem.mock.calls[0]?.[1])).tipsSeen).toBe(true);
  });
});
