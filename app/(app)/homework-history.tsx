import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { ChildChips } from '@/components/child-chips';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { ChildGate } from '@/components/child-gate';
import { BackButton } from '@/components/learn/back-button';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { AppText, Card, EmptyState, ErrorState, ListCard, Loading } from '@/components/ui';
import { useHomework } from '@/features/parent/hooks';
import { useT } from '@/i18n';
import { friendlyError } from '@/lib/errors';
import { firstName } from '@/lib/format';
import { Reveal } from '@/motion/reveal';
import type { ParentChild } from '@/types/parent';

import { HomeworkRow } from './homework';

function HistoryBody({ child, all }: { child: ParentChild; all: ParentChild[] }) {
  const fullQ = useHomework(child.id, true);
  const recentQ = useHomework(child.id);
  const now = useNow();
  const t = useT();
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());

  // Prefer the full history; fall back to the recent window so one failed or
  // revalidated (304) query never blanks the page.
  const items = useMemo(() => [...(fullQ.data?.items ?? recentQ.data?.items ?? [])], [fullQ.data, recentQ.data]);

  if (fullQ.isLoading && recentQ.isLoading) return <Loading />;
  if (!fullQ.data && !recentQ.data)
    return <ErrorState message={friendlyError(fullQ.error ?? recentQ.error)} onRetry={() => { void fullQ.refetch(); void recentQ.refetch(); }} />;

  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <ChildChips items={all} selectedId={child.id} />
      <Reveal index={0}>
        <AppText variant="caption" style={{ fontSize: 13 }}>
          {firstName(child.name)}
        </AppText>
      </Reveal>
      <Animated.View layout={LinearTransition.duration(220)}>
        {items.length === 0 ? (
          <Card>
            <EmptyState title={t('learn.homework.historyEmpty')} message="" />
          </Card>
        ) : (
          <ListCard>
            {items.map((item, i) => (
              <HomeworkRow key={item.id} item={item} index={i + 1} now={now} expanded={open.has(item.id)} onToggle={() => toggle(item.id)} last={i === items.length - 1} />
            ))}
          </ListCard>
        )}
      </Animated.View>
      <View style={{ height: 8 }} />
    </>
  );
}

export default function HomeworkHistoryScreen() {
  const t = useT();
  const refresh = usePullRefresh();
  return (
    <CollapsingScreen {...refresh} title={t('learn.homework.historyTitle')} leading={<BackButton />}>
      <ChildGate>{(selected, all) => <HistoryBody child={selected} all={all} />}</ChildGate>
    </CollapsingScreen>
  );
}
