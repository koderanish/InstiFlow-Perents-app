import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ChildGate } from '@/components/child-gate';
import { AppText, BackHeader, Card, ErrorState, Loading, Screen } from '@/components/ui';
import { useAttendance } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { monthGrid, monthLabel, shiftMonth, statusColor } from '@/lib/calendar';
import { colors, fonts } from '@/theme';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function AttendanceBody({ childId }: { childId: number }) {
  const [month, setMonth] = useState<string | undefined>(undefined);
  const q = useAttendance(childId, month);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  const data = q.data;
  const cells = monthGrid(data.month, data.days);
  const s = data.summary;
  return (
    <>
      <View>
        <AppText style={{ fontFamily: fonts.display, fontSize: 64, lineHeight: 64 }}>{s.percent === null ? '—' : `${s.percent}%`}</AppText>
        <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>
          {s.marked === 0 ? 'No days marked this month' : `${s.present + s.late} of ${s.marked} days present`}
        </AppText>
      </View>
      <Card>
        <View style={styles.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(shiftMonth(data.month, -1))} hitSlop={10}>
            <Feather name="chevron-left" size={22} color={colors.ink} />
          </Pressable>
          <AppText variant="heading">{monthLabel(data.month)}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(shiftMonth(data.month, 1))} hitSlop={10}>
            <Feather name="chevron-right" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.grid}>
          {WEEK.map((w, i) => (
            <AppText key={`${w}${i}`} variant="caption" style={styles.cell}>{w}</AppText>
          ))}
          {cells.map((c, i) => (
            <View key={i} style={styles.cell}>
              {c ? (
                <>
                  <AppText style={{ fontSize: 14, fontFamily: fonts.medium }}>{c.day}</AppText>
                  <View style={[styles.mark, { backgroundColor: c.status ? statusColor(c.status) : 'transparent' }]} />
                </>
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          {(['present', 'late', 'absent', 'leave'] as const).map((k) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.mark, { backgroundColor: statusColor(k) }]} />
              <AppText variant="caption" style={{ fontSize: 13 }}>{k[0]!.toUpperCase() + k.slice(1)}</AppText>
            </View>
          ))}
        </View>
      </Card>
    </>
  );
}

export default function AttendanceScreen() {
  const router = useRouter();
  return (
    <Screen header={<BackHeader title="Attendance" onBack={() => router.back()} />}>
      <ChildGate>{(child) => <AttendanceBody childId={child.id} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  mark: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
