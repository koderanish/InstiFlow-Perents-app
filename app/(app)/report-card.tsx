import { useLocalSearchParams, useRouter } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';

import { ChildGate } from '@/components/child-gate';
import { usePullRefresh } from '@/components/learn/hooks';
import { LearnSectionTitle } from '@/components/learn/learn-parts';
import { AppText, BackHeader, Card, Chip, Display, EmptyState, ErrorState, ListCard, Loading, PrimaryButton, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useChildren, useResults } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { firstName } from '@/lib/format';
import { formatMarks, marksSummary, percentLabel, reportCardText, resultBadge, resultPercent } from '@/lib/results';
import { colors, fonts } from '@/theme';
import type { ExamResult, ParentChild, SubjectResult } from '@/types/parent';

const marksOutOf = (marks: number | null, max: number | null): string =>
  marks === null ? '—' : max !== null ? `${formatMarks(marks)} / ${formatMarks(max)}` : formatMarks(marks);

function SubjectRow({ subject }: { subject: SubjectResult }) {
  const spoken = `${subject.name}, ${marksOutOf(subject.marks, subject.maxMarks)}${subject.grade ? `, grade ${subject.grade}` : ''}`;
  return (
    <View accessible accessibilityLabel={spoken} style={[styles.row, styles.rowDivider]}>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{subject.name}</AppText>
        {subject.remarks ? (
          <AppText variant="caption" style={{ fontSize: 13, marginTop: 2 }}>
            {subject.remarks}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" style={styles.marksCol}>
        {marksOutOf(subject.marks, subject.maxMarks)}
      </AppText>
      <AppText style={styles.gradeCol}>{subject.grade ?? '—'}</AppText>
    </View>
  );
}

function ReportCard({ child, result }: { child: ParentChild; result: ExamResult }) {
  const badge = resultBadge(result);
  const percent = resultPercent(result);
  const remarks = result.remarks?.trim();

  const share = async () => {
    try {
      await Share.share({ message: reportCardText({ schoolName: SCHOOL.name, studentName: child.name, className: child.className || null, result }) });
    } catch {
      // The share sheet failing to open is not something a parent can fix; they can simply try again.
    }
  };

  return (
    <>
      <Card>
        <View style={styles.schoolRow}>
          <View style={styles.logo}>
            <AppText style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.accentInk }}>{SCHOOL.shortName}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="heading">{SCHOOL.name}</AppText>
            <AppText variant="caption" style={{ fontSize: 13 }}>
              {result.name}
            </AppText>
          </View>
        </View>
        <View style={styles.studentRow}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 18 }}>{child.name}</AppText>
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {[child.className, child.admissionNo ? `Admission no. ${child.admissionNo}` : null].filter(Boolean).join(', ')}
          </AppText>
        </View>
      </Card>

      <Card hero style={{ padding: 22 }}>
        <View style={styles.heroTop}>
          <Display style={{ fontSize: 56, lineHeight: 62, letterSpacing: -1.1 }}>{percentLabel(percent)}</Display>
          {badge ? <Chip label={badge.label} tone={badge.tone} /> : null}
        </View>
        <AppText variant="caption" style={{ fontSize: 15, marginTop: 12 }}>
          {marksSummary(result)}
        </AppText>
      </Card>

      {result.subjects.length > 0 ? (
        <ListCard>
          <View style={[styles.row, styles.rowDivider]}>
            <AppText variant="caption" style={{ flex: 1, fontSize: 13 }}>
              Subject
            </AppText>
            <AppText variant="caption" style={[styles.marksCol, { fontSize: 13 }]}>
              Marks
            </AppText>
            <AppText variant="caption" style={[styles.gradeCol, { fontSize: 13, fontFamily: fonts.body, color: colors.muted }]}>
              Grade
            </AppText>
          </View>
          {result.subjects.map((s, i) => (
            <SubjectRow key={`${s.name}-${i}`} subject={s} />
          ))}
          <View accessible accessibilityLabel={`Total, ${marksOutOf(result.totalMarks, result.maxTotal)}${result.grade ? `, grade ${result.grade}` : ''}`} style={[styles.row, styles.totalRow]}>
            <AppText style={{ flex: 1, fontFamily: fonts.bold, fontSize: 16 }}>Total</AppText>
            <AppText style={[styles.marksCol, { fontFamily: fonts.semibold, color: colors.ink }]}>{marksOutOf(result.totalMarks, result.maxTotal)}</AppText>
            <AppText style={styles.gradeCol}>{result.grade ?? '—'}</AppText>
          </View>
        </ListCard>
      ) : null}

      {remarks ? (
        <View style={{ gap: 20 }}>
          <LearnSectionTitle title={`Teacher's remarks`} />
          <Card style={{ padding: 18 }}>
            <AppText style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: '#3B352F' }}>{remarks}</AppText>
          </Card>
        </View>
      ) : null}

      <PrimaryButton label="Share report card" onPress={() => void share()} />
    </>
  );
}

function ReportCardBody({ child, examId }: { child: ParentChild; examId: number }) {
  const q = useResults(child.id);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  const result = q.data.results.find((r) => r.id === examId);
  if (!result) {
    return <EmptyState title="Report card not available" message="We could not find this report card. It may not be published yet. Please contact the school office." />;
  }
  return <ReportCard child={child} result={result} />;
}

export default function ReportCardScreen() {
  const router = useRouter();
  const refresh = usePullRefresh();
  const params = useLocalSearchParams<{ examId?: string }>();
  const examId = Number(params.examId);
  const { child } = useChildren();
  const results = useResults(child?.id);
  const result = results.data?.results.find((r) => r.id === examId);
  const subtitle = child ? [firstName(child.name), child.className, result?.name].filter(Boolean).join(', ') : undefined;
  return (
    <Screen {...refresh} header={<BackHeader title="Report card" subtitle={subtitle} onBack={() => router.back()} />}>
      <ChildGate>{(selected) => <ReportCardBody child={selected} examId={examId} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  studentRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  heroTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  totalRow: { backgroundColor: colors.accentTint, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  marksCol: { minWidth: 76, textAlign: 'right', fontSize: 15 },
  gradeCol: { minWidth: 44, textAlign: 'right', fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
});
