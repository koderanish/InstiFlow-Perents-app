import { StyleSheet, View } from 'react-native';

import { AppText, Chip } from '@/components/ui';
import { CountUp } from '@/motion/count-up';
import { percentToRatio } from '@/motion/motion-math';
import { ProgressRing } from '@/motion/progress-ring';
import type { Tone } from '@/lib/status-copy';
import { colors, fonts } from '@/theme';

/**
 * A big percentage drawn as a ring with the number counting up in the middle,
 * and a verdict chip plus one line of detail beside it. Used on Progress and the report card.
 */
export function PercentHero({
  percent,
  badge,
  summary,
  hint,
  size = 124,
  numeralSize = 34,
}: {
  percent: number | null;
  badge: { label: string; tone: Tone } | null;
  summary: string;
  /** Small line under the summary, e.g. "Open report card". */
  hint?: string;
  size?: number;
  numeralSize?: number;
}) {
  return (
    <View style={styles.row}>
      <ProgressRing ratio={percentToRatio(percent)} size={size} stroke={Math.round(size / 12)}>
        {percent === null ? (
          <AppText style={{ fontFamily: fonts.display, fontSize: numeralSize, color: colors.faint }}>—</AppText>
        ) : (
          <CountUp
            value={Math.round(percent)}
            format={(n) => `${n}%`}
            maxFontSizeMultiplier={1.1}
            style={{ fontFamily: fonts.display, fontSize: numeralSize, lineHeight: numeralSize + 6, letterSpacing: -0.5, color: colors.ink }}
          />
        )}
      </ProgressRing>
      <View style={styles.side}>
        {badge ? <Chip label={badge.label} tone={badge.tone} /> : null}
        <AppText variant="caption" tabular style={{ fontSize: 15, lineHeight: 21 }}>
          {summary}
        </AppText>
        {hint ? (
          <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, color: colors.accentInk, fontFamily: fonts.semibold }}>
            {hint}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  side: { flex: 1, gap: 10, alignItems: 'flex-start' },
});
