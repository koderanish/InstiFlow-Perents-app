import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { PressableScale } from '@/motion/pressable-scale';
import { colors, fonts } from '@/theme';

/** A choice chip whose fill and outline fade between selected and not. At least 44pt tall. */
export function SelectChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const reduced = useReducedMotion();
  const t = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    t.set(reduced ? target : withTiming(target, { duration: 180 }));
  }, [selected, reduced, t]);

  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.get(), [0, 1], [colors.card, colors.accentTint]),
    borderColor: interpolateColor(t.get(), [0, 1], [colors.border, colors.accentTint]),
  }));

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      haptic={selected ? false : 'tap'}
      onPress={onPress}
    >
      <Animated.View style={[styles.chip, fill]}>
        <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 15, color: selected ? colors.ink : colors.muted }}>
          {label}
        </AppText>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
