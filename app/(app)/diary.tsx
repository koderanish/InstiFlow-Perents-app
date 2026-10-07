import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChildGate } from '@/components/child-gate';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { BackButton } from '@/components/learn/back-button';
import { usePullRefresh } from '@/components/learn/hooks';
import { AppText, Card, EmptyState, ErrorState, Loading } from '@/components/ui';
import { useDiary, useDiaryMonth } from '@/features/parent/hooks';
import { useT, useLocale } from '@/i18n';
import { friendlyError } from '@/lib/errors';
import { groupDiaryBySubject, type DiarySubjectGroup } from '@/lib/diary-group';
import { monthGrid, monthLabel, shiftMonth, weekdayInitials } from '@/lib/calendar';
import { dateKey } from '@/lib/learn-dates';
import { AnimatedBar } from '@/motion/animated-bar';
import { progressFraction } from '@/motion/motion-math';
import { Reveal } from '@/motion/reveal';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

function DiaryCard({ group, index }: { group: DiarySubjectGroup; index: number }) {
  const t = useT();
  const { colors } = useTheme();
  const covered = Math.max(0, ...group.entries.map((e) => progressFraction(e.progress)));
  const time = group.entries.find((e) => (e.time ?? '').trim() !== '')?.time ?? null;
  return (
    <Reveal index={index}>
      <Card>
        <View style={styles.top}>
          <AppText numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 17 }}>
            {group.subject}
          </AppText>
          {time ? (
            <AppText variant="caption" tabular>
              {time}
            </AppText>
          ) : null}
        </View>
        {group.entries.map((entry, i) => {
          // One uniform rule (same as the teacher app): unit + chapter
          // collapse into a breadcrumb, and the topic prints only when it
          // adds something new — never "Varn Vyavastha, Varn Vyavastha".
          const unit = (entry.unitTitle ?? '').trim();
          const chapter = (entry.chapterTitle ?? '').trim();
          const topic = (entry.topic ?? '').trim();
          const breadcrumb = [unit, chapter].filter(Boolean).join(' → ');
          const showTopic = topic !== '' && topic.toLowerCase() !== chapter.toLowerCase();
          const pending = entry.status === 'pending';
          return (
            <View key={i}>
              {pending ? (
                <AppText variant="caption" style={{ fontSize: 12, marginTop: 6, color: colors.accent, fontFamily: fonts.semibold }}>
                  {t('diary.pending')}
                </AppText>
              ) : null}
              {breadcrumb ? <AppText style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>{breadcrumb}</AppText> : null}
              {showTopic ? <AppText style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>{topic}</AppText> : null}
              {entry.homework ? (
                <AppText style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>
                  {t('learn.diary.homeworkLabel')}: {entry.homework}
                </AppText>
              ) : null}
              {entry.notes ? (
                <AppText variant="caption" style={{ fontSize: 14, lineHeight: 21, marginTop: 6, color: colors.muted }}>
                  {entry.notes}
                </AppText>
              ) : null}
            </View>
          );
        })}
        {covered > 0 ? (
          <View accessible accessibilityLabel={t('learn.diary.coveredSpoken', { percent: Math.round(covered * 100) })} style={styles.progress}>
            <AnimatedBar ratio={covered} delay={260} style={{ flex: 1 }} />
            <AppText variant="caption" tabular style={{ fontSize: 13, minWidth: 40, textAlign: 'right' }}>
              {`${Math.round(covered * 100)}%`}
            </AppText>
          </View>
        ) : null}
      </Card>
    </Reveal>
  );
}

/** Monday = 0 weekday index matching the diary/month periods map. */
const weekdayIndex = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number);
  return (new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getDay() + 6) % 7;
};

