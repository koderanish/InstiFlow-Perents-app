import { Feather } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/icon-badge';
import { AppText } from '@/components/ui';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { colors, fonts, radius, shadow } from '@/theme';

type QuickLink = { label: string; hint: string; icon: React.ComponentProps<typeof Feather>['name']; href: Href };

const LINKS: QuickLink[] = [
  { label: 'Timetable', hint: 'Periods and teachers', icon: 'clock', href: '/(app)/timetable' },
  { label: 'Exams', hint: 'Dates and venues', icon: 'edit-3', href: '/(app)/exams' },
  { label: 'Homework', hint: 'To do and done', icon: 'book-open', href: '/(app)/homework' },
  { label: 'Leave note', hint: 'Tell the school', icon: 'file-text', href: '/(app)/leave' },
  { label: 'Child profile', hint: 'Class and guardians', icon: 'user', href: '/(app)/child' },
  { label: 'Contact school', hint: 'Call or email', icon: 'phone', href: '/(app)/contact' },
];

/** Everything a parent may need that is not on the four tabs. Tiles rise in once, row by row. */
export function QuickLinks({ revealIndex = 5 }: { revealIndex?: number }) {
  return (
    <View style={{ gap: 12 }}>
      <Reveal index={revealIndex}>
        <AppText variant="heading" accessibilityRole="header" style={{ marginHorizontal: 4 }}>
          More for you
        </AppText>
      </Reveal>
      <View style={styles.grid}>
        {LINKS.map((l, i) => (
          <Reveal key={l.label} index={revealIndex + Math.min(1, Math.floor(i / 2))} style={styles.cell}>
            <Link href={l.href} asChild>
              <PressableScale accessibilityRole="button" accessibilityLabel={`${l.label}. ${l.hint}`} style={styles.tile}>
                <IconBadge name={l.icon} size={36} />
                <View style={styles.copy}>
                  <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
                    {l.label}
                  </AppText>
                  <AppText variant="caption" numberOfLines={2} style={{ fontSize: 13 }}>
                    {l.hint}
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
const styles = StyleSheet.create({
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
