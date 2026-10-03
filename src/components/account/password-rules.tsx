import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { IconSwap } from '@/components/account/icon-swap';
import { AppText } from '@/components/ui';
import { useT } from '@/i18n';
import type { Strength, StrengthLevel } from '@/lib/password-strength';
import { enterFade, enterRise, exitFade } from '@/motion/presets';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

/** One line of the rule checklist. Its icon cross-fades from an empty circle to a tick when the rule is met. */
export function RuleLine({ label, met }: { label: string; met: boolean }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const reduced = useReducedMotion();
  const t01 = useSharedValue(met ? 1 : 0);
  const muted = colors.muted;
  const good = colors.goodFg;

  useEffect(() => {
    const target = met ? 1 : 0;
    t01.set(reduced ? target : withTiming(target, { duration: 200 }));
  }, [met, reduced, t01]);

  const text = useAnimatedStyle(() => ({ color: interpolateColor(t01.get(), [0, 1], [muted, good]) }));

  return (
    <View accessible accessibilityLabel={t(met ? 'account.password.ruleDone' : 'account.password.ruleNotYet', { rule: label })} style={styles.rule}>
      <IconSwap active={met} from="circle" to="check-circle" size={16} fromColor={colors.faint} toColor={colors.goodFg} />
      <Animated.Text maxFontSizeMultiplier={1.3} style={[styles.ruleText, text]}>
        {label}
      </Animated.Text>
    </View>
  );
}

const levelColor = (colors: Theme['colors']): Record<StrengthLevel, string> => ({
  empty: colors.border,
  weak: colors.badFg,
  fair: colors.warnFg,
  good: colors.goodDot,
  strong: colors.goodFg,
});

/** A thin bar that fills and changes colour as the password gets stronger, with a word beside it. */
export function StrengthMeter({ strength }: { strength: Strength }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const reduced = useReducedMotion();
  const fraction = useSharedValue(strength.fraction);
  const { badFg, warnFg, goodDot, goodFg } = colors;

  useEffect(() => {
    fraction.set(reduced ? strength.fraction : withTiming(strength.fraction, { duration: 240 }));
  }, [strength.fraction, reduced, fraction]);

  const fill = useAnimatedStyle(() => ({
    width: `${Math.round(fraction.get() * 100)}%`,
    backgroundColor: interpolateColor(fraction.get(), [0, 0.34, 0.5, 0.67, 0.84], [badFg, badFg, warnFg, goodDot, goodFg]),
  }));

  return (
    <Animated.View
      accessible
      accessibilityLabel={t('account.password.strengthLabel', { level: strength.label || t('account.password.strength.none') })}
      entering={enterRise(0)}
      exiting={exitFade}
      style={styles.meter}
    >
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fill]} />
      </View>
      <Animated.View key={strength.level} entering={enterFade(0)} style={styles.word}>
        <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 13, color: levelColor(colors)[strength.level] }}>
          {strength.label}
        </AppText>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    rule: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 22 },
    ruleText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 14 },
    meter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
    fill: { height: 6, borderRadius: 3 },
    word: { minWidth: 52, alignItems: 'flex-end' },
  });
