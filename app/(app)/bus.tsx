import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { BusAlerts } from '@/components/bus-alerts';
import { ChildGate } from '@/components/child-gate';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { BackButton } from '@/components/learn/back-button';
import { useNow, usePullRefresh } from '@/components/learn/hooks';
import { HeroSurface, PulseDot } from '@/components/learn/learn-parts';
import { AppText, Card, Chip, EmptyState, ErrorState, Loading } from '@/components/ui';
import { TrackLiveCard } from '@/features/bus-map/track-live-card';
import { useBus } from '@/features/parent/hooks';
import { useLocale, useT, type Locale, type TFunction } from '@/i18n';
import { buildTimeline, busEta, fillLength, lineLength, type BusEta, type StopState } from '@/lib/bus-timeline';
import { friendlyError } from '@/lib/errors';
import { clock, clockFromTime, firstName, initials } from '@/lib/format';
import { enterRise } from '@/motion/presets';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';
import type { BusDetails, BusStop } from '@/types/parent';

type OnRoute = Extract<BusDetails, { onTransport: true }>;

const headline = (status: OnRoute['status'], name: string, t: TFunction, locale: Locale) => {
  if (status.leg === 'dropped_off') {
    const at = clock(status.droppedOffAt, locale);
    return { chip: t('bus.dropped'), tone: 'good' as const, title: t('learn.bus.droppedTitle', { name }), sub: at ? t('learn.bus.droppedSub', { time: at }) : t('learn.bus.droppedSubNoTime') };
  }
  if (status.leg === 'on_the_bus') {
    const at = clock(status.pickedUpAt, locale);
    return { chip: t('bus.onBus'), tone: 'good' as const, title: t('learn.bus.onBusTitle', { name }), sub: at ? t('learn.bus.onBusSub', { time: at }) : t('learn.bus.onBusSubNoTime') };
  }
  return { chip: t('bus.notPicked'), tone: 'neutral' as const, title: t('learn.bus.waitingTitle', { name }), sub: t('learn.bus.waitingSub') };
};

/** One planned-time sentence ("Pickup planned at 7:42 am from Green Park, in about 12 min."). */
const etaCopy = (eta: BusEta, t: TFunction): string => {
  switch (eta.kind) {
    case 'pickupNow':
      return t('learn.bus.etaPickupNow', { stop: eta.stop });
    case 'pickupSoon':
      return t('learn.bus.etaPickupSoon', { stop: eta.stop, time: eta.time, minutes: eta.minutes });
    case 'pickupAt':
      return t('learn.bus.etaPickupAt', { stop: eta.stop, time: eta.time });
    case 'pickupPast':
      return t('learn.bus.etaPickupPast', { stop: eta.stop, time: eta.time });
    case 'finishSoon':
      return t('learn.bus.etaFinishSoon', { time: eta.time, minutes: eta.minutes });
    case 'finishAt':
      return t('learn.bus.etaFinishAt', { time: eta.time });
  }
};

const stateWord = (state: StopState, t: TFunction): string => {
  if (state === 'passed') return t('learn.bus.statePassed');
  if (state === 'current') return t('learn.bus.stateNow');
  return t('learn.bus.stateComingUp');
};

function StopDot({ state, isChildStop }: { state: StopState; isChildStop: boolean }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
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
  const t = useT();
  const locale = useLocale();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
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

  const childStopLabel = t('learn.bus.childStop', { name: firstName(childName) });

  return (
    <View style={styles.timeline}>
      {total > 0 ? (
        <View pointerEvents="none" style={[styles.track, { top: centers[0] ?? 0, height: total }]}>
          <Animated.View style={[styles.trackFill, fillStyle]} />
        </View>
      ) : null}
      {stops.map((s, i) => {
        const state = timeline.states[i] ?? 'upcoming';
        const time = clockFromTime(s.time, locale);
        const landmark = s.landmark?.trim() ? t('learn.bus.near', { landmark: s.landmark.trim() }) : null;
        return (
          <Animated.View
            key={s.id}
            entering={enterRise(i + 1)}
            onLayout={measure(i)}
            accessible
            accessibilityLabel={[s.name, landmark, s.isChildStop ? childStopLabel : null, time, stateWord(state, t)].filter(Boolean).join(', ')}
            style={styles.stop}
          >
            <StopDot state={state} isChildStop={s.isChildStop} />
            <View style={{ flex: 1 }}>
              <AppText numberOfLines={2} ellipsizeMode="tail" style={{ fontFamily: s.isChildStop ? fonts.semibold : fonts.medium }}>
                {s.name}
              </AppText>
              {landmark ? (
                <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, marginTop: 2 }}>
                  {landmark}
                </AppText>
              ) : null}
              {s.isChildStop ? (
                <AppText variant="caption" style={{ color: colors.accentInk, fontFamily: fonts.semibold, fontSize: 13, marginTop: 2 }}>
                  {childStopLabel}
                </AppText>
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  const styles = useStyles(createStyles);
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} style={styles.stat}>
      <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13 }}>
        {label}
      </AppText>
      <AppText tabular numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.semibold, fontSize: 17, marginTop: 2 }}>
        {value}
      </AppText>
    </View>
  );
}

