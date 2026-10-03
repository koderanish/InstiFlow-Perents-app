import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, radius } from '@/theme';

/** A grey block that breathes. Used instead of spinners so the page keeps its shape while loading. */
export function Skeleton({ width = '100%', height = 16, rounded = 8, style }: { width?: DimensionValue; height?: number; rounded?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduced) return undefined;
    pulse.value = withRepeat(withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(pulse);
  }, [pulse, reduced]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no" style={[{ width, height, borderRadius: rounded, backgroundColor: colors.border }, animated, style]} />;
}

/** Card-shaped placeholder: a title line, a subtitle line and an optional big block. */
export function SkeletonCard({ tall }: { tall?: boolean }) {
  return (
    <View style={styles.card}>
      <Skeleton width={96} height={22} rounded={11} />
      <Skeleton width="70%" height={26} style={{ marginTop: 16 }} />
      <Skeleton width="50%" height={14} style={{ marginTop: 10 }} />
      {tall ? <Skeleton height={72} rounded={16} style={{ marginTop: 18 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.hero, padding: 24 },
});
