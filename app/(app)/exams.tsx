import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChildChips } from '@/components/child-chips';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { ChildGate } from '@/components/child-gate';
import { BackButton } from '@/components/learn/back-button';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { HeroSurface, LearnSectionTitle } from '@/components/learn/learn-parts';
import { AppText, Card, EmptyState, ErrorState, ListCard, ListRow, Loading } from '@/components/ui';
import { useChildren, useExams } from '@/features/parent/hooks';
import { shortDateParts } from '@/lib/learn-dates';
import { useLocale, useT } from '@/i18n';
import { friendlyError } from '@/lib/errors';
import { buildExamPlan, daysToGo, nextPaperHeadline, paperNoteLine, paperTimeLine, paperWhen, seriesRange, type NextPaper, type PaperView } from '@/lib/exams';
import { firstName } from '@/lib/format';
import { CountUp } from '@/motion/count-up';
import { Reveal } from '@/motion/reveal';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';
import type { ParentChild } from '@/types/parent';

function PaperRow({ view, last }: { view: PaperView; last: boolean }) {
  const t = useT();
  const locale = useLocale();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const { paper, past, daysAway } = view;
  const parts = shortDateParts(paper.date, locale);
  const time = paperTimeLine(paper, t, locale);
  const note = paperNoteLine(paper, t);
  const when = daysAway !== null && daysAway >= 0 && daysAway <= 1 ? daysToGo(daysAway, t) : null;
  const spoken = [paper.subject, paperWhen(paper, locale), note, past ? t('learn.exams.finished') : when].filter(Boolean).join(', ');
  return (
    <View accessible accessibilityLabel={spoken} style={[styles.paper, !last && styles.paperDivider, past && { opacity: 0.55 }]}>
      <View style={[styles.dateTile, past && { backgroundColor: colors.divider }]}>
        <AppText tabular style={{ fontFamily: fonts.bold, fontSize: 20, lineHeight: 22, color: past ? colors.muted : colors.accentInk }}>
          {parts?.day ?? '–'}
        </AppText>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, marginTop: 2, color: past ? colors.muted : colors.accentInk }}>{parts?.month ?? ''}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: fonts.semibold, fontSize: 16 }}>
          {paper.subject}
        </AppText>
        {time ? (
          <AppText variant="caption" tabular style={{ marginTop: 2 }}>
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
          {t('learn.exams.done')}
        </AppText>
      ) : null}
    </View>
  );
}

/** Days-to-go counts up; "today" and "tomorrow" read better as words, so those do not count. */
function NextPaperHero({ next }: { next: NextPaper }) {
  const t = useT();
  const locale = useLocale();
  const styles = useStyles(createStyles);
  const soon = next.days <= 1;
  const spoken = t('learn.exams.heroSpoken', { headline: nextPaperHeadline(next, t), when: paperWhen(next.paper, locale), series: next.series.name });
  return (
    <HeroSurface padding={22}>
      <View accessible accessibilityLabel={spoken} style={styles.hero}>
        <View style={styles.countCol}>
          {soon ? (
            <AppText maxFontSizeMultiplier={1.2} style={styles.countWord}>
              {next.days <= 0 ? t('common.today') : t('common.tomorrow')}
            </AppText>
          ) : (
            <>
              <CountUp value={next.days} delay={150} maxFontSizeMultiplier={1.15} style={styles.countNumber} />
              <AppText variant="caption" style={{ fontSize: 13, fontFamily: fonts.medium }}>
                {t('learn.exams.daysToGoLabel')}
              </AppText>
            </>
          )}
        </View>
        <View style={styles.heroDivider} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption" style={{ fontSize: 13, fontFamily: fonts.medium }}>
            {t('learn.exams.nextPaper')}
          </AppText>
          <AppText numberOfLines={2} ellipsizeMode="tail" style={{ fontFamily: fonts.semibold, fontSize: 22, lineHeight: 26, letterSpacing: -0.4, marginTop: 4 }}>
            {next.paper.subject}
          </AppText>
          <AppText variant="caption" tabular style={{ fontSize: 15, marginTop: 4 }}>
            {paperWhen(next.paper, locale)}
          </AppText>
          <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, marginTop: 2 }}>
            {next.series.name}
          </AppText>
        </View>
      </View>
    </HeroSurface>
  );
}

function ExamsBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const q = useExams(child.id);
  const now = useNow();
  const t = useT();
  const locale = useLocale();
  const plan = useMemo(() => (q.data ? buildExamPlan(q.data.exams, now) : null), [q.data, now]);

  if (q.isLoading) return <Loading />;
  if (q.isError || !plan) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;

  return (
    <>
      <ChildChips items={all} selectedId={child.id} />

      {plan.next ? (
        <Reveal index={0}>
          <NextPaperHero next={plan.next} />
        </Reveal>
      ) : null}

      {plan.series.length === 0 ? (
        <EmptyState title={t('learn.exams.none')} message={t('learn.exams.noneMessage')} />
      ) : (
        plan.series.map((s, seriesIndex) => (
          <Reveal key={s.series.id} index={seriesIndex + 1} style={{ gap: 20 }}>
            <LearnSectionTitle title={s.series.name} caption={seriesRange(s.series, t, locale)} />
            {s.papers.length === 0 ? (
              <Card>
                <AppText variant="caption">{t('learn.exams.noPapers')}</AppText>
              </Card>
            ) : (
              <ListCard>
                {s.papers.map((p, i) => (
                  <PaperRow key={p.paper.id} view={p} last={i === s.papers.length - 1} />
                ))}
              </ListCard>
            )}
          </Reveal>
        ))
      )}

      <ListCard>
        <ListRow icon="award" title={t('learn.exams.pastResults')} subtitle={t('learn.exams.pastResultsHint')} href="/(app)/(tabs)/progress" last />
      </ListCard>
    </>
  );
}

export default function ExamsScreen() {
  const t = useT();
  const refresh = usePullRefresh();
  const { child } = useChildren();
  const subtitle = child ? [firstName(child.name), child.className].filter(Boolean).join(', ') : undefined;
  return (
    <CollapsingScreen {...refresh} title={t('learn.exams.title')} subtitle={subtitle} leading={<BackButton />}>
      <ChildGate>{(selected, all) => <ExamsBody child={selected} all={all} />}</ChildGate>
    </CollapsingScreen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    hero: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    countCol: { minWidth: 92, alignItems: 'center' },
    countNumber: { fontFamily: fonts.display, fontSize: 64, lineHeight: 68, letterSpacing: -1, color: colors.ink },
    countWord: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.ink },
    heroDivider: { alignSelf: 'stretch', width: 1, backgroundColor: colors.border },
    paper: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, paddingVertical: 16 },
    paperDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    dateTile: { width: 52, minHeight: 56, borderRadius: 16, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  });
