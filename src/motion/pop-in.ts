import { Easing, ReduceMotion, ZoomIn } from 'react-native-reanimated';

/** Stagger for dense grids (calendar days) is capped so a whole month still lands in about half a second. */
const POP_STEP_MS = 12;
const POP_MAX_DELAY_MS = 360;

/** A small marker scaling up into place. Under reduced motion it simply appears. */
export const popIn = (index = 0) =>
  ZoomIn.delay(Math.min(Math.max(0, index) * POP_STEP_MS, POP_MAX_DELAY_MS))
    .duration(240)
    .easing(Easing.out(Easing.back(1.4)))
    .reduceMotion(ReduceMotion.System);
