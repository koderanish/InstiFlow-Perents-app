import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChildChips } from '@/components/child-chips';
import { ChildGate } from '@/components/child-gate';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { LearnSectionTitle, LearnStatBar, LearnStatTile, LearnTitle } from '@/components/learn/learn-parts';
import { reportCardHref } from '@/components/learn/routes';
import { AppText, Card, Chip, Display, EmptyState, ErrorState, ListCard, ListRow, Loading, Screen } from '@/components/ui';
import { useAttendance, useChildren, useExams, useHomework, useResults } from '@/features/parent/hooks';
import { shortDateParts } from '@/lib/dates';
import { friendlyError } from '@/lib/errors';
import { buildExamPlan, nextPaperHeadline } from '@/lib/exams';
import { firstName } from '@/lib/format';
import { homeworkCounts } from '@/lib/homework';
import { formatMarks, marksSummary, percentLabel, resultBadge, resultPercent, scaleNote, subjectRatio } from '@/lib/results';
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
          <Link href={reportCardHref(latest.id)} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${latest.name}: ${percentLabel(percent)}${badge ? `, ${badge.label}` : ''}. Open report card`}
            >
              <Card hero>
                <View style={styles.heroTop}>
                  <Display style={{ fontSize: 72, lineHeight: 80, letterSpacing: -1.4 }}>{percentLabel(percent)}</Display>
                  {badge ? <Chip label={badge.label} tone={badge.tone} /> : null}
                </View>
                <AppText variant="caption" style={{ fontSize: 15, marginTop: 14 }}>
                  {marksSummary(latest)}
                </AppText>
              </Card>
            </Pressable>
          </Link>

          {latest.subjects.length > 0 ? (
            <>
              <ListCard>
                <View style={{ paddingVertical: 6 }}>
                  {latest.subjects.map((s, i) => (
                    <LearnStatBar
                      key={`${s.name}-${i}`}
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
                  <Pressable accessibilityRole="link" accessibilityLabel="Open report card" style={styles.linkButton}>
                    <AppText style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.accentInk }}>Report card</AppText>
                  </Pressable>
                </Link>
              </View>
            </>
          ) : null}
        </>
      ) : null}

      <View style={styles.tiles}>
        <LearnStatTile value={attendancePercent === null ? '—' : `${Math.round(attendancePercent)}%`} label="Attendance" href="/(app)/attendance" />
        <LearnStatTile value={nextDate ? `${nextDate.day} ${nextDate.month}` : 'None yet'} label="Next exam" href="/(app)/exams" />
      </View>

      {earlier.length > 0 ? (
        <>
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
                  right={<AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{percentLabel(p)}</AppText>}
                />
              );
            })}
          </ListCard>
        </>
      ) : null}

      <ListCard>
        <ListRow title="Exams" subtitle={plan?.next ? nextPaperHeadline(plan.next) : 'Date sheet and past papers'} href="/(app)/exams" />
        <ListRow title="Timetable" subtitle="Classes through the week" href="/(app)/timetable" />
        <ListRow
          title="Homework"
          subtitle={counts ? (counts.todo > 0 ? `${counts.todo} to do` : 'Nothing waiting') : 'Set by the teachers'}
          dot={counts && counts.todo > 0 ? 'warn' : undefined}
          href="/(app)/homework"
          last
        />
      </ListCard>
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
  heroTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  footnote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: -8, paddingHorizontal: 4 },
  linkButton: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  tiles: { flexDirection: 'row', gap: 12 },
});