/** Route name with planned departure, arrival and stop count. Only what the school sent. */
function RouteSummary({ route, stopCount }: { route: OnRoute['route']; stopCount: number }) {
  const t = useT();
  const locale = useLocale();
  const styles = useStyles(createStyles);
  const departs = clockFromTime(route.startTime, locale);
  const arrives = clockFromTime(route.arrivalTime, locale);
  return (
    <Card style={{ gap: 14 }}>
      <AppText accessibilityRole="header" variant="heading" numberOfLines={2} ellipsizeMode="tail">
        {route.name}
      </AppText>
      <View style={styles.stats}>
        {departs ? <SummaryStat label={t('learn.bus.departs')} value={departs} /> : null}
        {arrives ? <SummaryStat label={t('learn.bus.arrives')} value={arrives} /> : null}
        {stopCount > 0 ? <SummaryStat label={t('learn.bus.stopsLabel')} value={String(stopCount)} /> : null}
      </View>
    </Card>
  );
}

/** Driver and vehicle. The call button only appears when the school has given a number. */
function DriverCard({ route }: { route: OnRoute['route'] }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const name = route.driverName?.trim() || null;
  const vehicle = route.vehicleNo?.trim() || null;
  const mobile = route.driverMobile?.trim() || null;
  const title = name ?? t('learn.bus.driver');
  const subtitle = name ? (vehicle ? t('learn.bus.driverBus', { vehicle }) : t('learn.bus.driver')) : vehicle ? t('learn.bus.vehicle', { vehicle }) : null;
  return (
    <Card style={styles.driver}>
      <View accessibilityElementsHidden importantForAccessibility="no" style={styles.avatar}>
        {name ? <Text style={styles.avatarText}>{initials(name)}</Text> : <Feather name="truck" size={20} color={colors.accentInk} />}
      </View>
      <View style={{ flex: 1 }}>
        <AppText numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: fonts.semibold }}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" numberOfLines={1} ellipsizeMode="tail" style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {mobile ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('learn.bus.callDriver', { name: title })}
          haptic="press"
          hitSlop={6}
          onPress={() => void Linking.openURL(`tel:${mobile}`).catch(() => undefined)}
          style={styles.call}
        >
          <Feather name="phone" size={18} color={colors.onAccent} />
          <Text maxFontSizeMultiplier={1.3} style={styles.callText}>
            {t('common.call')}
          </Text>
        </PressableScale>
      ) : null}
    </Card>
  );
}

function BusBody({ childId, childName }: { childId: number; childName: string }) {
  const q = useBus(childId);
  const t = useT();
  const locale = useLocale();
  const now = useNow();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  const bus = q.data;
  if (!bus.onTransport) {
    return <EmptyState title={t('learn.bus.noBus')} message={t('learn.bus.noBusMessage', { name: childName })} icon="truck" />;
  }
  const h = headline(bus.status, firstName(childName), t, locale);
  const eta = busEta(bus.stops, bus.route, bus.status.leg, now, locale);
  const hasDriverCard = !!(bus.route.driverName?.trim() || bus.route.vehicleNo?.trim());
  return (
    <>
      <Reveal index={0}>
        <HeroSurface>
          <Chip label={h.chip} tone={h.tone} />
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, marginTop: 16 }}>{h.title}</AppText>
          <AppText variant="caption" style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>
            {h.sub}
          </AppText>
          {eta ? (
            <View accessible accessibilityLabel={etaCopy(eta, t)} style={styles.eta}>
              <Feather name="clock" size={16} color={colors.accentInk} />
              <AppText variant="caption" tabular style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink }}>
                {etaCopy(eta, t)}
              </AppText>
            </View>
          ) : null}
        </HeroSurface>
      </Reveal>

      <Reveal index={1}>
        <RouteSummary route={bus.route} stopCount={bus.stops.length} />
      </Reveal>

      {bus.status.leg !== 'dropped_off' ? (
        <Reveal index={2}>
          <TrackLiveCard />
        </Reveal>
      ) : null}

      {bus.stops.length > 0 ? (
        <View>
          <AppText accessibilityRole="header" variant="heading" style={{ marginHorizontal: 4, marginBottom: 16 }}>
            {t('learn.bus.route')}
          </AppText>
          <RouteTimeline stops={bus.stops} leg={bus.status.leg} childName={childName} />
          <AppText variant="caption" style={{ fontSize: 13, marginHorizontal: 4, marginTop: 18 }}>
            {t('learn.bus.timesNote')}
          </AppText>
        </View>
      ) : null}

      {hasDriverCard ? (
        <Reveal index={3}>
          <DriverCard route={bus.route} />
        </Reveal>
      ) : null}
    </>
  );
}

export default function BusScreen() {
  const t = useT();
  const refresh = usePullRefresh();
  return (
    <CollapsingScreen {...refresh} title={t('bus.title')} leading={<BackButton />}>
      <ChildGate>{(child) => (
          <>
            <BusAlerts childId={child.id} />
            <BusBody childId={child.id} childName={child.name} />
          </>
        )}</ChildGate>
    </CollapsingScreen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    eta: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
    stats: { flexDirection: 'row', gap: 12 },
    stat: { flex: 1, minWidth: 0 },
    timeline: { paddingLeft: 34, gap: 22 },
    track: { position: 'absolute', left: 9, width: 2, borderRadius: 1, backgroundColor: colors.border, overflow: 'hidden' },
    trackFill: { width: 2, backgroundColor: colors.accent },
    stop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stopDot: { position: 'absolute', left: -34, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.faint, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
    stopDotPassed: { backgroundColor: colors.accent, borderColor: colors.accent },
    stopDotCurrent: { borderColor: colors.accent, backgroundColor: colors.card },
    driver: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
    avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: fonts.bold, fontSize: 15, color: colors.accentInk },
    call: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, borderRadius: 24, backgroundColor: colors.accent },
    callText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onAccent },
  });
