import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useT } from '@/i18n';
import { PressableScale } from '@/motion/pressable-scale';
import { useStyles, useTheme, type Theme } from '@/theme';

/** Round back control for the `leading` slot of `CollapsingScreen`. */
export function BackButton() {
  const router = useRouter();
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} hitSlop={8} style={styles.button}>
      <Feather name="chevron-left" size={22} color={colors.ink} />
    </PressableScale>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    button: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  });
