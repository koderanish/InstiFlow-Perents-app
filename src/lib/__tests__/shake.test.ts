import { shakeOffsets } from '../shake';

describe('shake', () => {
  it('decays and comes to rest', () => {
    const offsets = shakeOffsets(10);
    expect(offsets[offsets.length - 1]).toBe(0);
    expect(Math.max(...offsets.map(Math.abs))).toBe(10);
    expect(Math.abs(offsets[2] ?? 0)).toBeLessThan(Math.abs(offsets[0] ?? 0));
  });

  it('scales with the amplitude', () => {
    expect(shakeOffsets(20)[0]).toBe(-20);
  });
});
