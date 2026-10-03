/** Horizontal keyframes (as a share of the amplitude) for a "no" shake. It decays and ends at rest. */
const SHAPE = [-1, 1, -0.7, 0.7, -0.35, 0.35, 0] as const;

export const SHAKE_STEP_MS = 55;

export const shakeOffsets = (amplitude = 10): number[] => SHAPE.map((k) => k * amplitude);
