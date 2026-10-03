import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { Tone } from '@/lib/status-copy';
import { useThemed, type Theme } from '@/theme';

const toneColors = ({ colors }: Theme): Record<Tone, { bg: string; fg: string }> => ({
  good: { bg: colors.goodBg, fg: colors.goodFg },
  warn: { bg: colors.warnBg, fg: colors.warnFg },
  bad: { bg: colors.badBg, fg: colors.badFg },
  neutral: { bg: colors.accentTint, fg: colors.accentInk },
});

/** Soft square with an icon. The radius is concentric with a 16px card corner: size/3. */
export function IconBadge({ name, tone = 'neutral', size = 44 }: { name: React.ComponentProps<typeof Feather>['name']; tone?: Tone; size?: number }) {
  const t = useThemed(toneColors)[tone];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={[styles.box, { width: size, height: size, borderRadius: Math.round(size / 3), backgroundColor: t.bg }]}>
      <Feather name={name} size={Math.round(size * 0.46)} color={t.fg} />
    </View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center', justifyContent: 'center' } });
