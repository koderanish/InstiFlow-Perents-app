import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInUp, ReduceMotion } from 'react-native-reanimated';

import { clockParts, dayLabel, type ThreadItem } from '@/lib/messages';
import { monthShort, useLocale, useT, type Locale, type TFunction } from '@/i18n';
import { PressableScale } from '@/motion/pressable-scale';
import { ENTER_MS, ENTER_OFFSET } from '@/motion/tokens';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

/**
 * Rises into place. The list is inverted, so each cell is flipped: a negative offset reads as
 * "from just below" on screen. Opacity and transform only, and it follows the system reduce-motion setting.
 */
const arrive = FadeInUp.duration(ENTER_MS)
  .easing(Easing.out(Easing.cubic))
  .withInitialValues({ opacity: 0, transform: [{ translateY: -ENTER_OFFSET }] })
  .reduceMotion(ReduceMotion.System);

export const clockText = (iso: string, t: TFunction): string => {
  const { hour, minute, pm } = clockParts(iso);
  return `${hour}:${minute} ${t(pm ? 'chat.pm' : 'chat.am')}`;
};

type BubbleProps = {
  item: ThreadItem;
  /** True only for messages that arrived after the screen first loaded. */
  fresh: boolean;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
};

function BubbleBase({ item, fresh, onRetry, onDiscard }: BubbleProps) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const mine = item.sender === 'parent';
  const time = clockText(item.createdAt, t);
  const who = mine ? t('chat.you') : (item.senderName ?? t('chat.school'));
  const localId = item.localId;

  return (
    <Animated.View entering={fresh ? arrive : undefined} style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      {!mine && item.senderName ? <Text style={styles.sender}>{item.senderName}</Text> : null}
      <View
        accessible
        accessibilityLabel={t('chat.bubbleLabel', { who, time, body: item.body })}
        style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, item.status === 'sending' && styles.dim]}
      >
        <Text selectable style={[styles.body, mine ? styles.bodyMine : styles.bodyTheirs]}>
          {item.body}
        </Text>
      </View>
      {item.status === 'failed' && localId ? (
        <View style={styles.metaRow}>
          <Feather name="alert-circle" size={13} color={colors.badFg} />
          <Text style={[styles.meta, { color: colors.badFg }]}>{t('chat.failed')}</Text>
          <PressableScale accessibilityRole="button" accessibilityLabel={t('chat.retryLabel')} hitSlop={10} haptic="tap" onPress={() => onRetry(localId)}>
            <Text style={styles.action}>{t('chat.retry')}</Text>
          </PressableScale>
          <PressableScale accessibilityRole="button" accessibilityLabel={t('chat.discardLabel')} hitSlop={10} haptic="tap" onPress={() => onDiscard(localId)}>
            <Text style={[styles.action, { color: colors.muted }]}>{t('chat.discard')}</Text>
          </PressableScale>
        </View>
      ) : (
        <Text style={styles.meta}>{item.status === 'sending' ? t('chat.sending') : mine && item.readAt ? `${time} · ${t('chat.seen')}` : time}</Text>
      )}
    </Animated.View>
  );
}

export const MessageBubble = memo(BubbleBase);

export const dayText = (iso: string, now: Date, locale: Locale, t: TFunction): string => {
  const label = dayLabel(iso, now);
  if (label.kind === 'today') return t('chat.today');
  if (label.kind === 'yesterday') return t('chat.yesterday');
  const month = monthShort(locale, label.month);
  return label.year === null ? t('chat.date', { day: label.day, month }) : t('chat.dateYear', { day: label.day, month, year: label.year });
};

export function DaySeparator({ iso, now }: { iso: string; now: Date }) {
  const styles = useStyles(createStyles);
  const locale = useLocale();
  const t = useT();
  return (
    <View style={styles.dayWrap}>
      <View style={styles.dayPill}>
        <Text style={styles.dayText}>{dayText(iso, now, locale, t)}</Text>
      </View>
    </View>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
  row: { paddingHorizontal: 16, marginVertical: 4, maxWidth: '86%' },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  sender: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, marginBottom: 3, marginLeft: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleMine: { backgroundColor: colors.accent, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 6 },
  dim: { opacity: 0.7 },
  body: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  bodyMine: { color: colors.onAccent },
  bodyTheirs: { color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginHorizontal: 4 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.faint, marginTop: 4, marginHorizontal: 4, fontVariant: ['tabular-nums'] },
  action: { fontFamily: fonts.bold, fontSize: 12, color: colors.accentInk, paddingHorizontal: 2 },
  dayWrap: { alignItems: 'center', marginVertical: 14 },
  dayPill: { backgroundColor: colors.divider, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  dayText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  });
