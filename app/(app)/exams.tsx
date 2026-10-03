import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChildChips } from '@/components/child-chips';
import { ChildGate } from '@/components/child-gate';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { LearnSectionTitle } from '@/components/learn/learn-parts';
import { AppText, BackHeader, Card, EmptyState, ErrorState, ListCard, ListRow, Loading, Screen } from '@/components/ui';
import { useChildren, useExams } from '@/features/parent/hooks';
import { shortDateParts } from '@/lib/dates';
import { friendlyError } from '@/lib/errors';
import { buildExamPlan, daysToGo, nextPaperHeadline, paperNoteLine, paperTimeLine, paperWhen, seriesRange, type PaperView } from '@/lib/exams';
import { firstName } from '@/lib/format';
import { colors, fonts } from '@/theme';
import type { ParentChild } from '@/types/parent';

function PaperRow({ view, last }: { view: PaperView; last: boolean }) {
  const { paper, past, daysAway } = view;
  const parts = shortDateParts(paper.date);
  const time = paperTimeLine(paper);
  const note = paperNoteLine(paper);
  const when = daysAway !== null && daysAway >= 0 && daysAway <= 1 ? daysToGo(daysAway) : null;
  const spoken = [paper.subject, paperWhen(paper), note, past ? 'finished' : when].filter(Boolean).join(', ');
  return (
    <View accessible accessibilityLabel={spoken} style={[styles.paper, !last && styles.paperDivider, past && { opacity: 0.55 }]}>
      <View style={[styles.dateTile, past && { backgroundColor: colors.divider }]}>
        <AppText style={{ fontFamily: fonts.bold, fontSize: 20, lineHeight: 22, color: past ? colors.muted : colors.accentInk }}>{parts?.day ?? '–'}</AppText>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, marginTop: 2, color: past ? colors.muted : colors.accentInk }}>{parts?.month ?? ''}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{paper.subject}</AppText>
        {time ? (
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {time}
          </AppText>
        ) : null}
        {note ? (
          <AppText variant="caption" style={{ fontSize: 13, color: colors.faint, marginTop: 2 }}>
            {note}
          </AppText>
        ) : null}
      </View>
      {!past && when ? (
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.warnFg, textTransform: 'capitalize' }}>{when}</AppText>
      ) : null}
      {past ? (
        <AppText variant="caption" style={{ fontSize: 13 }}>
          Done
        </AppText>
      ) : null}
    </View>
  );
}

function ExamsBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const q = useExams(child.id);
  const now = useNow();
  const plan = useMemo(() => (q.data ? buildExamPlan(q.data.exams, now) : null), [q.data, now]);

  if (q.isLoading) return <Loading />;
  if (q.isError || !plan) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;

  return (
    <>
      <ChildChips items={all} selectedId={child.id} />

      {plan.next ? (
        <Card hero style={{ padding: 22 }}>
          <AppText variant="caption" style={{ fontSize: 13, fontFamily: fonts.medium }}>
            Next paper
          </AppText>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, marginTop: 6 }}>{nextPaperHeadline(plan.next)}</AppText>
          <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>
            {paperWhen(plan.next.paper)}
          </AppText>
          <AppText variant="caption" style={{ fontSize: 13, marginTop: 4 }}>
            {plan.next.series.name}
          </AppText>
        </Card>
      ) : null}

      {plan.series.length === 0 ? (
        <EmptyState title="No exams scheduled" message="The date sheet will appear here once the school adds it." />
      ) : (
        plan.series.map((s) => (
          <View key={s.series.id} style={{ gap: 20 }}>
            <LearnSectionTitle title={s.series.name} caption={seriesRange(s.series)} />
            {s.papers.length === 0 ? (
              <Card>
                <AppText variant="caption">Papers for this exam have not been added yet.</AppText>
              </Card>
            ) : (
              <ListCard>
                {s.papers.map((p, i) => (
                  <PaperRow key={p.paper.id} view={p} last={i === s.papers.length - 1} />
                ))}
              </ListCard>
            )}
          </View>
        ))
      )}

      <ListCard>
        <ListRow title="Past results" subtitle="Marks and report cards" href="/(app)/(tabs)/progress" last />
      </ListCard>
    </>
  );
}

export default function ExamsScreen() {
  const router = useRouter();
  const refresh = usePullRefresh();
  const { child } = useChildren();
  const subtitle = child ? [firstName(child.name), child.className].filter(Boolean).join(', ') : undefined;
  return (
    <Screen {...refresh} header={<BackHeader title="Exams" subtitle={subtitle} onBack={() => router.back()} />}>
      <ChildGate>{(selected, all) => <ExamsBody child={selected} all={all} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  paper: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, paddingVertical: 16 },
  paperDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  dateTile: { width: 52, minHeight: 56, borderRadius: 16, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
});
