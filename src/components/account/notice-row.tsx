import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/icon-badge';
import { AppText } from '@/components/ui';
import { postedLabel } from '@/lib/dates';
import { categoryLabel, priorityInfo } from '@/lib/notices';
import { PressableScale } from '@/motion/pressable-scale';
import { colors, fonts } from '@/theme';
import type { Notice } from '@/types/parent';

const toneColor = { bad: colors.badFg, warn: colors.warnFg, good: colors.goodDot, neutral: colors.accent } as const;

/** One notice in the Inbox list. Only priority is emphasised, through the icon tile and a label: there is no read state to show. */
export function NoticeRow({ notice, last }: { notice: Notice; last?: boolean }) {
  const priority = priorityInfo(notice.priority);
  const category = categoryLabel(notice.category);
  const when = postedLabel(notice.postedAt);
  const meta = [when, category].filter(Boolean).join(' · ');
  return (
    <Link href={{ pathname: '/(app)/notice', params: { id: String(notice.id) } }} asChild>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${notice.title}. ${priority ? `${priority.label}. ` : ''}${meta}`}
        scaleTo={0.985}
      >
        <View style={[styles.row, !last && styles.divider]}>
          <IconBadge name={priority ? 'alert-circle' : 'bell'} tone={priority?.tone ?? 'neutral'} />
          <View style={{ flex: 1 }}>
            <View style={styles.meta}>
              <AppText variant="caption" numberOfLines={1} style={{ fontFamily: fonts.medium, fontSize: 13, flexShrink: 1 }}>
                {meta}
              </AppText>
              {priority ? <AppText style={[styles.priority, { color: toneColor[priority.tone] }]}>{priority.label}</AppText> : null}
            </View>
            <AppText style={styles.title}>{notice.title}</AppText>
            {notice.content ? (
              <AppText variant="caption" numberOfLines={2} style={styles.preview}>
                {notice.content}
              </AppText>
            ) : null}
          </View>
          <Feather name="chevron-right" size={18} color={colors.faint} />
        </View>
      </PressableScale>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16, minHeight: 64 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priority: { fontFamily: fonts.bold, fontSize: 12 },
  title: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, marginTop: 4 },
  preview: { fontSize: 15, lineHeight: 22, marginTop: 2 },
});
