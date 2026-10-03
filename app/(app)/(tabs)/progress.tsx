import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ChildChips } from '@/components/child-chips';
import { ChildGate } from '@/components/child-gate';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { HeroFill, heroShell, LearnSectionTitle, LearnStatBar, LearnStatTile, LearnTitle } from '@/components/learn/learn-parts';
import { PercentHero } from '@/components/learn/percent-hero';
import { reportCardHref } from '@/components/learn/routes';
import { AppText, EmptyState, ErrorState, ListCard, ListRow, Loading, Screen } from '@/components/ui';
import { useAttendance, useChildren, useExams, useHomework, useResults } from '@/features/parent/hooks';
import { shortDateParts } from '@/lib/learn-dates';
import { friendlyError } from '@/lib/errors';
import { buildExamPlan, nextPaperHeadline } from '@/lib/exams';
import { firstName } from '@/lib/format';
import { homeworkCounts } from '@/lib/homework';
import { formatMarks, marksSummary, percentLabel, resultBadge, resultPercent, scaleNote, subjectRatio } from '@/lib/results';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { colors, fonts } from '@/theme';
import type { ParentChild } from '@/types/parent';

function ProgressBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const results = useResults(child.id);
  const exams = useExams(child.id);
  const attendance = useAttendance(child.id);
  const homework = useHomework(child.id);
  const now = useNow();

  const plan = useMemo(() => (exams.data ? buildExamPlan(exams.data.exams, now) : null), [exams.data, now]);
  const counts = useMemo(() => (homework.data ? homeworkCounts(homework.data.items) : null), [homework.data]);

  const attendancePercent = attendance.data?.summary.percent ?? null;
  const nextDate = plan?.next ? shortDateParts(plan.next.paper.date) : null;

  const latest = results.data?.results[0];
  const earlier = results.data?.results.slice(1) ?? [];
  const badge = latest ? resultBadge(latest) : null;
  const percent = latest ? resultPercent(latest) : null;
  const note = latest ? scaleNote(latest.subjects) : null;

  return (
    <>
      <ChildChips items={all} selectedId={child.id} />

      {results.isLoading ? <Loading /> : null}
      {!results.isLoading && (results.isError || !results.data) ? (
        <ErrorState message={friendlyError(results.error)} onRetry={() => void results.refetch()} />
      ) : null}
      {results.data && !latest ? (
        <EmptyState title="No results yet" message="Results will appear here once the school publishes them." />
      ) : null}

      {latest ? (
        <>
          <Reveal index={0}>
            <Link href={reportCardHref(latest.id)} asChild>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`${latest.name}: ${percentLabel(percent)}${badge ? `, ${badge.label}` : ''}. Open report card`}
                scaleTo={0.985}
                style={heroShell}
              >
                <HeroFill>
                  <PercentHero percent={percent} badge={badge} summary={marksSummary(latest)} hint="Open report card" />
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
                      spoken={s.marks === null ? `${s.name}, not marked` : `${s.name}, ${formatMarks(s.marks)}${s.maxMarks !== null ? ` out of ${formatMarks(s.maxMarks)}` : ''}`}
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
                  <PressableScale accessibilityRole="link" accessibilityLabel="Open report card" hitSlop={8} style={styles.linkButton}>
                    <AppText style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.accentInk }}>Report card</AppText>
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
          label="Attendance"
          href="/(app)/attendance"
        />
        <LearnStatTile icon="calendar" value={nextDate ? `${nextDate.day} ${nextDate.month}` : 'None yet'} label="Next exam" href="/(app)/exams" />
      </Reveal>

      {earlier.length > 0 ? (
        <Reveal index={3} style={{ gap: 12 }}>
          <LearnSectionTitle title="Earlier exams" />
          <ListCard>
            {earlier.map((r, i) => {
              const p = resultPercent(r);
              const b = resultBadge(r);
              return (
                <ListRow
                  key={r.id}
                  title={r.name}
                  subtitle={b ? b.label : 'Tap to see the report card'}
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
          <ListRow icon="file-text" title="Exams" subtitle={plan?.next ? nextPaperHeadline(plan.next) : 'Date sheet and past papers'} href="/(app)/exams" />
          <ListRow icon="clock" title="Timetable" subtitle="Classes through the week" href="/(app)/timetable" />
          <ListRow
            icon="book-open"
            title="Homework"
            subtitle={counts ? (counts.todo > 0 ? `${counts.todo} to do` : 'Nothing waiting') : 'Set by the teachers'}
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
  const { child } = useChildren();
  const results = useResults(child?.id);
  const latestName = results.data?.results[0]?.name;
  const subtitle = child ? [firstName(child.name), latestName].filter(Boolean).join(', ') : null;
  return (
    <Screen {...refresh}>
      <LearnTitle title="Progress" subtitle={subtitle} />
      <ChildGate>{(selected, all) => <ProgressBody child={selected} all={all} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footnote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: -8, paddingHorizontal: 4 },
  linkButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 8 },
  tiles: { flexDirection: 'row', gap: 12 },
});
