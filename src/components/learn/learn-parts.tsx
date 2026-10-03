import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, fonts, shadow } from '@/theme';

/** Heading above a card, as on the approved boards ("Date sheet"). */
export function LearnSectionTitle({ title, caption }: { title: string; caption?: string | null }) {
  return (
    <View style={styles.sectionTitle}>
      <AppText accessibilityRole="header" style={{ fontFamily: fonts.semibold, fontSize: 17 }}>
        {title}
      </AppText>
      {caption ? (
        <AppText variant="caption" style={{ fontSize: 13, marginTop: 2 }}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

/** Page title block for tab screens: big title with a one-line subtitle. */
export function LearnTitle({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <View>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" style={{ fontSize: 15, marginTop: 4 }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
  /** Spoken label, when the visible one is short ("Mon" -> "Monday"). */
  spoken?: string;
  /** Small marker under the label, e.g. today. */
  dot?: boolean;
}

/** Pill selector: day of the week, homework filter. At least 44pt tall. */
export function LearnSegmented<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentOption<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={styles.segmented}>
      {options.map((option) => {
        const on = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={option.spoken ?? option.label}
            onPress={() => onChange(option.key)}
            style={[styles.segment, on && { backgroundColor: colors.accentTint }]}
          >
            <AppText
              numberOfLines={1}
              style={{ fontFamily: on ? fonts.bold : fonts.medium, fontSize: 14, color: on ? colors.ink : colors.muted }}
            >
              {option.label}
            </AppText>
            <View style={[styles.segmentDot, { backgroundColor: option.dot ? colors.accent : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** One subject row: name, mark and a thin bar in the school accent. */
export function LearnStatBar({
  label,
  valueLabel,
  ratio,
  spoken,
  last,
}: {
  label: string;
  valueLabel: string;
  /** 0 to 1; null hides the bar. */
  ratio: number | null;
  spoken: string;
  last?: boolean;
}) {
  return (
    <View accessible accessibilityLabel={spoken} style={[styles.statBar, !last && styles.statBarDivider]}>
      <View style={styles.statBarTop}>
        <AppText style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 16 }}>{label}</AppText>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{valueLabel}</AppText>
      </View>
      {ratio !== null ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

/** Small tappable number tile ("95% Attendance"). */
export function LearnStatTile({ value, label, href }: { value: string; label: string; href: Href }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={[styles.tile, shadow.card]}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 20, letterSpacing: -0.2 }}>{value}</AppText>
        <AppText variant="caption" style={{ marginTop: 2 }}>
          {label}
        </AppText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginHorizontal: 4, marginBottom: -8 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 2,
  },
  segment: { flex: 1, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  segmentDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  statBar: { paddingVertical: 14, paddingHorizontal: 18 },
  statBarDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  statBarTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { marginTop: 10, height: 6, borderRadius: 3, backgroundColor: colors.divider, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  tile: { flex: 1, minHeight: 64, backgroundColor: colors.card, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16 },
});
