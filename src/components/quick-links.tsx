import { Feather } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/icon-badge';
import { AppText } from '@/components/ui';
import { useT, type TKey } from '@/i18n';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { fonts, radius, useStyles, type Theme } from '@/theme';

type QuickLink = { id: string; label: TKey; hint: TKey; icon: React.ComponentProps<typeof Feather>['name']; href: Href };

const LINKS: QuickLink[] = [
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
  return (
    <View style={{ gap: 12 }}>
      <Reveal index={revealIndex}>
        <AppText variant="heading" accessibilityRole="header" style={{ marginHorizontal: 4 }}>
          {t('account.links.title')}
        </AppText>
      </Reveal>
      <View style={styles.grid}>
        {LINKS.map((l, i) => (
          <Reveal key={l.id} index={revealIndex + Math.min(1, Math.floor(i / 2))} style={styles.cell}>
            <Link href={l.href} asChild>
              <PressableScale accessibilityRole="button" accessibilityLabel={`${t(l.label)}. ${t(l.hint)}`} style={styles.tile}>
                <IconBadge name={l.icon} size={36} />
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
        ))}
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
    copy: { paddingHorizontal: 4, paddingBottom: 4, gap: 2 },
  });
