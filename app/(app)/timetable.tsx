import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ChildChips } from '@/components/child-chips';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { ChildGate } from '@/components/child-gate';
import { BackButton } from '@/components/learn/back-button';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { LearnSectionTitle, PulseDot } from '@/components/learn/learn-parts';
import { AppText, Card, EmptyState, ErrorState, Loading } from '@/components/ui';
import { useChildren, useTimetable } from '@/features/parent/hooks';
import { useLocale, useT } from '@/i18n';
import { friendlyError } from '@/lib/errors';
import { firstName } from '@/lib/format';
import { SCHOOL_DAYS, currentSlotIndex, defaultDayIndex, groupByDay, periodCount, periodLabel, schoolDayNames, slotTimeRange, weekdayIndex } from '@/lib/timetable';
import { enterFade, enterRise } from '@/motion/presets';
import { Reveal } from '@/motion/reveal';
import { Segmented, type SegmentOption } from '@/motion/segmented';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';
import type { ParentChild, TimetableSlot } from '@/types/parent';

/** Breaks stay quiet: no card, just a label between two hairlines. */
function BreakRow({ slot, now: isNow, index }: { slot: TimetableSlot; now: boolean; index: number }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const label = slot.subject?.trim() || periodLabel(slot.period, t) || t('learn.timetable.break');
  const range = slotTimeRange(slot, t);
  return (
    <Animated.View entering={enterFade(index)} accessible accessibilityLabel={`${label}, ${range}${isNow ? `, ${t('learn.timetable.nowSpoken')}` : ''}`} style={styles.breakRow}>
      <View style={styles.breakLine} />
      <View style={[styles.breakLabel, isNow && { backgroundColor: colors.accentTint }]}>
        {isNow ? <PulseDot size={6} /> : null}
        <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: fonts.medium, flexShrink: 1 }}>
          {label}
        </AppText>
        <AppText variant="caption" tabular style={{ fontSize: 13, color: colors.faint }}>
          {range}
        </AppText>
      </View>
      <View style={styles.breakLine} />
    </Animated.View>
  );
}

function PeriodCard({ slot, now: isNow, index }: { slot: TimetableSlot; now: boolean; index: number }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const subject = slot.subject?.trim() || t('learn.timetable.freePeriod');
  const range = slotTimeRange(slot, t);
  const spoken = [periodLabel(slot.period, t), subject, slot.teacher, range, isNow ? t('learn.timetable.nowSpoken') : null].filter(Boolean).join(', ');
  return (
    <Animated.View entering={enterRise(index)} accessible accessibilityLabel={spoken} style={[styles.period, isNow && styles.periodNow]}>
      <View style={{ flex: 1 }}>
        <View style={styles.periodTop}>
          <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: fonts.medium, flexShrink: 1 }}>
            {periodLabel(slot.period, t)}
          </AppText>
          {isNow ? (
            <View style={styles.nowTag}>
              <PulseDot />
              <AppText style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.accentInk }}>{t('learn.timetable.now')}</AppText>
            </View>
          ) : null}
        </View>
        <AppText numberOfLines={2} ellipsizeMode="tail" style={{ fontFamily: fonts.semibold, fontSize: 18, letterSpacing: -0.2, marginTop: 4 }}>
          {subject}
        </AppText>
        {slot.teacher ? (
          <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ marginTop: 2 }}>
            {slot.teacher}
          </AppText>
        ) : null}
        <AppText variant="caption" tabular style={{ fontSize: 13, color: isNow ? colors.accentInk : colors.faint, marginTop: 6 }}>
          {range}
        </AppText>
      </View>
    </Animated.View>
  );
}

function TimetableBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const q = useTimetable(child.id);
  const now = useNow();
  const t = useT();
  const locale = useLocale();
  const [picked, setPicked] = useState<number | null>(null);
  const today = weekdayIndex(now);
  const selected = picked ?? defaultDayIndex(now);

  const byDay = useMemo(() => groupByDay(q.data ?? []), [q.data]);
  const options = useMemo<SegmentOption<string>[]>(
    () =>
      SCHOOL_DAYS.map((d) => {
        const names = schoolDayNames(locale, d.index);
        return { key: String(d.index), label: names.short, spoken: d.index === today ? t('learn.timetable.dayToday', { day: names.long }) : names.long, dot: d.index === today };
      }),
    [today, locale, t],
  );

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;

  if (q.data.length === 0) {
    return (
      <>
        <ChildChips items={all} selectedId={child.id} />
        <EmptyState title={t('learn.timetable.notAdded')} message={t('learn.timetable.notAddedMessage', { name: firstName(child.name) })} />
      </>
    );
  }

  const dayName = schoolDayNames(locale, selected).long;
  const daySlots = byDay.get(selected) ?? [];
  const nowIndex = selected === today ? currentSlotIndex(daySlots, now) : -1;
  const classes = periodCount(daySlots);

  return (
    <>
      <ChildChips items={all} selectedId={child.id} />
      <Reveal index={0}>
        <Segmented options={options} value={String(selected)} onChange={(key) => setPicked(Number(key))} label={t('learn.timetable.dayOfWeek')} />
      </Reveal>
      <LearnSectionTitle
        title={selected === today ? t('learn.timetable.dayToday', { day: dayName }) : dayName}
        caption={classes > 0 ? t('learn.timetable.classes', { count: classes }) : null}
      />
      {daySlots.length === 0 ? (
        <Animated.View key={selected} entering={enterFade()}>
          <Card>
            <EmptyState title={t('learn.timetable.noClasses', { day: dayName })} message={t('learn.timetable.noClassesMessage')} />
          </Card>
        </Animated.View>
      ) : (
        <View key={selected} style={{ gap: 10 }}>
          {daySlots.map((slot, i) =>
            slot.isBreak ? (
              <BreakRow key={`${slot.period}-${slot.start}`} slot={slot} now={i === nowIndex} index={i} />
            ) : (
              <PeriodCard key={`${slot.period}-${slot.start}`} slot={slot} now={i === nowIndex} index={i} />
            ),
          )}
        </View>
      )}
      <AppText variant="caption" style={{ fontSize: 13, paddingHorizontal: 4 }}>
        {t('learn.timetable.footnote')}
      </AppText>
    </>
  );
}

export default function TimetableScreen() {
  const t = useT();
  const refresh = usePullRefresh();
  const { child } = useChildren();
  const subtitle = child ? [firstName(child.name), child.className, t('learn.timetable.thisWeek')].filter(Boolean).join(', ') : undefined;
  return (
    <CollapsingScreen {...refresh} title={t('learn.timetable.title')} subtitle={subtitle} leading={<BackButton />}>
      <ChildGate>{(selected, all) => <TimetableBody child={selected} all={all} />}</ChildGate>
    </CollapsingScreen>
  );
}

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    period: {
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 18,
      flexDirection: 'row',
      ...shadow.card,
    },
    periodNow: { backgroundColor: colors.accentTint },
    periodTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    nowTag: { flexDirection: 'row', alignItems: 'center', gap: 2, marginVertical: -8 },
    breakRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32, paddingHorizontal: 4 },
    breakLine: { flex: 1, height: 1, backgroundColor: colors.border },
    breakLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  });
