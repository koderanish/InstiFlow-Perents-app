import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICK_LENGTH = 40;
const easeOut = Easing.out(Easing.cubic);

/**
 * A success mark that draws itself: the ring first, then the tick. Plays once when it mounts.
 * Pair it with `successHaptic()` at the moment the action succeeds.
 */
export function DrawnCheck({ size = 72, color, background }: { size?: number; color?: string; background?: string }) {
  const { colors } = useTheme();
  const stroke = color ?? colors.goodFg;
  const fill = background ?? colors.goodBg;
  const reduced = useReducedMotion();
  const ring = useSharedValue(reduced ? 1 : 0);
  const tick = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    ring.set(withTiming(1, { duration: 420, easing: easeOut }));
    tick.set(withDelay(300, withTiming(1, { duration: 320, easing: easeOut })));
  }, [reduced, ring, tick]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - ring.get()) }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: TICK_LENGTH * (1 - tick.get()) }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 72 72">
        <Circle cx={36} cy={36} r={RADIUS} fill={fill} />
        <AnimatedCircle
          cx={36}
          cy={36}
          r={RADIUS}
          stroke={stroke}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          rotation={-90}
          origin="36, 36"
          animatedProps={ringProps}
        />
        <AnimatedPath
          d="M23 37 L32 46 L49 27"
          stroke={stroke}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={`${TICK_LENGTH} ${TICK_LENGTH}`}
          animatedProps={tickProps}
        />
      </Svg>
    </View>
  );
}
