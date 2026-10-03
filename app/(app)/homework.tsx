import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChildChips } from '@/components/child-chips';
import { ChildGate } from '@/components/child-gate';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { LearnSegmented, type SegmentOption } from '@/components/learn/learn-parts';
import { AppText, BackHeader, Card, Chip, EmptyState, ErrorState, ListCard, Loading, Screen } from '@/components/ui';
import { useChildren, useHomework } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { firstName } from '@/lib/format';
import { doneBadge, dueBadge, feedbackLine, homeworkCounts, homeworkSubtitle, setByLine, visibleHomework, type HomeworkFilter } from '@/lib/homework';
import { colors, fonts } from '@/theme';
import type { HomeworkItem, ParentChild } from '@/types/parent';

const OPTIONS: SegmentOption<HomeworkFilter>[] = [
  { key: 'todo', label: 'To do' },
  { key: 'done', label: 'Done' },
  { key: 'all', label: 'All' },
];

const EMPTY: Record<HomeworkFilter, { title: string; message: (name: string) => string }> = {
  todo: { title: 'All caught up', message: (name) => `No homework is waiting for ${name} right now.` },
  done: { title: 'Nothing handed in yet', message: () => 'Homework that has been handed in will show up here.' },
  all: { title: 'No homework yet', message: () => 'Homework set by the teachers will show up here.' },
};

function HomeworkRow({ item, now, expanded, onToggle, last }: { item: HomeworkItem; now: Date; expanded: boolean; onToggle: () => void; last: boolean }) {
  const due = dueBadge(item, now);
  const done = doneBadge(item);
  const note = feedbackLine(item);
  const setBy = setByLine(item);
  const graded = item.status === 'graded' && item.marks !== null;
  const spoken = [item.subject, item.title, due?.label, done?.label].filter(Boolean).join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint={expanded ? 'Hides the details' : 'Shows the details'}
      accessibilityState={{ expanded }}
      onPress={onToggle}
      style={[styles.item, !last && styles.itemDivider]}
    >
      <View style={styles.itemTop}>
        <AppText variant="caption" style={{ flex: 1, fontFamily: fonts.medium }}>
          {item.subject ?? 'Homework'}
        </AppText>
        {due && due.tone !== 'neutral' ? <Chip label={due.label} tone={due.tone} /> : null}
        {due && due.tone === 'neutral' ? (
          <AppText variant="caption" style={{ fontSize: 13, fontFamily: fonts.medium }}>
            {due.label}
          </AppText>
        ) : null}
        {done ? <Chip label={done.label} tone={done.tone} /> : null}
      </View>

      <View style={styles.titleRow}>
        <AppText style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 18, letterSpacing: -0.2 }}>{item.title}</AppText>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.faint} />
      </View>

      {item.description ? (
        <AppText variant="caption" numberOfLines={expanded ? undefined : 2} style={{ fontSize: 15, lineHeight: 22, marginTop: 4 }}>
          {item.description}
        </AppText>
      ) : null}

      {graded || note ? (
        <View style={styles.feedback}>
          {graded ? (
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
              {item.maxMarks !== null ? `${item.marks} out of ${item.maxMarks} marks` : `${item.marks} marks`}
            </AppText>
          ) : null}
          {note ? (
            <AppText variant="caption" style={{ fontSize: 14, lineHeight: 20, marginTop: graded ? 4 : 0 }}>
              {note}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {expanded && setBy ? (
        <AppText variant="caption" style={{ fontSize: 13, color: colors.faint, marginTop: 10 }}>
          {setBy}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function HomeworkBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const q = useHomework(child.id);
  const now = useNow();
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
      <LearnSegmented options={OPTIONS} value={filter} onChange={setFilter} label="Show homework" />
      {items.length === 0 ? (
        <Card>
          <EmptyState title={empty.title} message={empty.message(firstName(child.name))} />
        </Card>
      ) : (
        <ListCard>
          {items.map((item, i) => (
            <HomeworkRow key={item.id} item={item} now={now} expanded={open.has(item.id)} onToggle={() => toggle(item.id)} last={i === items.length - 1} />
          ))}
        </ListCard>
      )}
    </>
  );
}

export default function HomeworkScreen() {
  const router = useRouter();
  const refresh = usePullRefresh();
  const { child } = useChildren();
  const homework = useHomework(child?.id);
  const subtitle = child ? (homework.data ? homeworkSubtitle(firstName(child.name), homeworkCounts(homework.data.items)) : firstName(child.name)) : undefined;
  return (
    <Screen {...refresh} header={<BackHeader title="Homework" subtitle={subtitle} onBack={() => router.back()} />}>
      <ChildGate>{(selected, all) => <HomeworkBody child={selected} all={all} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { padding: 18 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  feedback: { marginTop: 12, backgroundColor: colors.bg, borderRadius: 14, padding: 12 },
});
