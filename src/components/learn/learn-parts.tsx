import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, type Href } from 'expo-router';
import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { IconBadge } from '@/components/icon-badge';
import { AppText } from '@/components/ui';
import { AnimatedBar } from '@/motion/animated-bar';
import { PressableScale } from '@/motion/pressable-scale';
import { staggerDelay } from '@/motion/tokens';
import { fonts, radius, useStyles, useTheme, useThemed, type Theme } from '@/theme';

/** Heading above a card, as on the approved boards ("Date sheet"). */
export function LearnSectionTitle({ title, caption }: { title: string; caption?: string | null }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.sectionTitle}>
      <AppText accessibilityRole="header" numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: fonts.semibold, fontSize: 17 }}>
        {title}
      </AppText>
      {caption ? (
        <AppText variant="caption" tabular style={{ fontSize: 13, marginTop: 2 }}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

/** Page title block for tab screens: big title with a one-line subtitle. */
export function LearnTitle({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <View>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 15, marginTop: 4 }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

/** Shadow shell for a hero block. Outer radius 28 = inner radius + padding is handled by `HeroFill`. */
const heroShellStyle = ({ colors, shadow }: Theme): ViewStyle => StyleSheet.flatten<ViewStyle>([{ borderRadius: radius.hero, backgroundColor: colors.card }, shadow.card]);

/** One flat style object, safe to hand to a `Pressable` under `<Link asChild>`. */
export const useHeroShell = (): ViewStyle => useThemed(heroShellStyle);

/** The one soft accent wash a screen gets. Content sits on top with `padding`. */
export function HeroFill({ children, padding = 24 }: PropsWithChildren<{ padding?: number }>) {
  const { colors } = useTheme();
  return (
    <View style={{ borderRadius: radius.hero, overflow: 'hidden', padding }}>
      <LinearGradient pointerEvents="none" colors={[colors.accentTint, colors.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

export function HeroSurface({ children, padding }: PropsWithChildren<{ padding?: number }>) {
  const shell = useHeroShell();
  return (
    <View style={shell}>
      <HeroFill padding={padding}>{children}</HeroFill>
    </View>
  );
}

/** One subject row: name, mark and a thin bar in the school accent that fills in turn. */
export function LearnStatBar({
  label,
  valueLabel,
  ratio,
  spoken,
  last,
  index = 0,
}: {
  label: string;
  valueLabel: string;
  /** 0 to 1; null hides the bar. */
  ratio: number | null;
  spoken: string;
  last?: boolean;
  /** Position in the list; later rows start filling a little later. */
  index?: number;
}) {
  const styles = useStyles(createStyles);
  return (
    <View accessible accessibilityLabel={spoken} style={[styles.statBar, !last && styles.statBarDivider]}>
      <View style={styles.statBarTop}>
        <AppText numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 16 }}>
          {label}
        </AppText>
        <AppText tabular style={{ fontFamily: fonts.semibold, fontSize: 16 }}>
          {valueLabel}
        </AppText>
      </View>
      {ratio !== null ? <AnimatedBar ratio={ratio} delay={260 + staggerDelay(index, 70)} style={{ marginTop: 10 }} /> : null}
    </View>
  );
}

/** Small tappable number tile ("95% Attendance"). Press-scales and ticks like every other control. */
export function LearnStatTile({ value, label, href, icon }: { value: string; label: string; href: Href; icon?: React.ComponentProps<typeof Feather>['name'] }) {
  const styles = useStyles(createStyles);
  return (
    <Link href={href} asChild>
      <PressableScale accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={styles.tile}>
        {icon ? <IconBadge name={icon} size={36} /> : null}
        <View>
          <AppText tabular numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.semibold, fontSize: 20, letterSpacing: -0.2 }}>
            {value}
          </AppText>
          <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ marginTop: 2 }}>
            {label}
          </AppText>
        </View>
      </PressableScale>
    </Link>
  );
}

/** "Happening now" marker: a solid dot with a halo that breathes. The halo is still under reduced motion. */
export function PulseDot({ color, size = 8 }: { color?: string; size?: number }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) return undefined;
    pulse.set(withRepeat(withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(pulse);
  }, [pulse, reduced]);

  const halo = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - pulse.value), transform: [{ scale: 1 + 1.4 * pulse.value }] }));
  const box = size * 3;
  const disc = { width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? colors.accent } as const;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      {reduced ? null : <Animated.View style={[styles.halo, disc, halo]} />}
      <View style={disc} />
    </View>
  );
}

/** Chevron that turns over when a row opens. */
export function RotatingChevron({ open, size = 18 }: { open: boolean; size?: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const turn = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    const target = open ? 1 : 0;
    turn.set(reduced ? target : withTiming(target, { duration: 200, easing: Easing.out(Easing.cubic) }));
  }, [open, reduced, turn]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));
  return (
    <Animated.View style={style}>
      <Feather name="chevron-down" size={size} color={colors.faint} />
    </Animated.View>
  );
}

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    sectionTitle: { marginHorizontal: 4, marginBottom: -8 },
    statBar: { paddingVertical: 14, paddingHorizontal: 18 },
    statBarDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    statBarTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    halo: { position: 'absolute' },
    tile: { flex: 1, minHeight: 64, backgroundColor: colors.card, borderRadius: 20, padding: 16, gap: 12, ...shadow.card },
  });
