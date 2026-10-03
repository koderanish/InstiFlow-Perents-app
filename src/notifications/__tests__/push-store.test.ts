import { usePushStore } from '../push-store';

describe('push store', () => {
  afterEach(() => usePushStore.getState().reset());

  it('starts with nothing known', () => {
    expect(usePushStore.getState()).toMatchObject({ permission: 'unknown', token: null, registered: false, busy: false, error: null });
  });

  it('updates part of the state and resets on sign out', () => {
    usePushStore.getState().set({ permission: 'granted', token: 'ExponentPushToken[abc]', registered: true });
    expect(usePushStore.getState().registered).toBe(true);
    expect(usePushStore.getState().busy).toBe(false);
    usePushStore.getState().reset();
    expect(usePushStore.getState()).toMatchObject({ permission: 'unknown', token: null, registered: false });
  });
});
