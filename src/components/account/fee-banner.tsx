import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/icon-badge';
import { AppText } from '@/components/ui';
import { useT } from '@/i18n';
import type { Line } from '@/lib/status-copy';
import { PressableScale } from '@/motion/pressable-scale';
import { fonts, radius, useStyles, useTheme, type Theme } from '@/theme';

/** Reminder on Today when fees are due. Taps through to the Fees tab. Overdue turns it red, due soon keeps it amber. */
export function FeeBanner({ line }: { line: Line }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const overdue = line.tone === 'bad';
  const fg = overdue ? colors.badFg : colors.warnFg;
  return (
    <Link href="/(app)/(tabs)/fees" asChild>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t('account.today.feesBannerLabel', { title: line.title, detail: line.subtitle })}
        accessibilityHint={t('account.today.feesBannerHint')}
        scaleTo={0.98}
        style={overdue ? styles.overdue : styles.due}
      >
        <IconBadge name="credit-card" tone={overdue ? 'bad' : 'warn'} />
        <View style={styles.copy}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 16, color: fg }}>{line.title}</AppText>
          <AppText tabular style={{ fontFamily: fonts.medium, fontSize: 14, color: fg, marginTop: 2 }}>
            {line.subtitle}
          </AppText>
        </View>
        <Feather name="chevron-right" size={18} color={fg} />
      </PressableScale>
    </Link>
  );
}

const createStyles = ({ colors }: Theme) => {
  const base = { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 72, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.card } as const;
  return StyleSheet.create({
    due: { ...base, backgroundColor: colors.warnBg },
    overdue: { ...base, backgroundColor: colors.badBg },
    copy: { flex: 1 },
  });
};
