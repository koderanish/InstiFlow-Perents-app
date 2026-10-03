import { useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BackButton } from '@/components/learn/back-button';
import { ChildGate } from '@/components/child-gate';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { usePullRefresh } from '@/components/learn/hooks';
import { HeroSurface, LearnSectionTitle } from '@/components/learn/learn-parts';
import { PercentHero } from '@/components/learn/percent-hero';
import { AppText, Card, EmptyState, ErrorState, ListCard, Loading, PrimaryButton } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useChildren, useResults } from '@/features/parent/hooks';
import { useT } from '@/i18n';
import { friendlyError } from '@/lib/errors';
import { firstName } from '@/lib/format';
import { formatMarks, marksSummary, reportCardText, resultBadge, resultPercent } from '@/lib/results';
import { successHaptic } from '@/motion/haptics';
import { CountUp } from '@/motion/count-up';
import { enterFade, enterRise } from '@/motion/presets';
import { Reveal } from '@/motion/reveal';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';
import type { ExamResult, ParentChild, SubjectResult } from '@/types/parent';

const marksOutOf = (marks: number | null, max: number | null): string =>
  marks === null ? '—' : max !== null ? `${formatMarks(marks)} / ${formatMarks(max)}` : formatMarks(marks);

function SubjectRow({ subject, index }: { subject: SubjectResult; index: number }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const marksText = `${subject.name}, ${marksOutOf(subject.marks, subject.maxMarks)}`;
  const spoken = subject.grade ? t('learn.reportCard.spokenGrade', { text: marksText, grade: subject.grade }) : marksText;
  return (
    <Animated.View entering={enterRise(index)} accessible accessibilityLabel={spoken} style={[styles.row, styles.rowDivider]}>
      <View style={{ flex: 1 }}>
        <AppText numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: fonts.semibold, fontSize: 16 }}>
          {subject.name}
        </AppText>
        {subject.remarks ? (
          <AppText variant="caption" style={{ fontSize: 13, marginTop: 2 }}>
            {subject.remarks}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" tabular style={styles.marksCol}>
        {marksOutOf(subject.marks, subject.maxMarks)}
      </AppText>
      <AppText style={styles.gradeCol}>{subject.grade ?? '—'}</AppText>
    </Animated.View>
  );
}

