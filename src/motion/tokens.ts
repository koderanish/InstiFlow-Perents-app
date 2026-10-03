/** One set of motion numbers for the whole app, so every screen feels like the same hand made it. */

/** Pressed controls shrink to this and no further. Below 0.95 a press starts to look broken. */
export const PRESS_SCALE = 0.96;

/** Gap between siblings that enter one after another. */
export const STAGGER_MS = 80;
/** After this many items the rest enter together, so long lists never feel slow. */
export const STAGGER_MAX_ITEMS = 6;

export const ENTER_MS = 320;
/** Leaving is quieter and faster than arriving. */
export const EXIT_MS = 160;
/** How far (px) content travels while it fades in or out. */
export const ENTER_OFFSET = 14;
export const EXIT_OFFSET = 12;

/** Critically damped spring (damping = 2·√(stiffness·mass)): settles with no bounce. */
export const SPRING = { damping: 32, stiffness: 260, mass: 1 } as const;
/** A small bounce for rewarding moments only (a tick appearing, a switch snapping on). */
export const SPRING_SNAPPY = { damping: 16, stiffness: 320, mass: 0.8 } as const;

export const staggerDelay = (index: number, stepMs: number = STAGGER_MS): number => {
  if (!Number.isFinite(index) || index <= 0) return 0;
  return Math.min(Math.floor(index), STAGGER_MAX_ITEMS) * stepMs;
};

/** Clamp a press scale into the safe range. */
export const safePressScale = (value: number): number => Math.min(1, Math.max(0.95, value));
