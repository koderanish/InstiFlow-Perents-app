import { Feather } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import { useGoBack } from '@/components/account/nav';
import { useT } from '@/i18n';
import { PressableScale } from '@/motion/pressable-scale';
import { useStyles, useTheme, type Theme } from '@/theme';

/** Round back control for the `leading` slot of `CollapsingScreen`.
 * Falls back to Today when opened from a push link with no history. */
export function BackButton() {
  const goBack = useGoBack();
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={goBack} hitSlop={8} style={styles.button}>
      <Feather name="chevron-left" size={22} color={colors.ink} />
    </PressableScale>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    button: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  });