function DiaryBody({ childId }: { childId: number }) {
  const t = useT();
  const locale = useLocale();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const today = dateKey(new Date());
  const thisMonth = today.slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const [selected, setSelected] = useState(today);

  const monthQuery = useDiaryMonth(childId, month);
  const dayQuery = useDiary(childId, selected);

  const monthData = monthQuery.data;
  const cells = useMemo(
    () => (monthData ? monthGrid(monthData.month, monthData.days.map((d) => ({ date: d, status: 'present' }))) : []),
    [monthData]
  );
  const dotted = useMemo(() => new Set(monthData?.days ?? []), [monthData]);
  const entries = useMemo(() => dayQuery.data?.entries ?? [], [dayQuery]);
  const groups = useMemo(() => groupDiaryBySubject(entries), [entries]);

  const totalPeriods = monthData?.periods?.[String(weekdayIndex(selected))] ?? null;
  const header =
    totalPeriods !== null && totalPeriods > 0
      ? t('diary.updatedOf', { done: entries.length, total: totalPeriods })
      : t('diary.updated', { count: entries.length });

  if (monthQuery.isLoading) return <Loading />;
  if (monthQuery.isError || !monthData) return <ErrorState message={friendlyError(monthQuery.error)} onRetry={() => void monthQuery.refetch()} />;

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <View style={styles.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('learn.diary.prevMonth')} onPress={() => setMonth(shiftMonth(monthData.month, -1))} hitSlop={12} style={styles.monthButton}>
            <AppText style={{ fontSize: 18, color: colors.faint }}>‹</AppText>
          </Pressable>
          <AppText variant="heading" numberOfLines={1}>
            {monthLabel(monthData.month, locale)}
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel={t('learn.diary.nextMonth')} onPress={() => setMonth(shiftMonth(monthData.month, 1))} hitSlop={12} style={styles.monthButton}>
            <AppText style={{ fontSize: 18, color: colors.faint }}>›</AppText>
          </Pressable>
        </View>
        {selected !== today ? (
          <View style={styles.todayRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('learn.diary.today')} onPress={() => { setMonth(thisMonth); setSelected(today); }} hitSlop={8}>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.accentInk }}>{t('learn.diary.today')}</AppText>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.grid}>
          {weekdayInitials(locale).map((w, i) => (
            <View key={`${w}${i}`} style={styles.cell}>
              <AppText variant="caption" style={{ fontSize: 12, fontFamily: fonts.semibold }}>
                {w}
              </AppText>
            </View>
          ))}
          {cells.map((c, i) => (
            <View key={i} style={styles.cell}>
              {c ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${c.day}${dotted.has(`${monthData.month}-${String(c.day).padStart(2, '0')}`) ? `, ${t('learn.diary.hasLog')}` : ''}`}
                  onPress={() => setSelected(`${monthData.month}-${String(c.day).padStart(2, '0')}`)}
                  style={styles.day}
                >
                  <AppText tabular maxFontSizeMultiplier={1.2} style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.ink }}>
                    {c.day}
                  </AppText>
                  {dotted.has(`${monthData.month}-${String(c.day).padStart(2, '0')}`) ? (
                    <View style={[styles.dot, selected === `${monthData.month}-${String(c.day).padStart(2, '0')}` && styles.dotActive]} />
                  ) : (
                    <View style={styles.dotIdle} />
                  )}
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      </Card>

      <AppText variant="caption" style={{ fontSize: 13, fontFamily: fonts.medium }}>
        {header} · {selected}
      </AppText>

      {dayQuery.isLoading ? (
        <Loading />
      ) : dayQuery.isError || !dayQuery.data ? (
        <ErrorState message={friendlyError(dayQuery.error)} onRetry={() => void dayQuery.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState title={t('learn.diary.empty')} message={t('learn.diary.emptyMessage')} icon="book" />
      ) : (
        groups.map((g, i) => <DiaryCard key={`${g.subject}-${i}`} group={g} index={i} />)
      )}
    </View>
  );
}

export default function DiaryScreen() {
  const t = useT();
  const refresh = usePullRefresh();
  return (
    <CollapsingScreen {...refresh} title={t('diary.title')} leading={<BackButton />}>
      <ChildGate>{(child) => <DiaryBody childId={child.id} />}</ChildGate>
    </CollapsingScreen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
});

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    monthButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
    todayRow: { alignItems: 'flex-end', marginBottom: 6 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: '14.28%', height: 46, alignItems: 'center', justifyContent: 'center' },
    day: { width: 38, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    selected: { borderWidth: 2, borderColor: colors.accent },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.goodDot, marginTop: 2 },
    dotActive: { backgroundColor: colors.accentInk },
    dotIdle: { width: 6, height: 6, marginTop: 2 },
  });
