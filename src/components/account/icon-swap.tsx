import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { SPRING } from '@/motion/tokens';

type IconName = React.ComponentProps<typeof Feather>['name'];

/**
 * Two icons stacked on one spot. When `active` flips, the old one shrinks to 0.25 and fades
 * out while the new one grows from 0.25 and fades in. A critically damped spring, so no bounce.
 * The first render shows the right icon with no animation.
 */
export function IconSwap({
  active,
  from,
  to,
  size = 20,
  fromColor,
  toColor,
}: {
  active: boolean;
  from: IconName;
  to: IconName;
  size?: number;
  fromColor: string;
  toColor: string;
}) {
  const reduced = useReducedMotion();
  const t = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    const target = active ? 1 : 0;
    t.set(reduced ? target : withSpring(target, SPRING));
  }, [active, reduced, t]);

  const fromStyle = useAnimatedStyle(() => ({ opacity: 1 - t.get(), transform: [{ scale: 1 - 0.75 * t.get() }] }));
  const toStyle = useAnimatedStyle(() => ({ opacity: t.get(), transform: [{ scale: 0.25 + 0.75 * t.get() }] }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: size, height: size }}>
      <Animated.View style={[styles.layer, fromStyle]}>
        <Feather name={from} size={size} color={fromColor} />
      </Animated.View>
      <Animated.View style={[styles.layer, toStyle]}>
        <Feather name={to} size={size} color={toColor} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
