import { Feather } from '@expo/vector-icons';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { parentApi } from '@/api/services';
import { ChildGate } from '@/components/child-gate';
import { usePullRefresh } from '@/components/learn/hooks';
import { HeroSurface } from '@/components/learn/learn-parts';
import { AppText, BackHeader, Card, ErrorState, Loading, Screen } from '@/components/ui';
import { queryKeys } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { monthGrid, monthLabel, shiftMonth, statusColor, statusTint } from '@/lib/calendar';
import { CountUp } from '@/motion/count-up';
import { percentToRatio } from '@/motion/motion-math';
import { popIn } from '@/motion/pop-in';
import { PressableScale } from '@/motion/pressable-scale';
import { ProgressRing } from '@/motion/progress-ring';
import { Reveal } from '@/motion/reveal';
import { colors, fonts } from '@/theme';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const KINDS = ['present', 'late', 'absent', 'leave'] as const;

const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** Same query as `useAttendance`, but flipping months keeps the old month on screen instead of blanking the page. */
const useAttendanceMonth = (childId: number, month: string | undefined) =>
  useQuery({
    queryKey: queryKeys.attendance(childId, month),
    queryFn: () => parentApi.attendance(childId, month),
    placeholderData: keepPreviousData,
  });

function MonthButton({ direction, onPress }: { direction: 'previous' | 'next'; onPress: () => void }) {
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={`${cap(direction)} month`} onPress={onPress} hitSlop={6} style={styles.monthButton}>
      <Feather name={direction === 'previous' ? 'chevron-left' : 'chevron-right'} size={20} color={colors.ink} />
    </PressableScale>
  );
}

function AttendanceBody({ childId }: { childId: number }) {
  const [month, setMonth] = useState<string | undefined>(undefined);
  const q = useAttendanceMonth(childId, month);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  const data = q.data;
  const cells = monthGrid(data.month, data.days);
  const s = data.summary;
  const todayDay = data.today.date.startsWith(data.month) ? Number(data.today.date.slice(8, 10)) : null;

  return (
    <>
      <Reveal index={0}>
        <HeroSurface>
          <View style={styles.heroRow}>
            <ProgressRing ratio={percentToRatio(s.percent)} size={112} stroke={10}>
              {s.percent === null ? (
                <AppText style={{ fontFamily: fonts.display, fontSize: 30, color: colors.faint }}>—</AppText>
              ) : (
                <CountUp
                  value={Math.round(s.percent)}
                  format={(n) => `${n}%`}
                  maxFontSizeMultiplier={1.1}
                  style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: colors.ink }}
                />
              )}
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" style={{ fontSize: 13, fontFamily: fonts.medium }}>
                {monthLabel(data.month)}
              </AppText>
              <AppText tabular style={{ fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3, marginTop: 4 }}>
                {s.marked === 0 ? 'No days marked this month' : `${s.present + s.late} of ${s.marked} days present`}
              </AppText>
            </View>
          </View>
        </HeroSurface>
      </Reveal>

      <Reveal index={1}>
        <View style={styles.counts}>
          {KINDS.map((k) => (
            <View key={k} accessible accessibilityLabel={`${cap(k)}, ${s[k]} ${s[k] === 1 ? 'day' : 'days'}`} style={styles.count}>
              <CountUp value={s[k]} delay={200} style={{ fontFamily: fonts.semibold, fontSize: 22, color: colors.ink }} />
              <View style={styles.countLabel}>
                <View style={[styles.legendDot, { backgroundColor: statusColor(k) }]} />
                <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13 }}>
                  {cap(k)}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </Reveal>

      <Reveal index={2}>
        <Card style={{ opacity: q.isPlaceholderData ? 0.6 : 1 }}>
          <View style={styles.monthRow}>
            <MonthButton direction="previous" onPress={() => setMonth(shiftMonth(data.month, -1))} />
            <AppText variant="heading" numberOfLines={1}>
              {monthLabel(data.month)}
            </AppText>
            <MonthButton direction="next" onPress={() => setMonth(shiftMonth(data.month, 1))} />
          </View>
          <View key={data.month} style={styles.grid}>
            {WEEK.map((w, i) => (
              <View key={`${w}${i}`} style={styles.cell}>
                <AppText variant="caption" style={{ fontSize: 12, fontFamily: fonts.semibold }}>
                  {w}
                </AppText>
              </View>
            ))}
            {cells.map((c, i) => (
              <View key={i} style={styles.cell}>
                {c ? (
                  <Animated.View
                    entering={popIn(i)}
                    accessible
                    accessibilityLabel={`${c.day}, ${c.status ?? 'not marked'}${c.day === todayDay ? ', today' : ''}`}
                    style={[styles.day, { backgroundColor: statusTint(c.status) }, c.day === todayDay && styles.today]}
                  >
                    <AppText tabular maxFontSizeMultiplier={1.2} style={{ fontSize: 14, fontFamily: c.status ? fonts.semibold : fonts.medium, color: c.status ? colors.ink : colors.muted }}>
                      {c.day}
                    </AppText>
                  </Animated.View>
                ) : null}
              </View>
            ))}
          </View>
        </Card>
      </Reveal>
    </>
  );
}

export default function AttendanceScreen() {
  const router = useRouter();
  const refresh = usePullRefresh();
  return (
    <Screen {...refresh} header={<BackHeader title="Attendance" onBack={() => router.back()} />}>
      <ChildGate>{(child) => <AttendanceBody childId={child.id} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  counts: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  count: { flex: 1, gap: 2 },
  countLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 2, borderColor: colors.accent },
});
