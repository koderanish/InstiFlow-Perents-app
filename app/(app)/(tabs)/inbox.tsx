import { ChildGate } from '@/components/child-gate';
import { AppText, Card, EmptyState, ErrorState, Loading, Screen } from '@/components/ui';
import { useNotices } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { dayMonth } from '@/lib/format';
import { colors, fonts } from '@/theme';
import { View } from 'react-native';

function InboxBody({ childId }: { childId: number }) {
  const q = useNotices(childId);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  if (q.data.length === 0) return <EmptyState title="No messages yet" message="Notices from the school will show up here." />;
  return (
    <View style={{ gap: 12 }}>
      {q.data.map((n) => (
        <Card key={n.id}>
          <AppText variant="caption" style={{ fontFamily: fonts.medium, fontSize: 13 }}>{dayMonth(n.postedAt.slice(0, 10)) ?? ''}</AppText>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 17, marginTop: 6 }}>{n.title}</AppText>
          {n.content ? (
            <AppText variant="caption" numberOfLines={4} style={{ fontSize: 15, lineHeight: 22, marginTop: 4, color: colors.muted }}>
              {n.content}
            </AppText>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

export default function InboxScreen() {
  return (
    <Screen>
      <AppText variant="title">Inbox</AppText>
      <ChildGate>{(child) => <InboxBody childId={child.id} />}</ChildGate>
    </Screen>
  );
}
