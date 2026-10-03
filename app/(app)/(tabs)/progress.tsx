import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ChildChips } from '@/components/child-chips';
import { ChildGate } from '@/components/child-gate';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { HeroFill, LearnSectionTitle, LearnStatBar, LearnStatTile, LearnTitle, useHeroShell } from '@/components/learn/learn-parts';
import { PercentHero } from '@/components/learn/percent-hero';
import { reportCardHref } from '@/components/learn/routes';
import { AppText, EmptyState, ErrorState, ListCard, ListRow, Loading, Screen } from '@/components/ui';
import { useAttendance, useChildren, useExams, useHomework, useResults } from '@/features/parent/hooks';
import { shortDateParts } from '@/lib/learn-dates';
import { friendlyError } from '@/lib/errors';
import { useLocale, useT } from '@/i18n';
import { buildExamPlan, nextPaperHeadline } from '@/lib/exams';
import { firstName } from '@/lib/format';
import { homeworkCounts } from '@/lib/homework';
import { formatMarks, marksSummary, percentLabel, resultBadge, resultPercent, scaleNote, subjectRatio } from '@/lib/results';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { fonts, useTheme } from '@/theme';
import type { ParentChild } from '@/types/parent';

function ProgressBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const results = useResults(child.id);
  const exams = useExams(child.id);
  const attendance = useAttendance(child.id);
  const homework = useHomework(child.id);
  const now = useNow();
  const t = useT();
  const locale = useLocale();
  const { colors } = useTheme();
  const heroShell = useHeroShell();

  const plan = useMemo(() => (exams.data ? buildExamPlan(exams.data.exams, now) : null), [exams.data, now]);
  const counts = useMemo(() => (homework.data ? homeworkCounts(homework.data.items) : null), [homework.data]);

  const attendancePercent = attendance.data?.summary.percent ?? null;
  const nextDate = plan?.next ? shortDateParts(plan.next.paper.date, locale) : null;

  const latest = results.data?.results[0];
  const earlier = results.data?.results.slice(1) ?? [];
  const badge = latest ? resultBadge(latest, t) : null;
  const percent = latest ? resultPercent(latest) : null;
  const note = latest ? scaleNote(latest.subjects, t) : null;

  return (
    <>
      <ChildChips items={all} selectedId={child.id} />

      {results.isLoading ? <Loading /> : null}
      {!results.isLoading && (results.isError || !results.data) ? (
        <ErrorState message={friendlyError(results.error)} onRetry={() => void results.refetch()} />
      ) : null}
      {results.data && !latest ? (
        <EmptyState title={t('learn.progress.noResults')} message={t('learn.progress.noResultsMessage')} />
      ) : null}

      {latest ? (
        <>
          <Reveal index={0}>
            <Link href={reportCardHref(latest.id)} asChild>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t('learn.progress.heroSpoken', { name: latest.name, percent: percentLabel(percent), badge: badge ? `, ${badge.label}` : '' })}
                scaleTo={0.985}
                style={heroShell}
              >
                <HeroFill>
                  <PercentHero percent={percent} badge={badge} summary={marksSummary(latest, t)} hint={t('learn.progress.openReportCard')} />
                </HeroFill>
              </PressableScale>
            </Link>
          </Reveal>

          {latest.subjects.length > 0 ? (
            <Reveal index={1} style={{ gap: 12 }}>
              <ListCard>
                <View style={{ paddingVertical: 6 }}>
                  {latest.subjects.map((s, i) => (
                    <LearnStatBar
                      key={`${s.name}-${i}`}
                      index={i}
                      label={s.name}
                      valueLabel={formatMarks(s.marks)}
                      ratio={subjectRatio(s)}
                      spoken={
                        s.marks === null
                          ? t('learn.progress.subjectNotMarked', { name: s.name })
                          : s.maxMarks !== null
                            ? t('learn.progress.subjectMarksOutOf', { name: s.name, marks: formatMarks(s.marks), max: formatMarks(s.maxMarks) })
                            : t('learn.progress.subjectMarks', { name: s.name, marks: formatMarks(s.marks) })
                      }
                      last={i === latest.subjects.length - 1}
                    />
                  ))}
                </View>
              </ListCard>
              <View style={styles.footnote}>
                {note ? (
                  <AppText variant="caption" style={{ flex: 1, fontSize: 13 }}>
                    {note}
                  </AppText>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                <Link href={reportCardHref(latest.id)} asChild>
                  <PressableScale accessibilityRole="link" accessibilityLabel={t('learn.progress.openReportCard')} hitSlop={8} style={styles.linkButton}>
                    <AppText style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.accentInk }}>{t('learn.progress.reportCard')}</AppText>
                    <Feather name="arrow-right" size={14} color={colors.accentInk} />
                  </PressableScale>
                </Link>
              </View>
            </Reveal>
          ) : null}
        </>
      ) : null}

      <Reveal index={2} style={styles.tiles}>
        <LearnStatTile
          icon="check-circle"
          value={attendancePercent === null ? '—' : `${Math.round(attendancePercent)}%`}
          label={t('learn.progress.attendance')}
          href="/(app)/attendance"
        />
        <LearnStatTile icon="calendar" value={nextDate ? `${nextDate.day} ${nextDate.month}` : t('learn.progress.noneYet')} label={t('learn.progress.nextExam')} href="/(app)/exams" />
      </Reveal>

      {earlier.length > 0 ? (
        <Reveal index={3} style={{ gap: 12 }}>
          <LearnSectionTitle title={t('learn.progress.earlier')} />
          <ListCard>
            {earlier.map((r, i) => {
              const p = resultPercent(r);
              const b = resultBadge(r, t);
              return (
                <ListRow
                  key={r.id}
                  title={r.name}
                  subtitle={b ? b.label : t('learn.progress.tapForReport')}
                  href={reportCardHref(r.id)}
                  last={i === earlier.length - 1}
                  right={
                    <AppText tabular style={{ fontFamily: fonts.semibold, fontSize: 16 }}>
                      {percentLabel(p)}
                    </AppText>
                  }
                />
              );
            })}
          </ListCard>
        </Reveal>
      ) : null}

      <Reveal index={3}>
        <ListCard>
          <ListRow icon="file-text" title={t('learn.exams.title')} subtitle={plan?.next ? nextPaperHeadline(plan.next, t) : t('learn.progress.examsHint')} href="/(app)/exams" />
          <ListRow icon="clock" title={t('learn.timetable.title')} subtitle={t('learn.progress.timetableHint')} href="/(app)/timetable" />
          <ListRow
            icon="book-open"
            title={t('learn.homework.title')}
            subtitle={counts ? (counts.todo > 0 ? t('learn.progress.homeworkTodo', { count: counts.todo }) : t('learn.progress.homeworkNone')) : t('learn.progress.homeworkHint')}
            dot={counts && counts.todo > 0 ? 'warn' : undefined}
            href="/(app)/homework"
            last
          />
        </ListCard>
      </Reveal>
    </>
  );
}

export default function ProgressScreen() {
  const refresh = usePullRefresh();
  const t = useT();
  const { child } = useChildren();
  const results = useResults(child?.id);
  const latestName = results.data?.results[0]?.name;
  const subtitle = child ? [firstName(child.name), latestName].filter(Boolean).join(', ') : null;
  return (
    <Screen {...refresh}>
      <LearnTitle title={t('learn.progress.title')} subtitle={subtitle} />
      <ChildGate>{(selected, all) => <ProgressBody child={selected} all={all} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footnote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: -8, paddingHorizontal: 4 },
  linkButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 8 },
  tiles: { flexDirection: 'row', gap: 12 },
});
