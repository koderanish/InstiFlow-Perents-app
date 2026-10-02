import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ChildGate } from '@/components/child-gate';
import { AppText, BackHeader, Card, Chip, EmptyState, ErrorState, Loading, Screen } from '@/components/ui';
import { useBus } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import { clock, clockFromTime, firstName } from '@/lib/format';
import { colors, fonts } from '@/theme';
import type { BusDetails } from '@/types/parent';

const headline = (status: Extract<BusDetails, { onTransport: true }>['status'], name: string) => {
  if (status.leg === 'dropped_off') return { chip: 'Dropped off', tone: 'good' as const, title: `${name} is home safe`, sub: clock(status.droppedOffAt) ? `Dropped off at ${clock(status.droppedOffAt)}.` : 'Dropped off.' };
  if (status.leg === 'on_the_bus') return { chip: 'On the bus', tone: 'good' as const, title: `${name} is on the bus`, sub: clock(status.pickedUpAt) ? `Picked up at ${clock(status.pickedUpAt)}.` : 'Picked up.' };
  return { chip: 'Not picked up yet', tone: 'neutral' as const, title: `${name} has not boarded yet`, sub: 'You will see an update here as soon as the bus attendant marks the pickup.' };
};

function BusBody({ childId, childName }: { childId: number; childName: string }) {
  const q = useBus(childId);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  const bus = q.data;
  if (!bus.onTransport) {
    return <EmptyState title="No school bus" message={`${childName} is not on a school bus route. Contact the school office if this is a mistake.`} />;
  }
  const h = headline(bus.status, firstName(childName));
  const mobile = bus.route.driverMobile;
  return (
    <>
      <Card hero>
        <Chip label={h.chip} tone={h.tone} />
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, marginTop: 16 }}>{h.title}</AppText>
        <AppText variant="caption" style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>{h.sub}</AppText>
      </Card>

      <View>
        <AppText variant="heading" style={{ marginHorizontal: 4, marginBottom: 12 }}>Route</AppText>
        <View style={styles.timeline}>
          <View style={styles.line} />
          {bus.stops.map((s) => (
            <View key={s.id} style={styles.stop}>
              <View style={[styles.stopDot, s.isChildStop ? { backgroundColor: colors.accent, borderColor: colors.accent } : null]} />
              <View style={{ flex: 1 }}>
                <AppText style={{ fontFamily: s.isChildStop ? fonts.semibold : fonts.medium }}>{s.name}</AppText>
                {s.isChildStop ? <AppText variant="caption" style={{ color: colors.accentInk, fontFamily: fonts.semibold, fontSize: 13, marginTop: 2 }}>{childName.split(' ')[0]}'s stop</AppText> : null}
              </View>
              <AppText variant="caption">{clockFromTime(s.time) ?? ''}</AppText>
            </View>
          ))}
        </View>
        <AppText variant="caption" style={{ fontSize: 13, marginHorizontal: 4, marginTop: 14 }}>
          Times are the planned schedule. Pickup and drop are recorded by the bus attendant.
        </AppText>
      </View>

      {bus.route.driverName ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontFamily: fonts.semibold }}>{bus.route.driverName}</AppText>
            <AppText variant="caption" style={{ marginTop: 2 }}>{bus.route.vehicleNo ? `Driver, bus ${bus.route.vehicleNo}` : 'Driver'}</AppText>
          </View>
          {mobile ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Call the driver" onPress={() => void Linking.openURL(`tel:${mobile}`)} style={styles.call}>
              <Feather name="phone" size={20} color={colors.onAccent} />
            </Pressable>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}

export default function BusScreen() {
  const router = useRouter();
  return (
    <Screen header={<BackHeader title="School bus" onBack={() => router.back()} />}>
      <ChildGate>{(child) => <BusBody childId={child.id} childName={child.name} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timeline: { paddingLeft: 34, gap: 22 },
  line: { position: 'absolute', left: 9, top: 10, bottom: 10, width: 2, backgroundColor: '#E8E0D9' },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stopDot: { position: 'absolute', left: -34, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CFC7C1', backgroundColor: colors.bg },
  call: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
