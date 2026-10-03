import { StyleSheet, View } from 'react-native';

import { Hint, Section } from '@/components/account/bits';
import { SelectChip } from '@/components/account/select-chip';
import { useT, type TKey } from '@/i18n';
import { THEME_MODES, type ThemeMode } from '@/lib/prefs';
import { usePrefsStore } from '@/stores/prefs-store';

const LABELS: Record<ThemeMode, TKey> = {
  system: 'account.appearance.system',
  light: 'account.appearance.light',
  dark: 'account.appearance.dark',
};

/** System, Light or Dark. The choice applies the moment it is tapped (the chip gives the haptic) and is remembered on this phone. */
export function AppearancePicker() {
  const t = useT();
  const mode = usePrefsStore((s) => s.themeMode);
  const setMode = usePrefsStore((s) => s.setThemeMode);
  return (
    <Section title={t('account.appearance.title')}>
      <View accessibilityRole="radiogroup" style={styles.row}>
        {THEME_MODES.map((m) => (
          <SelectChip key={m} label={t(LABELS[m])} selected={mode === m} onPress={() => setMode(m)} />
        ))}
      </View>
      <Hint>{t('account.appearance.hint')}</Hint>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
