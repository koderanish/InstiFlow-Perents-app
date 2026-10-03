/** Ease-out cubic for a number that settles gently. */
export const easeOutCubic = (t: number): number => {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
};

/** The number to show `progress` (0 to 1) of the way up to `target`. Whole numbers while rising, exact at the end. */
export const countUpValue = (target: number, progress: number): number => {
  if (progress >= 1) return target;
  return Math.round(target * easeOutCubic(progress));
};
