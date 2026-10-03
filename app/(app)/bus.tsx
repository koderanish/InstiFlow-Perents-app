import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { ChildGate } from '@/components/child-gate';
import { usePullRefresh } from '@/components/learn/hooks';
import { HeroSurface, PulseDot } from '@/components/learn/learn-parts';
import { AppText, BackHeader, Card, Chip, EmptyState, ErrorState, Loading, Screen } from '@/components/ui';
import { useBus } from '@/features/parent/hooks';
import { buildTimeline, fillLength, lineLength, type StopState } from '@/lib/bus-timeline';
import { friendlyError } from '@/lib/errors';
import { clock, clockFromTime, firstName } from '@/lib/format';
import { enterRise } from '@/motion/presets';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { colors, fonts } from '@/theme';
import type { BusDetails, BusStop } from '@/types/parent';

type OnRoute = Extract<BusDetails, { onTransport: true }>;

const headline = (status: OnRoute['status'], name: string) => {
  if (status.leg === 'dropped_off') return { chip: 'Dropped off', tone: 'good' as const, title: `${name} is home safe`, sub: clock(status.droppedOffAt) ? `Dropped off at ${clock(status.droppedOffAt)}.` : 'Dropped off.' };
  if (status.leg === 'on_the_bus') return { chip: 'On the bus', tone: 'good' as const, title: `${name} is on the bus`, sub: clock(status.pickedUpAt) ? `Picked up at ${clock(status.pickedUpAt)}.` : 'Picked up.' };
  return { chip: 'Not picked up yet', tone: 'neutral' as const, title: `${name} has not boarded yet`, sub: 'You will see an update here as soon as the bus attendant marks the pickup.' };
};

const STATE_WORDS: Record<StopState, string> = { passed: 'passed', current: 'now', upcoming: 'coming up' };

function StopDot({ state, isChildStop }: { state: StopState; isChildStop: boolean }) {
  if (state === 'current') {
    return (
      <View style={[styles.stopDot, styles.stopDotCurrent]}>
        <PulseDot size={8} />
      </View>
    );
  }
  if (state === 'passed') {
    return (
      <View style={[styles.stopDot, styles.stopDotPassed]}>
        <Feather name="check" size={12} color={colors.onAccent} />
      </View>
    );
  }
  return <View style={[styles.stopDot, isChildStop && { borderColor: colors.accent }]} />;
}

/** Vertical route. The accent line fills from the first stop down to where the child is. */
function RouteTimeline({ stops, leg, childName }: { stops: BusStop[]; leg: OnRoute['status']['leg']; childName: string }) {
  const reduced = useReducedMotion();
  const [centers, setCenters] = useState<number[]>([]);
  const timeline = buildTimeline(stops, leg);
  const measured = stops.length > 0 && Array.from(centers, (c) => typeof c === 'number').filter(Boolean).length === stops.length;
  const total = measured ? lineLength(centers) : 0;
  const target = measured ? fillLength(centers, timeline.filledIndex) : 0;
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.set(reduced ? target : withDelay(350, withTiming(target, { duration: 800, easing: Easing.inOut(Easing.cubic) })));
  }, [target, reduced, fill]);

  const fillStyle = useAnimatedStyle(() => ({ height: fill.value }));

  const measure = (index: number) => (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    const centre = y + height / 2;
    setCenters((prev) => {
      if (prev[index] === centre) return prev;
      const next = [...prev];
      next[index] = centre;
      return next;
    });
  };

  return (
    <View style={styles.timeline}>
      {total > 0 ? (
        <View pointerEvents="none" style={[styles.track, { top: centers[0] ?? 0, height: total }]}>
          <Animated.View style={[styles.trackFill, fillStyle]} />
        </View>
      ) : null}
      {stops.map((s, i) => {
        const state = timeline.states[i] ?? 'upcoming';
        const time = clockFromTime(s.time);
        return (
          <Animated.View
            key={s.id}
            entering={enterRise(i + 1)}
            onLayout={measure(i)}
            accessible
            accessibilityLabel={[s.name, s.isChildStop ? `${firstName(childName)}'s stop` : null, time, STATE_WORDS[state]].filter(Boolean).join(', ')}
            style={styles.stop}
          >
            <StopDot state={state} isChildStop={s.isChildStop} />
            <View style={{ flex: 1 }}>
              <AppText numberOfLines={2} ellipsizeMode="tail" style={{ fontFamily: s.isChildStop ? fonts.semibold : fonts.medium }}>
                {s.name}
              </AppText>
              {s.isChildStop ? (
                <AppText variant="caption" style={{ color: colors.accentInk, fontFamily: fonts.semibold, fontSize: 13, marginTop: 2 }}>{`${firstName(childName)}'s stop`}</AppText>
              ) : null}
            </View>
            <AppText variant="caption" tabular>
              {time ?? ''}
            </AppText>
          </Animated.View>
        );
      })}
    </View>
  );
}

