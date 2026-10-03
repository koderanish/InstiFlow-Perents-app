/** Pure numbers behind the count-up, ring and bar components, so they can be tested without a device. */

export const clamp01 = (value: number): number => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/** Fast start, soft landing. */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);

/** Fewest decimals (up to `max`) that show `value` exactly: 86 -> 0, 86.5 -> 1, 86.25 -> 2. */
export const decimalsOf = (value: number, max = 2): number => {
  if (!Number.isFinite(value)) return 0;
  for (let places = 0; places < max; places += 1) {
    const scaled = value * 10 ** places;
    if (Math.abs(scaled - Math.round(scaled)) < 1e-9) return places;
  }
  return max;
};

/** The number to show `t` (0 to 1) of the way from `from` to `to`, rounded to `places`. */
export const countUpValue = (from: number, to: number, t: number, places = 0): number => {
  const factor = 10 ** places;
  const raw = from + (to - from) * easeOutCubic(t);
  return Math.round(raw * factor) / factor;
};

export interface RingGeometry {
  radius: number;
  center: number;
  circumference: number;
}

/** Circle that fits inside a square of `size` once the stroke is accounted for. */
export const ringGeometry = (size: number, stroke: number): RingGeometry => {
  const radius = Math.max(0, (size - stroke) / 2);
  return { radius, center: size / 2, circumference: 2 * Math.PI * radius };
};

/** strokeDashoffset that leaves `ratio` of the circle drawn. */
export const ringOffset = (circumference: number, ratio: number): number => circumference * (1 - clamp01(ratio));

/** 86 -> 0.86; null (no result) -> 0. */
export const percentToRatio = (percent: number | null | undefined): number =>
  percent === null || percent === undefined ? 0 : clamp01(percent / 100);

/**
 * Progress as a 0 to 1 fraction. The API sends whole percentages (60), but a fraction (0.6) is accepted too.
 * Whole numbers are always read as percentages, so 1 means 1%.
 */
export const progressFraction = (value: number | null | undefined): number => {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0;
  if (!Number.isInteger(value) && value <= 1) return clamp01(value);
  return clamp01(value / 100);
};
