import { countUpValue, easeOutCubic } from '../count-up';

describe('count-up', () => {
  it('eases from 0 to 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(2)).toBe(1);
  });

  it('rises in whole numbers and ends exactly on target', () => {
    expect(countUpValue(4500, 0)).toBe(0);
    expect(countUpValue(4500, 0.5)).toBeGreaterThan(2250);
    expect(Number.isInteger(countUpValue(4500, 0.3))).toBe(true);
    expect(countUpValue(1000.5, 1)).toBe(1000.5);
  });
});
