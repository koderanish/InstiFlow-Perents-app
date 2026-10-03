import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme';

import { clamp01, ringGeometry } from './motion-math';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingProps = PropsWithChildren<{
  /** 0 to 1. */
  ratio: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  delay?: number;
  duration?: number;
}>;

/**
 * Circular progress that draws itself the first time it appears (strokeDashoffset on the UI thread).
 * `children` sit in the middle. Under reduced motion the ring is simply drawn.
 */
export function ProgressRing({
  ratio,
  size = 120,
  stroke = 10,
  color,
  trackColor,
  delay = 120,
  duration = 900,
  children,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const target = clamp01(ratio);
  const { radius, center, circumference } = ringGeometry(size, stroke);
  const progress = useSharedValue(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      progress.set(target);
      return;
    }
    progress.set(withDelay(delay, withTiming(target, { duration, easing: Easing.out(Easing.cubic) })));
  }, [target, delay, duration, reduced, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    // A round cap on a zero-length arc still paints a dot, so hide it until there is something to draw.
    strokeOpacity: progress.value > 0.002 ? 1 : 0,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
        <Circle cx={center} cy={center} r={radius} stroke={trackColor ?? colors.divider} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color ?? colors.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
