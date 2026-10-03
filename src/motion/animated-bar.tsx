import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme';

import { clamp01 } from './motion-math';

/**
 * Thin progress bar whose fill grows from the left the first time it appears.
 * Give each bar in a list its own `delay` (see `staggerDelay`) so they fill one after another.
 */
export function AnimatedBar({
  ratio,
  delay = 0,
  height = 6,
  color = colors.accent,
  trackColor = colors.divider,
  duration = 650,
  style,
}: {
  /** 0 to 1. */
  ratio: number;
  delay?: number;
  height?: number;
  color?: string;
  trackColor?: string;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const target = clamp01(ratio);
  const progress = useSharedValue(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      progress.set(target);
      return;
    }
    progress.set(withDelay(delay, withTiming(target, { duration, easing: Easing.out(Easing.cubic) })));
  }, [target, delay, duration, reduced, progress]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={[{ height, borderRadius: height / 2, backgroundColor: trackColor, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color }, fill]} />
    </View>
  );
}
