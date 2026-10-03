import { makeClientId } from '../client-id';

describe('makeClientId', () => {
  it('is at least 16 lowercase letters and digits', () => {
    expect(makeClientId()).toMatch(/^[a-z0-9]{16,}$/);
  });

  it('starts with the base-36 time and uses the injected random source', () => {
    const id = makeClientId(36 * 36, () => 0);
    expect(id).toBe(`100${'a'.repeat(20)}`);
    expect(makeClientId(0, () => 0.999999)).toBe(`0${'9'.repeat(20)}`);
  });

  it('differs between calls made in the same millisecond', () => {
    const ids = new Set(Array.from({ length: 200 }, () => makeClientId(1_700_000_000_000)));
    expect(ids.size).toBe(200);
  });

  it('never throws on odd clocks', () => {
    expect(makeClientId(-5, () => 0.5)).toMatch(/^0[a-z0-9]{20}$/);
  });
});