function BusBody({ childId, childName }: { childId: number; childName: string }) {
  const q = useBus(childId);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  const bus = q.data;
  if (!bus.onTransport) {
    return <EmptyState title="No school bus" message={`${childName} is not on a school bus route. Contact the school office if this is a mistake.`} icon="truck" />;
  }
  const h = headline(bus.status, firstName(childName));
  const mobile = bus.route.driverMobile;
  return (
    <>
      <Reveal index={0}>
        <HeroSurface>
          <Chip label={h.chip} tone={h.tone} />
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, marginTop: 16 }}>{h.title}</AppText>
          <AppText variant="caption" style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>
            {h.sub}
          </AppText>
        </HeroSurface>
      </Reveal>

      <View>
        <AppText accessibilityRole="header" variant="heading" style={{ marginHorizontal: 4, marginBottom: 16 }}>
          Route
        </AppText>
        <RouteTimeline stops={bus.stops} leg={bus.status.leg} childName={childName} />
        <AppText variant="caption" style={{ fontSize: 13, marginHorizontal: 4, marginTop: 18 }}>
          Times are the planned schedule. Pickup and drop are recorded by the bus attendant.
        </AppText>
      </View>

      {bus.route.driverName ? (
        <Reveal index={3}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
            <View style={{ flex: 1 }}>
              <AppText numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: fonts.semibold }}>
                {bus.route.driverName}
              </AppText>
              <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ marginTop: 2 }}>
                {bus.route.vehicleNo ? `Driver, bus ${bus.route.vehicleNo}` : 'Driver'}
              </AppText>
            </View>
            {mobile ? (
              <PressableScale accessibilityRole="button" accessibilityLabel="Call the driver" haptic="press" hitSlop={6} onPress={() => void Linking.openURL(`tel:${mobile}`)} style={styles.call}>
                <Feather name="phone" size={20} color={colors.onAccent} />
              </PressableScale>
            ) : null}
          </Card>
        </Reveal>
      ) : null}
    </>
  );
}

export default function BusScreen() {
  const router = useRouter();
  const refresh = usePullRefresh();
  return (
    <Screen {...refresh} header={<BackHeader title="School bus" onBack={() => router.back()} />}>
      <ChildGate>{(child) => <BusBody childId={child.id} childName={child.name} />}</ChildGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timeline: { paddingLeft: 34, gap: 22 },
  track: { position: 'absolute', left: 9, width: 2, borderRadius: 1, backgroundColor: '#E8E0D9', overflow: 'hidden' },
  trackFill: { width: 2, backgroundColor: colors.accent },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stopDot: { position: 'absolute', left: -34, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CFC7C1', backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  stopDotPassed: { backgroundColor: colors.accent, borderColor: colors.accent },
  stopDotCurrent: { borderColor: colors.accent, backgroundColor: colors.card },
  call: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
