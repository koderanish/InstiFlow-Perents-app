import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { ChildGate } from '@/components/child-gate';
import { AppText, Card, ErrorState, ListCard, ListRow, Loading, Screen } from '@/components/ui';
import { useAttendance } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { fonts } from '@/theme';

function ProgressBody({ childId }: { childId: number }) {
  const q = useAttendance(childId);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  const pct = q.data.summary.percent;
  return (
    <>
      <Link href="/(app)/attendance" asChild>
        <Pressable accessibilityRole="button" accessibilityLabel="Attendance">
          <Card hero>
            <AppText variant="caption" style={{ fontFamily: fonts.medium }}>Attendance this month</AppText>
            <AppText style={{ fontFamily: fonts.display, fontSize: 64, lineHeight: 64, marginTop: 8 }}>{pct === null ? 'No data yet' : `${pct}%`}</AppText>
            <AppText variant="caption" style={{ fontSize: 15, marginTop: 8 }}>
              {q.data.summary.marked === 0 ? 'No days marked yet' : `${q.data.summary.present + q.data.summary.late} of ${q.data.summary.marked} days present`}
            </AppText>
          </Card>
        </Pressable>
      </Link>
      <ListCard>
        <ListRow title="Today in class" subtitle="What was taught and homework" href="/(app)/diary" last />
      </ListCard>
      <AppText variant="caption" style={{ paddingHorizontal: 4 }}>Exam results and report cards will appear here once the school publishes them.</AppText>
    </>
  );
}

export default function ProgressScreen() {
  return (
    <Screen>
      <AppText variant="title">Progress</AppText>
      <ChildGate>{(child) => <ProgressBody childId={child.id} />}</ChildGate>
    </Screen>
  );
}
