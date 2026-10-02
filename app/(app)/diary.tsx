import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ChildGate } from '@/components/child-gate';
import { AppText, BackHeader, Card, EmptyState, ErrorState, Loading, Screen } from '@/components/ui';
import { useDiary } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { colors, fonts } from '@/theme';

function DiaryBody({ childId }: { childId: number }) {
  const q = useDiary(childId);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  if (q.data.entries.length === 0) {
    return <EmptyState title="Nothing yet" message="The teachers have not added today's class notes. Check again later." />;
  }
  return (
    <View style={{ gap: 12 }}>
      {q.data.entries.map((e, i) => (
        <Card key={`${e.subject}-${i}`}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 17 }}>{e.subject}</AppText>
            {e.time ? <AppText variant="caption">{e.time}</AppText> : null}
          </View>
          {e.topic || e.chapterTitle ? (
            <AppText style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>{[e.chapterTitle, e.topic].filter(Boolean).join(', ')}</AppText>
          ) : null}
          {e.notes ? <AppText variant="caption" style={{ fontSize: 14, lineHeight: 21, marginTop: 6, color: colors.muted }}>{e.notes}</AppText> : null}
        </Card>
      ))}
    </View>
  );
}

export default function DiaryScreen() {
  const router = useRouter();
  return (
    <Screen header={<BackHeader title="Today in class" onBack={() => router.back()} />}>
      <ChildGate>{(child) => <DiaryBody childId={child.id} />}</ChildGate>
    </Screen>
  );
}
