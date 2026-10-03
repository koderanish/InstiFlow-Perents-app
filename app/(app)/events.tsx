import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CollapsingScreen } from '@/components/collapsing-screen';
import { BackButton } from '@/components/learn/back-button';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { LearnSectionTitle, RotatingChevron } from '@/components/learn/learn-parts';
import { AppText, EmptyState, ErrorState, ListCard, Loading } from '@/components/ui';
import { useChildren, useEvents } from '@/features/parent/hooks';
import { useLocale, useT, type Locale, type TFunction } from '@/i18n';
import { monthName } from '@/i18n/names';
import { friendlyError } from '@/lib/errors';
import { buildEventPlan, type MonthGroup, type SchoolEvent } from '@/lib/events';
import { clockFromTime, dayMonth } from '@/lib/format';
import { shortDateParts } from '@/lib/learn-dates';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

const timeLine = (e: SchoolEvent, t: TFunction, locale: Locale): string | null => {
  const start = clockFromTime(e.startTime, locale);
  const end = clockFromTime(e.endTime, locale);
  if (start && end) return t('events.timeRange', { start, end });
  if (start) return t('events.timeFrom', { start });
  if (end) return t('events.timeUntil', { end });
  return null;
};

const monthTitle = (group: MonthGroup, locale: Locale, t: TFunction): string =>
  t('events.monthHeader', { month: monthName(locale, group.month) ?? '', year: group.year });

function EventRow({ event, past, last }: { event: SchoolEvent; past: boolean; last: boolean }) {
  const t = useT();
  const locale = useLocale();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const parts = shortDateParts(event.date, locale);
  const time = timeLine(event, t, locale);
  const spoken = t('events.cardLabel', {
    title: event.title,
    when: dayMonth(event.date, locale) ?? event.date,
    time: time ? `, ${time}` : '',
    place: event.location ? `, ${event.location}` : '',
  });
  const ink = past ? colors.muted : colors.accentInk;
  return (
    <View accessible accessibilityLabel={spoken} style={[styles.row, !last && styles.divider, past && { opacity: 0.6 }]}>
      <View style={[styles.dateTile, past && { backgroundColor: colors.divider }]}>
        <AppText tabular style={{ fontFamily: fonts.bold, fontSize: 20, lineHeight: 22, color: ink }}>
          {parts?.day ?? '–'}
        </AppText>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, marginTop: 2, color: ink }}>{parts?.month ?? ''}</AppText>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{event.title}</AppText>
        {time ? (
          <AppText variant="caption" tabular>
            {time}
          </AppText>
        ) : null}
        {event.location ? <AppText variant="caption">{event.location}</AppText> : null}
        {event.description ? (
          <AppText variant="caption" numberOfLines={3} ellipsizeMode="tail" style={{ fontSize: 13, color: colors.faint, marginTop: 2 }}>
            {event.description}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function MonthSection({ group, past, index }: { group: MonthGroup; past: boolean; index: number }) {
  const locale = useLocale();
  const t = useT();
  return (
    <Reveal index={index} style={{ gap: 20 }}>
      <LearnSectionTitle title={monthTitle(group, locale, t)} />
      <ListCard>
        {group.events.map((e, i) => (
          <EventRow key={e.id} event={e} past={past} last={i === group.events.length - 1} />
        ))}
      </ListCard>
    </Reveal>
  );
}

function PastEvents({ groups, count }: { groups: MonthGroup[]; count: number }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 20 }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${t('events.past', { count })}. ${open ? t('events.hidePast') : t('events.showPast')}`}
        onPress={() => setOpen((v) => !v)}
        style={styles.pastToggle}
      >
        <AppText variant="heading" style={{ flex: 1 }}>
          {t('events.past', { count })}
        </AppText>
        <RotatingChevron open={open} />
      </PressableScale>
      {open ? groups.map((g, i) => <MonthSection key={g.key} group={g} past index={i} />) : null}
    </View>
  );
}

function EventsBody({ studentId }: { studentId: number | undefined }) {
  const q = useEvents(studentId);
  const now = useNow();
  const t = useT();
  const plan = useMemo(() => (q.data ? buildEventPlan(q.data, now) : null), [q.data, now]);

  if (q.isLoading) return <Loading label={t('common.loading')} />;
  if (q.isError || !plan) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;

  return (
    <>
      {plan.upcoming.length === 0 ? (
        <EmptyState icon="calendar" title={t('events.none')} message={t('events.noneMessage')} />
      ) : (
        plan.upcoming.map((g, i) => <MonthSection key={g.key} group={g} past={false} index={i} />)
      )}
      {plan.pastCount > 0 ? <PastEvents groups={plan.past} count={plan.pastCount} /> : null}
    </>
  );
}

export default function EventsScreen() {
  const t = useT();
  const refresh = usePullRefresh();
  const { child, isLoading } = useChildren();
  return (
    <CollapsingScreen {...refresh} title={t('events.title')} leading={<BackButton />}>
      {isLoading ? <Loading label={t('common.loading')} /> : <EventsBody studentId={child?.id} />}
    </CollapsingScreen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingHorizontal: 18, paddingVertical: 16 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    dateTile: { width: 52, minHeight: 56, borderRadius: 16, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
    pastToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 4, minHeight: 44 },
  });
