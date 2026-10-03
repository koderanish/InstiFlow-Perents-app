import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChildChips } from '@/components/child-chips';
import { ChildGate } from '@/components/child-gate';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { LearnSectionTitle, LearnSegmented, type SegmentOption } from '@/components/learn/learn-parts';
import { AppText, BackHeader, Card, Chip, EmptyState, ErrorState, Loading, Screen } from '@/components/ui';
import { useChildren, useTimetable } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { firstName } from '@/lib/format';
import { SCHOOL_DAYS, currentSlotIndex, defaultDayIndex, groupByDay, periodCount, periodLabel, slotTimeRange, weekdayIndex } from '@/lib/timetable';
import { colors, fonts } from '@/theme';
import type { ParentChild, TimetableSlot } from '@/types/parent';

function BreakRow({ slot, now: isNow }: { slot: TimetableSlot; now: boolean }) {
  const label = slot.subject?.trim() || periodLabel(slot.period) || 'Break';
  const range = slotTimeRange(slot);
  return (
    <View accessible accessibilityLabel={`${label}, ${range}${isNow ? ', now' : ''}`} style={[styles.breakRow, isNow && { backgroundColor: colors.accentTint }]}>
      <AppText variant="caption" style={{ fontSize: 14, fontFamily: fonts.medium }}>
        {label}
      </AppText>
      <AppText variant="caption" style={{ fontSize: 13 }}>
        {range}
      </AppText>
      {isNow ? <Chip label="Now" tone="good" /> : null}
    </View>
  );
}

function PeriodCard({ slot, now: isNow }: { slot: TimetableSlot; now: boolean }) {
  const subject = slot.subject?.trim() || 'Free period';
  const range = slotTimeRange(slot);
  const spoken = [periodLabel(slot.period), subject, slot.teacher, range, isNow ? 'now' : null].filter(Boolean).join(', ');
  return (
    <View accessible accessibilityLabel={spoken} style={[styles.period, isNow && { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.periodTop}>
          <AppText variant="caption" style={{ fontSize: 13, fontFamily: fonts.medium }}>
            {periodLabel(slot.period)}
          </AppText>
          {isNow ? <Chip label="Now" tone="good" /> : null}
        </View>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 18, letterSpacing: -0.2, marginTop: 4 }}>{subject}</AppText>
        {slot.teacher ? (
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {slot.teacher}
          </AppText>
        ) : null}
        <AppText variant="caption" style={{ fontSize: 13, color: isNow ? colors.accentInk : colors.faint, marginTop: 6 }}>
          {range}
        </AppText>
      </View>
    </View>
  );
}

function TimetableBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const q = useTimetable(child.id);
  const now = useNow();
  const [picked, setPicked] = useState<number | null>(null);
  const today = weekdayIndex(now);
  const selected = picked ?? defaultDayIndex(now);

  const byDay = useMemo(() => groupByDay(q.data ?? []), [q.data]);
  const options = useMemo<SegmentOption<string>[]>(
    () => SCHOOL_DAYS.map((d) => ({ key: String(d.index), label: d.short, spoken: d.index === today ? `${d.long}, today` : d.long, dot: d.index === today })),
    [today],
  );

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;

  if (q.data.length === 0) {
    return (
      <>
        <ChildChips items={all} selectedId={child.id} />
        <EmptyState title="Timetable not added yet" message={`The class timetable for ${firstName(child.name)} will appear here once the school adds it.`} />
      </>
    );
  }

  const day = SCHOOL_DAYS.find((d) => d.index === selected) ?? SCHOOL_DAYS[0];
  const daySlots = byDay.get(selected) ?? [];
  const nowIndex = selected === today ? currentSlotIndex(daySlots, now) : -1;
  const classes = periodCount(daySlots);

  return (
    <>
      <ChildChips items={all} selectedId={child.id} />
      <LearnSegmented options={options} value={String(selected)} onChange={(key) => setPicked(Number(key))} label="Day of the week" />
      <LearnSectionTitle
        title={selected === today ? `${day.long}, today` : day.long}
        caption={classes > 0 ? `${classes} ${classes === 1 ? 'class' : 'classes'}` : null}
      />
      {daySlots.length === 0 ? (
        <Card>
          <EmptyState title={`No classes on ${day.long}`} message="Nothing is scheduled for this day." />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {daySlots.map((slot, i) =>
            slot.isBreak ? <BreakRow key={`${slot.period}-${slot.start}`} slot={slot} now={i === nowIndex} /> : <PeriodCard key={`${slot.period}-${slot.start}`} slot={slot} now={i === nowIndex} />,
          )}
        </View>
      )}
      <AppText variant="caption" style={{ fontSize: 13, paddingHorizontal: 4 }}>
        Changes made by the school show up here right away.
      </AppText>
    </>
  );
}

export default function TimetableScreen() {
  const router = useRouter();
  const refresh = usePullRefresh();
  const { child } = useChildren();
  const subtitle = child ? [firstName(child.name), child.className, 'this week'].filter(Boolean).join(', ') : undefined;
  return (
    <Screen {...refresh} header={<BackHeader title="Timetable" subtitle={subtitle} onBack={() => router.back()} />}>
      <ChildGate>{(selected, all) => <TimetableBody child={selected} all={all} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  period: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
  },
  periodTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.divider,
  },
});
