import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { countUpValue } from '@/lib/count-up';
import { SHAKE_STEP_MS, shakeOffsets } from '@/lib/shake';
import { errorHaptic } from '@/motion/haptics';
import { SPRING_SNAPPY } from '@/motion/tokens';

/** Wrap what sits below something that appears or disappears, so it glides instead of jumping. */
export function Glide({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <Animated.View layout={LinearTransition.duration(200)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Scales up from 0.25 with a fade, once, when it first appears. For rewarding moments like a Paid chip. */
export function PopIn({ children, delay = 0, style }: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    t.set(withDelay(delay, withSpring(1, SPRING_SNAPPY)));
  }, [delay, reduced, t]);

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 0.5], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: 0.25 + 0.75 * t.get() }],
  }));
  return <Animated.View style={[{ alignSelf: 'flex-start' }, animated, style]}>{children}</Animated.View>;
}

/** A short horizontal "no". `shake()` also fires the error haptic. Reduced motion keeps only the haptic. */
export function useShake() {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const shake = useCallback(() => {
    errorHaptic();
    if (reduced) return;
    x.set(withSequence(...shakeOffsets(10).map((offset) => withTiming(offset, { duration: SHAKE_STEP_MS }))));
  }, [reduced, x]);
  return { style, shake };
}

/**
 * A number that counts up once, when it first appears. Later changes (a refetch) just show the new
 * number. Digits are tabular so the width stays steady while it runs.
 */
export function CountUpText({
  value,
  format,
  style,
  duration = 700,
}: {
  value: number;
  format: (n: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return undefined;
    const startedAt = Date.now();
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - startedAt) / duration);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, reduced]);

  return (
    <AppText tabular numberOfLines={1} adjustsFontSizeToFit style={style}>
      {format(countUpValue(value, progress))}
    </AppText>
  );
}
