import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import type { StripDay } from '@/lib/dates';
import { shortDate } from '@/lib/dates';
import { PressableScale } from '@/motion/pressable-scale';
import { SPRING } from '@/motion/tokens';
import { colors, fonts, shadow } from '@/theme';

const DAY_WIDTH = 60;
const GAP = 4;
const PADDING = 4;

const offsetOf = (index: number): number => PADDING + index * (DAY_WIDTH + GAP);

/**
 * Horizontal row of days to choose from, on a soft track. A white pill slides to the chosen day.
 * Days before `minDay` are shown but cannot be chosen. No native date picker is needed.
 */
export function DayStrip({
  days,
  selected,
  minDay,
  onSelect,
  label,
}: {
  days: StripDay[];
  selected: string;
  minDay?: string;
  onSelect: (iso: string) => void;
  label: string;
}) {
  const reduced = useReducedMotion();
  const index = days.findIndex((d) => d.iso === selected);
  const x = useSharedValue(offsetOf(Math.max(0, index)));
  const height = useSharedValue(0);

  useEffect(() => {
    const target = offsetOf(Math.max(0, index));
    x.set(reduced ? target : withSpring(target, SPRING));
  }, [index, reduced, x]);

  const pill = useAnimatedStyle(() => ({
    opacity: height.get() > 0 && index >= 0 ? 1 : 0,
    height: height.get(),
    transform: [{ translateX: x.get() }],
  }));

  return (
    <View accessibilityLabel={label}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.pill, pill]} />
        {days.map((d) => {
          const on = d.iso === selected;
          const off = minDay !== undefined && d.iso < minDay;
          return (
            <PressableScale
              key={d.iso}
              accessibilityRole="button"
              accessibilityLabel={shortDate(d.iso) ?? d.iso}
              accessibilityState={{ selected: on, disabled: off }}
              disabled={off}
              haptic={on ? false : 'tap'}
              onPress={() => onSelect(d.iso)}
              onLayout={(e) => height.set(e.nativeEvent.layout.height)}
              style={[styles.day, off && { opacity: 0.4 }]}
            >
              <AppText style={[styles.small, on && { color: colors.accentInk }]}>{d.weekday}</AppText>
              <AppText style={[styles.number, on && { color: colors.accentInk }]}>{d.day}</AppText>
              <AppText style={[styles.small, on && { color: colors.accentInk }]}>{d.month}</AppText>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Day corners (18) plus the track padding (4) give the track's 22, so they stay concentric.
const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: GAP, padding: PADDING, borderRadius: 22, backgroundColor: colors.border },
  pill: { position: 'absolute', top: PADDING, left: 0, width: DAY_WIDTH, borderRadius: 18, backgroundColor: colors.card, ...shadow.card },
  day: { width: DAY_WIDTH, minHeight: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  small: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  number: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink, marginVertical: 2 },
});
