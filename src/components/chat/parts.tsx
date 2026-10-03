import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { IconBadge } from '@/components/icon-badge';
import { useT, type TKey } from '@/i18n';
import { enterFade, exitFade } from '@/motion/presets';
import { PressableScale } from '@/motion/pressable-scale';
import { Skeleton } from '@/motion/skeleton';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

export function ChatHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  return (
    <View style={styles.header}>
      <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={onBack} style={styles.back} hitSlop={8}>
        <Feather name="chevron-left" size={22} color={colors.ink} />
      </PressableScale>
      <View style={styles.avatar}>
        <Feather name="message-circle" size={20} color={colors.accentInk} />
      </View>
      <View style={styles.titles}>
        <Text accessibilityRole="header" numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const BAR_WIDTHS = ['62%', '48%', '70%', '40%', '56%'] as const;

/** Bubble-shaped placeholders while the first load runs. */
export function ThreadSkeleton() {
  const styles = useStyles(createStyles);
  const t = useT();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={t('chat.loading')} style={styles.skeleton}>
      {BAR_WIDTHS.map((width, i) => (
        <View key={width + i} style={[styles.skeletonRow, i % 2 === 0 ? styles.left : styles.right]}>
          <Skeleton width={width} height={i % 3 === 0 ? 64 : 44} rounded={20} />
        </View>
      ))}
    </View>
  );
}

const STARTERS: readonly { label: TKey; text: TKey }[] = [
  { label: 'chat.starter.fee.label', text: 'chat.starter.fee.text' },
  { label: 'chat.starter.leave.label', text: 'chat.starter.leave.text' },
  { label: 'chat.starter.bus.label', text: 'chat.starter.bus.text' },
];

/** First-time view: a friendly prompt and three chips that fill the message box. */
export function EmptyChat({ onPick }: { onPick: (text: string) => void }) {
  const styles = useStyles(createStyles);
  const t = useT();
  return (
    <ScrollView contentContainerStyle={styles.empty} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <IconBadge name="message-circle" size={64} />
      <Text style={styles.emptyTitle}>{t('chat.emptyTitle')}</Text>
      <Text style={styles.emptyBody}>{t('chat.emptyBody')}</Text>
      <Text style={styles.startersLabel}>{t('chat.startersLabel')}</Text>
      <View style={styles.chips}>
        {STARTERS.map((s) => (
          <PressableScale key={s.label} accessibilityRole="button" haptic="tap" onPress={() => onPick(t(s.text))} style={styles.chip}>
            <Text maxFontSizeMultiplier={1.3} style={styles.chipText}>
              {t(s.label)}
            </Text>
          </PressableScale>
        ))}
      </View>
    </ScrollView>
  );
}

/** Shown above the thread when a refresh failed but older messages are still on screen. */
export function StaleNote() {
  const styles = useStyles(createStyles);
  const t = useT();
  return (
    <Animated.View accessibilityRole="alert" entering={enterFade(0)} exiting={exitFade} style={styles.stale}>
      <View style={styles.staleDot} />
      <Text style={styles.staleText}>{t('chat.stale')}</Text>
    </Animated.View>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
    titles: { flex: 1 },
    title: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
    subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 1 },
    skeleton: { flex: 1, paddingHorizontal: 16, paddingTop: 20, gap: 14 },
    skeletonRow: { flexDirection: 'row' },
    left: { justifyContent: 'flex-start' },
    right: { justifyContent: 'flex-end' },
    empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32 },
    emptyTitle: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink, textAlign: 'center', marginTop: 16 },
    emptyBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center', marginTop: 6 },
    startersLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.faint, textAlign: 'center', marginTop: 28 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 12 },
    chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
    stale: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.warnBg },
    staleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.warnFg },
    staleText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.warnFg },
  });
