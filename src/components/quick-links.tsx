import { Feather } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
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

/** Everything a parent may need that is not on the four tabs. */
export function QuickLinks() {
  return (
    <View style={{ gap: 12 }}>
      <AppText variant="heading">More for you</AppText>
      <View style={styles.grid}>
        {LINKS.map((l) => (
          <Link key={l.label} href={l.href} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`${l.label}. ${l.hint}`} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
              <View style={styles.icon}>
                <Feather name={l.icon} size={20} color={colors.accentInk} />
              </View>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 15 }}>{l.label}</AppText>
              <AppText variant="caption" style={{ fontSize: 13 }}>
                {l.hint}
              </AppText>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 112,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 16,
    gap: 4,
    ...shadow.card,
  },
  icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
