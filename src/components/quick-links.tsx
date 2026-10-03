import { Feather } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/icon-badge';
import { AppText } from '@/components/ui';
import { useUnreadMessages } from '@/components/chat/hooks';
import { useT, type TKey } from '@/i18n';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { fonts, radius, useStyles, type Theme } from '@/theme';

type QuickLink = { id: string; label: TKey; hint: TKey; icon: React.ComponentProps<typeof Feather>['name']; href: Href };

const LINKS: QuickLink[] = [
  { id: 'attendance', label: 'account.links.attendance', hint: 'account.links.attendanceHint', icon: 'calendar', href: '/(app)/attendance' },
  { id: 'diary', label: 'account.links.diary', hint: 'account.links.diaryHint', icon: 'book', href: '/(app)/diary' },
  { id: 'bus', label: 'account.links.bus', hint: 'account.links.busHint', icon: 'truck', href: '/(app)/bus' },
  { id: 'reportCard', label: 'account.links.reportCard', hint: 'account.links.reportCardHint', icon: 'award', href: '/(app)/report-card' },
  { id: 'messages', label: 'chat.title', hint: 'chat.linkHint', icon: 'message-circle', href: '/(app)/messages' },
  { id: 'events', label: 'events.title', hint: 'events.linkHint', icon: 'star', href: '/(app)/events' },
  { id: 'timetable', label: 'account.links.timetable', hint: 'account.links.timetableHint', icon: 'clock', href: '/(app)/timetable' },
  { id: 'exams', label: 'account.links.exams', hint: 'account.links.examsHint', icon: 'edit-3', href: '/(app)/exams' },
  { id: 'homework', label: 'account.links.homework', hint: 'account.links.homeworkHint', icon: 'book-open', href: '/(app)/homework' },
  { id: 'leave', label: 'account.links.leave', hint: 'account.links.leaveHint', icon: 'file-text', href: '/(app)/leave' },
  { id: 'child', label: 'account.links.child', hint: 'account.links.childHint', icon: 'user', href: '/(app)/child' },
  { id: 'contact', label: 'account.links.contact', hint: 'account.links.contactHint', icon: 'phone', href: '/(app)/contact' },
];

/** Everything a parent may need that is not on the four tabs. Tiles rise in once, row by row. */
export function QuickLinks({ revealIndex = 5 }: { revealIndex?: number }) {
  const styles = useStyles(createStyles);
  const t = useT();
  const unread = useUnreadMessages();
  return (
    <View style={{ gap: 12 }}>
      <Reveal index={revealIndex}>
        <AppText variant="heading" accessibilityRole="header" style={{ marginHorizontal: 4 }}>
          {t('account.links.title')}
        </AppText>
      </Reveal>
      <View style={styles.grid}>
        {LINKS.map((l, i) => {
          const badge = l.id === 'messages' ? unread : 0;
          const label = `${t(l.label)}. ${t(l.hint)}${badge > 0 ? `. ${t('chat.unreadBadge', { count: badge })}` : ''}`;
          return (
          <Reveal key={l.id} index={revealIndex + Math.min(1, Math.floor(i / 2))} style={styles.cell}>
            <Link href={l.href} asChild>
              <PressableScale accessibilityRole="button" accessibilityLabel={label} style={styles.tile}>
                <View style={styles.top}>
                  <IconBadge name={l.icon} size={36} />
                  {badge > 0 ? (
                    <View style={styles.badge}>
                      <AppText tabular style={styles.badgeText}>
                        {badge > 99 ? '99+' : badge}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <View style={styles.copy}>
                  <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
                    {t(l.label)}
                  </AppText>
                  <AppText variant="caption" numberOfLines={2} style={{ fontSize: 13 }}>
                    {t(l.hint)}
                  </AppText>
                </View>
              </PressableScale>
            </Link>
          </Reveal>
          );
        })}
      </View>
    </View>
  );
}

// Tile corners are the icon tile's (36 / 3 = 12) plus the 12 of padding around it, so they stay concentric.
const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    cell: { flexBasis: '47%', flexGrow: 1 },
    tile: {
      flex: 1,
      minHeight: 112,
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 12,
      justifyContent: 'space-between',
      gap: 10,
      ...shadow.card,
    },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.badFg, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, color: colors.card },
    copy: { paddingHorizontal: 4, paddingBottom: 4, gap: 2 },
  });
