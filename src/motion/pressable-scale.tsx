import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { pressHaptic, tapHaptic } from './haptics';
import { PRESS_SCALE, SPRING, safePressScale } from './tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  /** Plain object or one flattened style. When this sits under `<Link asChild>` never pass an array or function. */
  style?: StyleProp<ViewStyle>;
  /** Defaults to 0.96. Clamped so it never drops under 0.95. */
  scaleTo?: number;
  /** 'tap' = light tick (default), 'press' = firmer, false = silent. */
  haptic?: 'tap' | 'press' | false;
};

/**
 * Pressable that shrinks slightly under the finger and springs back, interruptibly,
 * with a light haptic on native. Runs on the UI thread.
 */
export function PressableScale({ style, scaleTo = PRESS_SCALE, haptic = 'tap', disabled, onPress, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const target = safePressScale(scaleTo);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(target, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic === 'tap') tapHaptic();
        if (haptic === 'press') pressHaptic();
        onPress?.(e);
      }}
      style={[style, animated, disabled ? { opacity: 0.55 } : null]}
    />
  );
}
