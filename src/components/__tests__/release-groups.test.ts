import { isTabReleased } from '../release-groups';

describe('isTabReleased', () => {
  it('shows everything while states load (backend enforces)', () => {
    expect(isTabReleased('fees', null)).toBe(true);
    expect(isTabReleased('progress', null)).toBe(true);
  });

  it('hides unreleased tabs, keeps core tabs', () => {
    const released = new Set(['foundation']);
    expect(isTabReleased('index', released)).toBe(true);
    expect(isTabReleased('profile', released)).toBe(true);
    expect(isTabReleased('progress', released)).toBe(false);
    expect(isTabReleased('fees', released)).toBe(false);
    expect(isTabReleased('inbox', released)).toBe(false);
  });

  it('shows tabs once their group releases', () => {
    const released = new Set(['foundation', 'daily_academic', 'operations_communication']);
    expect(isTabReleased('progress', released)).toBe(true);
    expect(isTabReleased('fees', released)).toBe(true);
  });
});
