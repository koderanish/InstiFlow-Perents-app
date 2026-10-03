import { Feather } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChildGate } from '@/components/child-gate';
import { BackButton } from '@/components/learn/back-button';
import { useNow } from '@/components/learn/hooks';
import { AppText, EmptyState, ErrorState, Loading, PrimaryButton } from '@/components/ui';
import { BusInfoCard } from '@/features/bus-map/bus-info-card';
import { loadBusMapCanvas } from '@/features/bus-map/load-canvas';
import { useScreenActive } from '@/features/bus-map/use-screen-active';
import { useBusLocation } from '@/features/parent/hooks';
import { useT } from '@/i18n';
import { busMapState, type BusLive, type BusLocation, type BusMapState } from '@/lib/bus-live';
import { friendlyError } from '@/lib/errors';
import { firstName } from '@/lib/format';
import { PressableScale } from '@/motion/pressable-scale';
import { IconBadge } from '@/components/icon-badge';
import { useStyles, useTheme, type Theme } from '@/theme';

const openInMaps = ({ lat, lng }: BusLocation) => {
  const url = Platform.OS === 'ios' ? `http://maps.apple.com/?ll=${lat},${lng}&q=Bus` : `geo:${lat},${lng}?q=${lat},${lng}(Bus)`;
  void Linking.openURL(url).catch(() => undefined);
};

/** Shown when the map cannot run here (web, a build without a map key): the card below still has the facts. */
function MapUnavailable({ location }: { location: BusLocation | null }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.unavailable, { paddingTop: insets.top + 80 }]}>
      <IconBadge name="map" size={64} />
      <AppText variant="heading" style={{ textAlign: 'center', marginTop: 16 }}>
        {t('busMap.unavailableTitle')}
      </AppText>
      <AppText variant="caption" style={{ textAlign: 'center', marginTop: 6, lineHeight: 21 }}>
        {t('busMap.unavailableBody')}
      </AppText>
      {location ? (
        <View style={{ alignSelf: 'stretch', marginTop: 20 }}>
          <PrimaryButton label={t('busMap.openInMaps')} onPress={() => openInMaps(location)} />
        </View>
      ) : null}
    </View>
  );
}

const BusMapPanel = memo(function BusMapPanel({ data, state, now }: { data: BusLive; state: BusMapState; now: Date }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const [canvas] = useState(loadBusMapCanvas);
  const [following, setFollowing] = useState(true);
  const [bottomInset, setBottomInset] = useState(0);
  const { location } = data;
  const MapCanvas = canvas?.BusMapCanvas;
  return (
    <View style={StyleSheet.absoluteFill}>
      {MapCanvas ? (
        <MapCanvas
          location={location}
          stops={data.stops}
          dimmed={state.kind !== 'live'}
          following={following}
          onUserMove={() => setFollowing(false)}
          bottomInset={bottomInset}
        />
      ) : (
        <MapUnavailable location={location} />
      )}
      <View pointerEvents="box-none" style={styles.bottom} onLayout={(e) => setBottomInset(e.nativeEvent.layout.height)}>
        {MapCanvas && location ? (
          <View pointerEvents="box-none" style={styles.recenterRow}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t('busMap.recenter')}
              accessibilityState={{ selected: following }}
              onPress={() => setFollowing(true)}
              style={styles.recenter}
            >
              <Feather name="crosshair" size={22} color={following ? colors.accent : colors.ink} />
            </PressableScale>
          </View>
        ) : null}
        <BusInfoCard data={data} state={state} now={now} />
      </View>
    </View>
  );
});

function BusMapBody({ childId, childName }: { childId: number; childName: string }) {
  const t = useT();
  const active = useScreenActive();
  const q = useBusLocation(childId, active);
  const now = useNow(5_000);
  if (q.isLoading) return <Loading />;
  if (!q.data) return <ErrorState message={friendlyError(q.error, t)} onRetry={() => void q.refetch()} />;
  const state = busMapState(q.data, now);
  if (state.kind === 'noRoute') {
    return <EmptyState title={t('busMap.noRouteTitle')} message={t('busMap.noRouteBody', { name: firstName(childName) })} icon="truck" />;
  }
  if (state.kind === 'offline' && !state.hasMapContent) {
    return <EmptyState title={t('busMap.notLiveTitle')} message={t('busMap.notLiveBody')} icon="map-pin" />;
  }
  return <BusMapPanel data={q.data} state={state} now={now} />;
}

export default function BusMapScreen() {
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={[styles.frame, { paddingTop: insets.top + 72 }]}>
        <ChildGate>{(child) => <BusMapBody childId={child.id} childName={child.name} />}</ChildGate>
      </View>
      <View style={[styles.back, { top: insets.top + 8 }]}>
        <BackButton />
      </View>
    </View>
  );
}

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    frame: { flex: 1, paddingHorizontal: 20 },
    back: { position: 'absolute', left: 16, zIndex: 10 },
    bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    recenterRow: { alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 12 },
    recenter: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.card },
    unavailable: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, paddingHorizontal: 32, alignItems: 'center' },
  });
