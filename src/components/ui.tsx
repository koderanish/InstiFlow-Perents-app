import { Link, type Href } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, fonts, radius, shadow } from '@/theme';
import type { Tone } from '@/lib/status-copy';

type Variant = 'title' | 'heading' | 'body' | 'caption' | 'label';

const textStyles: Record<Variant, TextStyle> = {
  title: { fontFamily: fonts.semibold, fontSize: 30, lineHeight: 33, letterSpacing: -0.75, color: colors.ink },
  heading: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  body: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  caption: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
};

export function AppText({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text {...rest} style={[textStyles[variant], style]} />;
}

export function Display({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[{ fontFamily: fonts.display, fontSize: 64, lineHeight: 64, color: colors.ink, letterSpacing: -1 }, style]}>{children}</Text>;
}

/** Scrolling page on the app background. `tabs` leaves room for the bottom tab bar. */
export function Screen({
  children,
  scroll = true,
  header,
  refreshing,
  onRefresh,
}: PropsWithChildren<{ scroll?: boolean; header?: ReactNode; refreshing?: boolean; onRefresh?: () => void }>) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.page}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.page}>{children}</View>
  );
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {header}
      {body}
    </SafeAreaView>
  );
}

export function Card({ children, style, hero }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; hero?: boolean }>) {
  return <View style={[styles.card, hero && styles.hero, style]}>{children}</View>;
}

const toneColors: Record<Tone, { bg: string; fg: string }> = {
  good: { bg: colors.goodBg, fg: colors.goodFg },
  warn: { bg: colors.warnBg, fg: colors.warnFg },
  bad: { bg: colors.badBg, fg: colors.badFg },
  neutral: { bg: colors.accentTint, fg: colors.accentInk },
};

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <View style={[styles.chipDot, { backgroundColor: c.fg }]} />
      <Text style={[styles.chipText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function ListCard({ children }: PropsWithChildren) {
  return <View style={[styles.listCard, shadow.card]}>{children}</View>;
}

export function ListRow({
  title,
  subtitle,
  href,
  dot,
  last,
  right,
}: {
  title: string;
  subtitle?: string;
  href?: Href;
  dot?: Tone;
  last?: boolean;
  right?: ReactNode;
}) {
  const inner = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={{ flex: 1 }}>
        <AppText variant="body" style={{ fontFamily: fonts.semibold }}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {dot ? <View style={[styles.dot, { backgroundColor: dot === 'good' ? colors.goodDot : dot === 'bad' ? colors.badFg : dot === 'warn' ? colors.warnFg : colors.accent }]} /> : null}
      {right}
      {href ? <Feather name="chevron-right" size={18} color={colors.faint} /> : null}
    </View>
  );
  if (!href) return inner;
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={title}>
        {inner}
      </Pressable>
    </Link>
  );
}

export function PrimaryButton({ label, onPress, loading, disabled }: { label: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  const off = disabled || loading;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!off, busy: !!loading }} disabled={off} onPress={onPress} style={[styles.button, off && { opacity: 0.55 }]}>
      {loading ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.buttonText}>{label}</Text>}
    </Pressable>
  );
}

export function BackHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <View style={styles.backHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.backButton} hitSlop={8}>
        <Feather name="chevron-left" size={22} color={colors.ink} />
      </Pressable>
      <View>
        <AppText variant="title" style={{ fontSize: 26, lineHeight: 29 }}>
          {title}
        </AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} />
      {label ? <AppText variant="caption" style={{ marginTop: 12 }}>{label}</AppText> : null}
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.center}>
      <AppText variant="heading" style={{ textAlign: 'center' }}>{title}</AppText>
      {message ? <AppText variant="caption" style={{ textAlign: 'center', marginTop: 6, lineHeight: 21 }}>{message}</AppText> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <AppText variant="heading" style={{ textAlign: 'center' }}>Could not refresh</AppText>
      <AppText variant="caption" style={{ textAlign: 'center', marginTop: 6, lineHeight: 21 }}>{message}</AppText>
      {onRetry ? (
        <View style={{ marginTop: 18, alignSelf: 'stretch', paddingHorizontal: 40 }}>
          <PrimaryButton label="Try again" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  page: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 20 },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, ...shadow.card },
  hero: { borderRadius: radius.hero, padding: 24 },
  chip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, height: 30, paddingHorizontal: 12, borderRadius: 15 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: fonts.semibold, fontSize: 13 },
  listCard: { backgroundColor: colors.card, borderRadius: radius.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  dot: { width: 9, height: 9, borderRadius: 5 },
  button: { height: 56, borderRadius: radius.button, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onAccent },
  backHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
});
