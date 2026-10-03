import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ChildGate } from '@/components/child-gate';
import { usePullRefresh } from '@/components/learn/hooks';
import { AppText, BackHeader, Card, EmptyState, ErrorState, Loading, Screen } from '@/components/ui';
import { useDiary } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { AnimatedBar } from '@/motion/animated-bar';
import { progressFraction } from '@/motion/motion-math';
import { Reveal } from '@/motion/reveal';
import { staggerDelay } from '@/motion/tokens';
import { colors, fonts } from '@/theme';
import type { DiaryEntry } from '@/types/parent';

function DiaryCard({ entry, index }: { entry: DiaryEntry; index: number }) {
  const covered = progressFraction(entry.progress);
  const heading = [entry.chapterTitle, entry.topic].filter(Boolean).join(', ');
  return (
    <Reveal index={index}>
      <Card>
        <View style={styles.top}>
          <AppText numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 17 }}>
            {entry.subject}
          </AppText>
          {entry.time ? (
            <AppText variant="caption" tabular>
              {entry.time}
            </AppText>
          ) : null}
        </View>
        {heading ? <AppText style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>{heading}</AppText> : null}
        {entry.notes ? (
          <AppText variant="caption" style={{ fontSize: 14, lineHeight: 21, marginTop: 6, color: colors.muted }}>
            {entry.notes}
          </AppText>
        ) : null}
        {covered > 0 ? (
          <View accessible accessibilityLabel={`${Math.round(covered * 100)} percent covered`} style={styles.progress}>
            <AnimatedBar ratio={covered} delay={260 + staggerDelay(index)} style={{ flex: 1 }} />
            <AppText variant="caption" tabular style={{ fontSize: 13, minWidth: 40, textAlign: 'right' }}>
              {`${Math.round(covered * 100)}%`}
            </AppText>
          </View>
        ) : null}
      </Card>
    </Reveal>
  );
}

function DiaryBody({ childId }: { childId: number }) {
  const q = useDiary(childId);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  if (q.data.entries.length === 0) {
    return <EmptyState title="Nothing yet" message="The teachers have not added today's class notes. Check again later." icon="book" />;
  }
  return (
    <View style={{ gap: 12 }}>
      {q.data.entries.map((e, i) => (
        <DiaryCard key={`${e.subject}-${i}`} entry={e} index={i} />
      ))}
    </View>
  );
}

export default function DiaryScreen() {
  const router = useRouter();
  const refresh = usePullRefresh();
  return (
    <Screen {...refresh} header={<BackHeader title="Today in class" onBack={() => router.back()} />}>
      <ChildGate>{(child) => <DiaryBody childId={child.id} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
});
