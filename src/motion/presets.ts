import { Easing, FadeIn, FadeInDown, FadeOut, FadeOutUp, ReduceMotion } from 'react-native-reanimated';

import { ENTER_MS, ENTER_OFFSET, EXIT_MS, staggerDelay } from './tokens';

const easeOut = Easing.out(Easing.cubic);

/** Content rising into place. Pass the item index to stagger siblings. */
export const enterRise = (index = 0) =>
  FadeInDown.delay(staggerDelay(index))
    .duration(ENTER_MS)
    .easing(easeOut)
    .withInitialValues({ opacity: 0, transform: [{ translateY: ENTER_OFFSET }] })
    .reduceMotion(ReduceMotion.System);

/** Plain fade, for things that should not travel (overlays, skeleton to content). */
export const enterFade = (index = 0) =>
  FadeIn.delay(staggerDelay(index)).duration(ENTER_MS).easing(easeOut).reduceMotion(ReduceMotion.System);

/** Quiet, quick exit that drifts up a little. */
export const exitFade = FadeOut.duration(EXIT_MS).reduceMotion(ReduceMotion.System);
export const exitLift = FadeOutUp.duration(EXIT_MS).reduceMotion(ReduceMotion.System);
