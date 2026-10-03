import { Feather } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import { useGoBack } from '@/components/account/nav';
import { useT } from '@/i18n';
import { PressableScale } from '@/motion/pressable-scale';
import { useStyles, useTheme, type Theme } from '@/theme';

/** Round back button for the compact bar of a `CollapsingScreen`. */
export function BackButton() {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const goBack = useGoBack();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={goBack} style={styles.button} hitSlop={8}>
      <Feather name="chevron-left" size={22} color={colors.ink} />
    </PressableScale>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    button: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  });
