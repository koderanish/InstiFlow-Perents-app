import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useT } from '@/i18n';
import { PressableScale } from '@/motion/pressable-scale';
import { fonts, radius, useStyles, useTheme, type Theme } from '@/theme';

/** Entry to the live bus map. Sits on the Bus screen as its own card. */
export function TrackLiveCard() {
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Link href="/(app)/bus-map" asChild>
      <PressableScale accessibilityRole="button" accessibilityLabel={`${t('busMap.trackTitle')}. ${t('busMap.trackBody')}`} style={styles.card}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.icon}>
          <Feather name="navigation" size={22} color={colors.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 17, color: colors.onAccent }}>
            {t('busMap.trackTitle')}
          </AppText>
          <AppText numberOfLines={2} style={{ fontSize: 14, marginTop: 2, color: colors.onAccent, opacity: 0.85 }}>
            {t('busMap.trackBody')}
          </AppText>
        </View>
        <Feather name="chevron-right" size={22} color={colors.onAccent} />
      </PressableScale>
    </Link>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 72, paddingVertical: 14, paddingHorizontal: 18, borderRadius: radius.card, backgroundColor: colors.accent },
    icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  });