function ReportCard({ child, result }: { child: ParentChild; result: ExamResult }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const badge = resultBadge(result, t);
  const percent = resultPercent(result);
  const remarks = result.remarks?.trim();

  const share = async () => {
    try {
      const outcome = await Share.share({
        message: reportCardText({ schoolName: SCHOOL.name, studentName: child.name, className: child.className || null, result }, t),
      });
      if (outcome.action === Share.sharedAction) successHaptic();
    } catch {
      // The share sheet failing to open is not something a parent can fix; they can simply try again.
    }
  };

  const rows = result.subjects.length;

  return (
    <>
      <Reveal index={0}>
        <Card>
          <View style={styles.schoolRow}>
            <View style={styles.logo}>
              <AppText numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.accentInk }}>
                {SCHOOL.shortName}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="heading" numberOfLines={2} ellipsizeMode="tail">
                {SCHOOL.name}
              </AppText>
              <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13 }}>
                {result.name}
              </AppText>
            </View>
          </View>
          <View style={styles.studentRow}>
            <AppText numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: fonts.semibold, fontSize: 18 }}>
              {child.name}
            </AppText>
            <AppText variant="caption" style={{ marginTop: 2 }}>
              {[child.className, child.admissionNo ? t('learn.reportCard.admissionNo', { no: child.admissionNo }) : null].filter(Boolean).join(', ')}
            </AppText>
          </View>
        </Card>
      </Reveal>

      <Reveal index={1}>
        <HeroSurface padding={22}>
          <PercentHero percent={percent} badge={badge} summary={marksSummary(result, t)} size={104} numeralSize={30} />
        </HeroSurface>
      </Reveal>

      {rows > 0 ? (
        <Animated.View entering={enterFade(2)}>
          <ListCard>
            <View style={[styles.row, styles.rowDivider]}>
              <AppText variant="caption" style={{ flex: 1, fontSize: 13 }}>
                {t('learn.reportCard.subject')}
              </AppText>
              <AppText variant="caption" style={[styles.marksCol, { fontSize: 13 }]}>
                {t('learn.reportCard.marks')}
              </AppText>
              <AppText variant="caption" style={[styles.gradeCol, { fontSize: 13, fontFamily: fonts.body, color: colors.muted }]}>
                {t('learn.reportCard.grade')}
              </AppText>
            </View>
            {result.subjects.map((s, i) => (
              <SubjectRow key={`${s.name}-${i}`} subject={s} index={i + 2} />
            ))}
            <Animated.View
              entering={enterRise(rows + 2)}
              accessible
              accessibilityLabel={
                result.grade
                  ? t('learn.reportCard.spokenGrade', { text: t('learn.reportCard.totalSpoken', { text: marksOutOf(result.totalMarks, result.maxTotal) }), grade: result.grade })
                  : t('learn.reportCard.totalSpoken', { text: marksOutOf(result.totalMarks, result.maxTotal) })
              }
              style={[styles.row, styles.totalRow]}
            >
              <AppText style={{ flex: 1, fontFamily: fonts.bold, fontSize: 16 }}>{t('learn.reportCard.total')}</AppText>
              <AppText tabular style={[styles.marksCol, { fontFamily: fonts.semibold, color: colors.ink }]}>
                {result.totalMarks === null ? (
                  '—'
                ) : (
                  <>
                    <CountUp value={result.totalMarks} delay={400} format={(n) => formatMarks(n)} />
                    {result.maxTotal !== null ? ` / ${formatMarks(result.maxTotal)}` : ''}
                  </>
                )}
              </AppText>
              <AppText style={styles.gradeCol}>{result.grade ?? '—'}</AppText>
            </Animated.View>
          </ListCard>
        </Animated.View>
      ) : null}

      {remarks ? (
        <Reveal index={3} style={{ gap: 20 }}>
          <LearnSectionTitle title={t('learn.reportCard.remarks')} />
          <Card style={{ padding: 18 }}>
            <AppText style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink }}>{remarks}</AppText>
          </Card>
        </Reveal>
      ) : null}

      <Reveal index={4}>
        <PrimaryButton label={t('learn.reportCard.share')} onPress={() => void share()} />
      </Reveal>
    </>
  );
}

function ReportCardBody({ child, examId }: { child: ParentChild; examId: number }) {
  const q = useResults(child.id);
  const t = useT();
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  const result = q.data.results.find((r) => r.id === examId);
  if (!result) {
    return <EmptyState title={t('learn.reportCard.unavailable')} message={t('learn.reportCard.unavailableMessage')} />;
  }
  return <ReportCard child={child} result={result} />;
}

export default function ReportCardScreen() {
  const t = useT();
  const refresh = usePullRefresh();
  const params = useLocalSearchParams<{ examId?: string }>();
  const examId = Number(params.examId);
  const { child } = useChildren();
  const results = useResults(child?.id);
  const result = results.data?.results.find((r) => r.id === examId);
  const subtitle = child ? [firstName(child.name), child.className, result?.name].filter(Boolean).join(', ') : undefined;
  return (
    <CollapsingScreen {...refresh} title={t('learn.reportCard.title')} subtitle={subtitle} leading={<BackButton />}>
      <ChildGate>{(selected) => <ReportCardBody child={selected} examId={examId} />}</ChildGate>
    </CollapsingScreen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
    studentRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.divider },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 14 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    totalRow: { backgroundColor: colors.accentTint, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    marksCol: { minWidth: 76, textAlign: 'right', fontSize: 15 },
    gradeCol: { minWidth: 44, textAlign: 'right', fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  });
