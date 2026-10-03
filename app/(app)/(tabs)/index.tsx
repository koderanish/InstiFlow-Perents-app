import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AttendanceHero } from '@/components/account/attendance-hero';
import { ChildChips } from '@/components/child-chips';
import { ChildGate } from '@/components/child-gate';
import { QuickLinks } from '@/components/quick-links';
import { AppText, ErrorState, ListCard, ListRow, Loading, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useChildren, useToday } from '@/features/parent/hooks';
import { firstName, greeting, initials } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { attendanceHero, busLine, diaryLine, feesLine } from '@/lib/status-copy';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { useAuthStore } from '@/stores/auth-store';
import { colors, fonts } from '@/theme';
import type { ParentChild } from '@/types/parent';

/**
 * Hero and status rows for one child. On first load they enter after the greeting (steps 3 and 4);
 * after a switch between children they enter together, so changing child feels like a quick cross-fade.
 */
function TodayBody({ child, stagger }: { child: ParentChild; stagger: boolean }) {
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
    bus ? { ...bus, icon: 'truck' as const, href: '/(app)/bus' as const } : null,
    fees ? { ...fees, icon: 'credit-card' as const, href: '/(app)/(tabs)/fees' as const } : null,
    { ...diaryLine(d.diary), icon: 'book-open' as const, href: '/(app)/diary' as const },
    d.notices && d.notices[0]
      ? { title: 'From the school', subtitle: d.notices[0].title, tone: 'neutral' as const, icon: 'bell' as const, href: '/(app)/(tabs)/inbox' as const }
      : null,
  ].filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <>
      {hero && d.attendance ? (
        <Reveal index={stagger ? 3 : 0}>
          <AttendanceHero hero={hero} status={d.attendance.today.status} />
        </Reveal>
      ) : null}
      <Reveal index={stagger ? 4 : 0}>
        <ListCard>
          {rows.map((r, i) => (
            <ListRow key={r.title} title={r.title} subtitle={r.subtitle} icon={r.icon} dot={r.tone ?? 'neutral'} href={r.href} last={i === rows.length - 1} />
          ))}
        </ListCard>
      </Reveal>
    </>
  );
}

function TodayContent({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  // Remember whether the parent has switched child, to drop the stagger for later changes.
  const [lastId, setLastId] = useState(child.id);
  const [switched, setSwitched] = useState(false);
  if (child.id !== lastId) {
    setLastId(child.id);
    setSwitched(true);
  }
  return (
    <>
      <ChildChips items={all} selectedId={child.id} revealIndex={2} />
      <TodayBody key={child.id} child={child} stagger={!switched} />
      <QuickLinks revealIndex={5} />
    </>
  );
}

export default function TodayScreen() {
  const user = useAuthStore((s) => s.user);
  const { refetch } = useChildren();
  return (
    <Screen onRefresh={() => void refetch()}>
      <Reveal index={0}>
        <View style={styles.header}>
          <View style={styles.school}>
            <View style={styles.logo}>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.accentInk }}>{SCHOOL.shortName}</AppText>
            </View>
            <AppText variant="caption" numberOfLines={1} style={{ fontFamily: fonts.medium, flexShrink: 1 }}>
              {SCHOOL.name}
            </AppText>
          </View>
          <Link href="/(app)/profile" asChild>
            <PressableScale accessibilityRole="button" accessibilityLabel="Your profile" style={styles.avatar}>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 14 }}>{initials(user?.full_name ?? '')}</AppText>
            </PressableScale>
          </Link>
        </View>
      </Reveal>
      <Reveal index={1}>
        <AppText variant="title">
          {greeting()},{'\n'}
          {firstName(user?.full_name ?? '')}
        </AppText>
      </Reveal>
      <ChildGate>{(child, all) => <TodayContent child={child} all={all} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  school: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logo: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
