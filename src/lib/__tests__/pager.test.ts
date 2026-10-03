import { dotProgress, pageIndex } from '../pager';

describe('pager', () => {
  it('finds the nearest page and clamps it', () => {
    expect(pageIndex(0, 400, 3)).toBe(0);
    expect(pageIndex(199, 400, 3)).toBe(0);
    expect(pageIndex(201, 400, 3)).toBe(1);
    expect(pageIndex(5000, 400, 3)).toBe(2);
    expect(pageIndex(-50, 400, 3)).toBe(0);
    expect(pageIndex(100, 0, 3)).toBe(0);
  });

  it('measures how close a dot is to the current page', () => {
    expect(dotProgress(400, 400, 1)).toBe(1);
    expect(dotProgress(200, 400, 1)).toBeCloseTo(0.5);
    expect(dotProgress(200, 400, 0)).toBeCloseTo(0.5);
    expect(dotProgress(0, 400, 2)).toBe(0);
    expect(dotProgress(0, 0, 0)).toBe(1);
  });
});
