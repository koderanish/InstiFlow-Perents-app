import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppearancePicker } from '@/components/account/appearance-picker';
import { BackButton } from '@/components/account/back-button';
import { Hint } from '@/components/account/bits';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { AppText, ListCard } from '@/components/ui';
import { detectLocale, LOCALE_NAMES, useT } from '@/i18n';
import type { Language } from '@/lib/prefs';
import { tapHaptic } from '@/motion/haptics';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { usePrefsStore } from '@/stores/prefs-store';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

type Choice = { id: string; value: Language | null; title: string; subtitle?: string };

function ChoiceRow({ title, subtitle, selected, last, onPress }: { title: string; subtitle?: string; selected: boolean; last: boolean; onPress: () => void }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      haptic={false}
      scaleTo={0.985}
      onPress={onPress}
    >
      <View style={[styles.row, !last && styles.divider]}>
        <View style={styles.copy}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 17 }}>{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <Feather name={selected ? 'check-circle' : 'circle'} size={22} color={selected ? colors.accentInk : colors.faint} />
      </View>
    </PressableScale>
  );
}

/** Language and appearance. Both apply the moment they are chosen. */
export default function LanguageScreen() {
  const t = useT();
  const language = usePrefsStore((s) => s.language);
  const setLanguage = usePrefsStore((s) => s.setLanguage);
  const choices: Choice[] = [
    { id: 'en', value: 'en', title: LOCALE_NAMES.en },
    { id: 'hi', value: 'hi', title: LOCALE_NAMES.hi },
    { id: 'phone', value: null, title: t('account.language.phone'), subtitle: t('account.language.phoneHint', { language: LOCALE_NAMES[detectLocale()] }) },
  ];
  return (
    <CollapsingScreen title={t('account.language.title')} subtitle={t('account.language.subtitle')} leading={<BackButton />}>
      <Reveal index={0}>
        <View accessibilityRole="radiogroup">
          <ListCard>
            {choices.map((c, i) => (
              <ChoiceRow
                key={c.id}
                title={c.title}
                subtitle={c.subtitle}
                selected={language === c.value}
                last={i === choices.length - 1}
                onPress={() => {
                  if (language !== c.value) {
                    tapHaptic();
                    setLanguage(c.value);
                  }
                }}
              />
            ))}
          </ListCard>
        </View>
      </Reveal>
      <Reveal index={1}>
        <Hint>{t('account.language.hint')}</Hint>
      </Reveal>
      <Reveal index={2}>
        <AppearancePicker />
      </Reveal>
    </CollapsingScreen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingHorizontal: 18, paddingVertical: 14 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    copy: { flex: 1 },
  });
