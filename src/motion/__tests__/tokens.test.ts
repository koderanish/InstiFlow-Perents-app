import { PRESS_SCALE, SPRING, STAGGER_MAX_ITEMS, STAGGER_MS, safePressScale, staggerDelay } from '../tokens';

describe('motion tokens', () => {
  it('staggers by index and stops growing after the cap', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(1)).toBe(STAGGER_MS);
    expect(staggerDelay(STAGGER_MAX_ITEMS)).toBe(STAGGER_MAX_ITEMS * STAGGER_MS);
    expect(staggerDelay(50)).toBe(STAGGER_MAX_ITEMS * STAGGER_MS);
  });

  it('ignores bad indexes', () => {
    expect(staggerDelay(-3)).toBe(0);
    expect(staggerDelay(Number.NaN)).toBe(0);
    expect(staggerDelay(2.9)).toBe(2 * STAGGER_MS);
  });

  it('never presses below 0.95 or above 1', () => {
    expect(PRESS_SCALE).toBeGreaterThanOrEqual(0.95);
    expect(safePressScale(0.5)).toBe(0.95);
    expect(safePressScale(1.2)).toBe(1);
    expect(safePressScale(0.98)).toBe(0.98);
  });

  it('uses a spring that does not bounce', () => {
    expect(SPRING.damping).toBeGreaterThanOrEqual(2 * Math.sqrt(SPRING.stiffness * SPRING.mass) - 1);
  });
});
