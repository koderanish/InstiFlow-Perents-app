import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useSchool } from '@/branding';
import { luminance } from '@/branding/rules';
import { useLocale, useT } from '@/i18n';
import { LANGUAGES, type Language } from '@/lib/prefs';
import { tapHaptic } from '@/motion/haptics';
import { PressableScale } from '@/motion/pressable-scale';
import { usePrefsStore } from '@/stores/prefs-store';
import { fonts, mix, useStyles, useTheme } from '@/theme';

/** A soft disc that drifts slowly. Transform and opacity only; holds still for reduced motion. */
function Orb({ size, top, left, right, delay, opacity }: { size: number; top: number; left?: number; right?: number; delay: number; opacity: number }) {
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);
  useEffect(() => {
    if (reduced) return undefined;
    drift.set(withRepeat(withTiming(1, { duration: 6000 + delay, easing: Easing.inOut(Easing.quad) }), -1, true));
    return () => cancelAnimation(drift);
  }, [delay, drift, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: drift.get() * 14 }, { translateX: drift.get() * -8 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', top, left, right, width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFFFFF', opacity }, style]} />;
}

const FEATURES = [
  { icon: 'check-circle', key: 'account.login.featAttendance' },
  { icon: 'credit-card', key: 'account.login.featFees' },
  { icon: 'book-open', key: 'account.login.featHomework' },
  { icon: 'message-circle', key: 'account.login.featChat' },
] as const;

const SHORT: Record<Language, string> = { en: 'EN', hi: 'हिं' };

/** Small pill that flips between English and Hindi before sign-in. */
function LanguagePill() {
  const styles = useStyles(createStyles);
  const locale = useLocale();
  const setLanguage = usePrefsStore((s) => s.setLanguage);
  const next = LANGUAGES[(LANGUAGES.indexOf(locale) + 1) % LANGUAGES.length] ?? 'en';
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={SHORT[next]}
      hitSlop={8}
      onPress={() => {
        tapHaptic();
        setLanguage(next);
      }}
      style={styles.langPill}
    >
      <Feather name="globe" size={14} color="#FFFFFF" />
      <Text style={styles.langText}>{SHORT[locale]}</Text>
    </PressableScale>
  );
}

/** Brand block at the top of sign-in: school colour gradient, drifting discs, logo, headline and feature chips. */
export function LoginHero({ topInset }: { topInset: number }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const school = useSchool();
  return (
    <LinearGradient colors={[luminance(colors.accent) > 0.45 ? mix(colors.accent, '#000000', 0.3) : colors.accent, mix(colors.accent, '#000000', 0.45)]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.hero, { paddingTop: topInset + 12 }]}>
      <Orb size={220} top={-60} right={-70} delay={0} opacity={0.12} />
      <Orb size={140} top={120} left={-60} delay={900} opacity={0.08} />
      <Orb size={64} top={70} right={90} delay={400} opacity={0.14} />
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            {school.logoUrl ? <Image source={{ uri: school.logoUrl }} resizeMode="contain" style={styles.logoImage} /> : <Text style={styles.logoText}>{school.shortName}</Text>}
          </View>
          <Text numberOfLines={1} style={styles.school}>
            {school.name}
          </Text>
        </View>
        <LanguagePill />
      </View>
      <Text maxFontSizeMultiplier={1.15} accessibilityRole="header" style={styles.headline}>
        {t('account.login.headline')}
      </Text>
      <Text style={styles.tagline}>{t('account.login.tagline')}</Text>
      <View style={styles.chips}>
        {FEATURES.map((f) => (
          <View key={f.key} style={styles.chip}>
            <Feather name={f.icon} size={13} color="#FFFFFF" />
            <Text style={styles.chipText}>{t(f.key)}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const createStyles = () =>
  StyleSheet.create({
    hero: { paddingHorizontal: 24, paddingBottom: 56, overflow: 'hidden' },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
    logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    logoImage: { width: 40, height: 40 },
    logoText: { fontFamily: fonts.bold, fontSize: 15, color: '#FFFFFF' },
    school: { fontFamily: fonts.semibold, fontSize: 15, color: '#FFFFFF', flexShrink: 1 },
    langPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    langText: { fontFamily: fonts.semibold, fontSize: 13, color: '#FFFFFF' },
    headline: { marginTop: 36, fontFamily: fonts.semibold, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: '#FFFFFF' },
    tagline: { marginTop: 10, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.88)' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.16)' },
    chipText: { fontFamily: fonts.semibold, fontSize: 12, color: '#FFFFFF' },
  });
