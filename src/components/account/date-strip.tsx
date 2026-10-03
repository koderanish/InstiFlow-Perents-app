import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { StripDay } from '@/lib/dates';
import { shortDate } from '@/lib/dates';
import { colors, fonts } from '@/theme';

/**
 * Horizontal row of days to choose from. Days before `minDay` are shown but cannot be chosen.
 * No native date picker is needed.
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
  return (
    <View accessibilityLabel={label}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
        {days.map((d) => {
          const on = d.iso === selected;
          const off = minDay !== undefined && d.iso < minDay;
          return (
            <Pressable
              key={d.iso}
              accessibilityRole="button"
              accessibilityLabel={shortDate(d.iso) ?? d.iso}
              accessibilityState={{ selected: on, disabled: off }}
              disabled={off}
              onPress={() => onSelect(d.iso)}
              style={[styles.day, on ? { backgroundColor: colors.accentTint } : styles.dayOff, off && { opacity: 0.4 }]}
            >
              <AppText style={[styles.small, on && { color: colors.accentInk }]}>{d.weekday}</AppText>
              <AppText style={[styles.number, on && { fontFamily: fonts.bold }]}>{d.day}</AppText>
              <AppText style={[styles.small, on && { color: colors.accentInk }]}>{d.month}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  day: { width: 60, minHeight: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  dayOff: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  small: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  number: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink, marginVertical: 2 },
});
