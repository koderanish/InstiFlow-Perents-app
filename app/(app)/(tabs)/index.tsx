import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChildChips } from '@/components/child-chips';
import { ChildGate } from '@/components/child-gate';
import { AppText, Card, Chip, ErrorState, ListCard, ListRow, Loading, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useChildren, useToday } from '@/features/parent/hooks';
import { firstName, greeting, initials } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { attendanceHero, busLine, diaryLine, feesLine } from '@/lib/status-copy';
import { useAuthStore } from '@/stores/auth-store';
import { colors, fonts } from '@/theme';
import type { ParentChild } from '@/types/parent';

function TodayBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const today = useToday(child.id);
  if (today.isLoading) return <Loading label={`Loading ${firstName(child.name)}'s day`} />;
  if (today.isError || !today.data) {
    return <ErrorState message={friendlyError(today.error)} onRetry={() => void today.refetch()} />;
  }
  const d = today.data;
  const classLabel = [d.child.className, d.child.sectionName].filter(Boolean).join(' ') || 'Class not assigned';
  const hero = d.attendance ? attendanceHero(d.attendance.today.status, firstName(child.name), classLabel) : null;
  const bus = busLine(d.bus);
  const fees = feesLine(d.fees);
  const rows = [
    bus ? { ...bus, href: '/(app)/bus' as const } : null,
    fees ? { ...fees, href: '/(app)/(tabs)/fees' as const } : null,
    { ...diaryLine(d.diary), href: '/(app)/diary' as const },
    d.notices && d.notices[0]
      ? { title: 'From the school', subtitle: d.notices[0].title, tone: 'neutral' as const, href: '/(app)/(tabs)/inbox' as const }
      : null,
  ].filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <>
      <ChildChips items={all} selectedId={child.id} />
      {hero ? (
        <Link href="/(app)/attendance" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Attendance">
            <Card hero>
              <Chip label={hero.chip} tone={hero.tone} />
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, marginTop: 16 }}>{hero.title}</AppText>
              <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>{hero.subtitle}</AppText>
            </Card>
          </Pressable>
        </Link>
      ) : null}
      <ListCard>
        {rows.map((r, i) => (
          <ListRow key={r.title} title={r.title} subtitle={r.subtitle} dot={r.tone === 'neutral' ? undefined : r.tone} href={r.href} last={i === rows.length - 1} />
        ))}
      </ListCard>
    </>
  );
}

export default function TodayScreen() {
  const user = useAuthStore((s) => s.user);
  const { refetch } = useChildren();
  return (
    <Screen onRefresh={() => void refetch()}>
      <View style={styles.header}>
        <View style={styles.school}>
          <View style={styles.logo}>
            <AppText style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.accentInk }}>{SCHOOL.shortName}</AppText>
          </View>
          <AppText variant="caption" style={{ fontFamily: fonts.medium }}>{SCHOOL.name}</AppText>
        </View>
        <Link href="/(app)/profile" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Your profile" style={styles.avatar}>
            <AppText style={{ fontFamily: fonts.bold, fontSize: 14 }}>{initials(user?.full_name ?? '')}</AppText>
          </Pressable>
        </Link>
      </View>
      <AppText variant="title">
        {greeting()},{'\n'}
        {firstName(user?.full_name ?? '')}
      </AppText>
      <ChildGate>{(child, all) => <TodayBody child={child} all={all} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  school: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
