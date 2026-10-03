import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { ChildChips } from '@/components/child-chips';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { ChildGate } from '@/components/child-gate';
import { BackButton } from '@/components/learn/back-button';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { RotatingChevron } from '@/components/learn/learn-parts';
import { AppText, Card, Chip, EmptyState, ErrorState, ListCard, Loading } from '@/components/ui';
import { useChildren, useHomework } from '@/features/parent/hooks';
import { useLocale, useT, type TKey } from '@/i18n';
import { friendlyError } from '@/lib/errors';
import { firstName } from '@/lib/format';
import { doneBadge, dueBadge, feedbackLine, homeworkCounts, homeworkSubtitle, setByLine, visibleHomework, type HomeworkFilter } from '@/lib/homework';
import { CountUp } from '@/motion/count-up';
import { enterFade, enterRise, exitFade } from '@/motion/presets';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { Segmented, type SegmentOption } from '@/motion/segmented';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';
import type { HomeworkItem, ParentChild } from '@/types/parent';

const OPTIONS: { key: HomeworkFilter; label: TKey }[] = [
  { key: 'todo', label: 'learn.homework.filterTodo' },
  { key: 'done', label: 'learn.homework.filterDone' },
  { key: 'all', label: 'learn.homework.filterAll' },
];

const EMPTY: Record<HomeworkFilter, { title: TKey; message: TKey }> = {
  todo: { title: 'learn.homework.allCaughtUp', message: 'learn.homework.allCaughtUpMessage' },
  done: { title: 'learn.homework.nothingHandedIn', message: 'learn.homework.nothingHandedInMessage' },
  all: { title: 'learn.homework.noneYet', message: 'learn.homework.noneYetMessage' },
};

function HomeworkRow({ item, now, expanded, onToggle, last, index }: { item: HomeworkItem; now: Date; expanded: boolean; onToggle: () => void; last: boolean; index: number }) {
  const t = useT();
  const locale = useLocale();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const due = dueBadge(item, now, t, locale);
  const done = doneBadge(item, t);
  const note = feedbackLine(item, t);
  const setBy = setByLine(item, t, locale);
  const marks = item.status === 'graded' ? item.marks : null;
  const spoken = [item.subject, item.title, due?.label, done?.label].filter(Boolean).join(', ');

  return (
    <Animated.View entering={enterRise(index)} layout={LinearTransition.duration(220)} style={[styles.item, !last && styles.itemDivider]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={spoken}
        accessibilityHint={expanded ? t('learn.homework.hideDetails') : t('learn.homework.showDetails')}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        scaleTo={0.985}
        style={styles.itemPress}
      >
        <View style={styles.itemTop}>
          <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1, fontFamily: fonts.medium }}>
            {item.subject ?? t('learn.homework.fallbackSubject')}
          </AppText>
          {due && due.tone !== 'neutral' ? <Chip label={due.label} tone={due.tone} /> : null}
          {due && due.tone === 'neutral' ? (
            <AppText variant="caption" tabular style={{ fontSize: 13, fontFamily: fonts.medium }}>
              {due.label}
            </AppText>
          ) : null}
          {done ? <Chip label={done.label} tone={done.tone} /> : null}
        </View>

        <View style={styles.titleRow}>
          <AppText numberOfLines={expanded ? undefined : 2} ellipsizeMode="tail" style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 18, letterSpacing: -0.2 }}>
            {item.title}
          </AppText>
          <RotatingChevron open={expanded} />
        </View>

        {item.description ? (
          <AppText variant="caption" numberOfLines={expanded ? undefined : 2} ellipsizeMode="tail" style={{ fontSize: 15, lineHeight: 22, marginTop: 4 }}>
            {item.description}
          </AppText>
        ) : null}

        {marks !== null || note ? (
          <View style={styles.feedback}>
            {marks !== null ? (
              <View style={styles.marksLine}>
                <CountUp value={marks} delay={200 + index * 60} style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.ink }} />
                <AppText tabular style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
                  {` ${item.maxMarks !== null ? t('learn.homework.outOfMarks', { max: item.maxMarks }) : t('learn.homework.marksWord')}`}
                </AppText>
              </View>
            ) : null}
            {note ? (
              <AppText variant="caption" style={{ fontSize: 14, lineHeight: 20, marginTop: marks !== null ? 4 : 0 }}>
                {note}
              </AppText>
            ) : null}
          </View>
        ) : null}

        {expanded && setBy ? (
          <Animated.View entering={enterFade()} exiting={exitFade}>
            <AppText variant="caption" style={{ fontSize: 13, color: colors.faint, marginTop: 10 }}>
              {setBy}
            </AppText>
          </Animated.View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

function HomeworkBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const q = useHomework(child.id);
  const now = useNow();
  const t = useT();
  const options = useMemo<SegmentOption<HomeworkFilter>[]>(() => OPTIONS.map((o) => ({ key: o.key, label: t(o.label) })), [t]);
  const [filter, setFilter] = useState<HomeworkFilter>('todo');
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());

  const items = useMemo(() => (q.data ? visibleHomework(q.data.items, filter) : []), [q.data, filter]);

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;

  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const empty = EMPTY[q.data.items.length === 0 ? 'all' : filter];

  return (
    <>
      <ChildChips items={all} selectedId={child.id} />
      <Reveal index={0}>
        <Segmented options={options} value={filter} onChange={setFilter} label={t('learn.homework.showHomework')} />
      </Reveal>
      <Animated.View key={filter} entering={enterFade(1)}>
        {items.length === 0 ? (
          <Card>
            <EmptyState title={t(empty.title)} message={t(empty.message, { name: firstName(child.name) })} />
          </Card>
        ) : (
          <ListCard>
            {items.map((item, i) => (
              <HomeworkRow key={item.id} item={item} index={i + 1} now={now} expanded={open.has(item.id)} onToggle={() => toggle(item.id)} last={i === items.length - 1} />
            ))}
          </ListCard>
        )}
      </Animated.View>
    </>
  );
}

export default function HomeworkScreen() {
  const t = useT();
  const refresh = usePullRefresh();
  const { child } = useChildren();
  const homework = useHomework(child?.id);
  const subtitle = child ? (homework.data ? homeworkSubtitle(firstName(child.name), homeworkCounts(homework.data.items), t) : firstName(child.name)) : undefined;
  return (
    <CollapsingScreen {...refresh} title={t('learn.homework.title')} subtitle={subtitle} leading={<BackButton />}>
      <ChildGate>{(selected, all) => <HomeworkBody child={selected} all={all} />}</ChildGate>
    </CollapsingScreen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    item: { overflow: 'hidden' },
    itemPress: { padding: 18 },
    itemDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
    marksLine: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
    feedback: { marginTop: 12, backgroundColor: colors.bg, borderRadius: 14, padding: 12 },
  });
