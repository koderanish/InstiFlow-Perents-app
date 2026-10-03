import { clamp01, countUpValue, decimalsOf, easeOutCubic, percentToRatio, progressFraction, ringGeometry, ringOffset } from '../motion-math';

describe('motion math', () => {
  it('clamps to 0..1 and survives bad input', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it('eases from 0 to 1 and is ahead of linear in the middle', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('finds the decimals a number needs', () => {
    expect(decimalsOf(86)).toBe(0);
    expect(decimalsOf(86.5)).toBe(1);
    expect(decimalsOf(86.25)).toBe(2);
    expect(decimalsOf(86.123)).toBe(2);
    expect(decimalsOf(Number.NaN)).toBe(0);
  });

  it('counts up to exactly the target and never overshoots', () => {
    expect(countUpValue(0, 86, 0)).toBe(0);
    expect(countUpValue(0, 86, 1)).toBe(86);
    expect(countUpValue(0, 86.5, 1, 1)).toBe(86.5);
    for (let t = 0; t <= 1; t += 0.05) {
      const v = countUpValue(0, 40, t);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(40);
    }
  });

  it('counts down as well as up', () => {
    expect(countUpValue(50, 10, 1)).toBe(10);
    expect(countUpValue(50, 10, 0.5)).toBeLessThan(50);
  });

  it('computes ring geometry inside the box', () => {
    const g = ringGeometry(120, 10);
    expect(g.radius).toBe(55);
    expect(g.center).toBe(60);
    expect(g.circumference).toBeCloseTo(2 * Math.PI * 55);
    expect(ringGeometry(4, 10).radius).toBe(0);
  });

  it('leaves the right part of the ring drawn', () => {
    expect(ringOffset(100, 0)).toBe(100);
    expect(ringOffset(100, 1)).toBe(0);
    expect(ringOffset(100, 0.25)).toBe(75);
    expect(ringOffset(100, 4)).toBe(0);
  });

  it('reads diary progress as a fraction', () => {
    expect(progressFraction(60)).toBe(0.6);
    expect(progressFraction(0.6)).toBe(0.6);
    expect(progressFraction(1)).toBe(0.01);
    expect(progressFraction(100)).toBe(1);
    expect(progressFraction(250)).toBe(1);
    expect(progressFraction(null)).toBe(0);
    expect(progressFraction(Number.NaN)).toBe(0);
  });

  it('turns a percentage into a ratio', () => {
    expect(percentToRatio(86)).toBe(0.86);
    expect(percentToRatio(null)).toBe(0);
    expect(percentToRatio(140)).toBe(1);
    expect(percentToRatio(-5)).toBe(0);
  });
});
