import { Feather } from '@expo/vector-icons';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { useT } from '@/i18n';
import { hasStopPoint, initialRegion, routePath, type BusLocation, type BusStopPoint, type Pose } from '@/lib/bus-live';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

import { DARK_MAP_STYLE } from './map-style';
import { useAnimatedPose } from './use-animated-pose';

/**
 * The native map. Keep this the only file that imports react-native-maps, and only load it through
 * `loadBusMapCanvas`, which falls back to a text-only view when the map cannot run.
 */

const CAMERA_MS = 800;
const CENTRE = { x: 0.5, y: 0.5 } as const;

/** Custom marker views are drawn to a bitmap once; keep re-capturing briefly after `key` changes, then stop. */
const useTracksViewChanges = (key: string): boolean => {
  const [settledKey, setSettledKey] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setSettledKey(key), 600);
    return () => clearTimeout(id);
  }, [key]);
  return settledKey !== key;
};

function StopMarker({ stop, number }: { stop: BusStopPoint & { lat: number; lng: number }; number: number }) {
  const styles = useStyles(createStyles);
  const { scheme } = useTheme();
  const tracking = useTracksViewChanges(`${number}-${scheme}`);
  return (
    <Marker coordinate={{ latitude: stop.lat, longitude: stop.lng }} title={stop.name} anchor={CENTRE} tracksViewChanges={tracking} zIndex={1}>
      <View style={styles.stop}>
        <Text style={styles.stopText}>{number}</Text>
      </View>
    </Marker>
  );
}

function BusMarker({ location, dimmed }: { location: BusLocation; dimmed: boolean }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors, scheme } = useTheme();
  const target = useMemo<Pose>(() => ({ lat: location.lat, lng: location.lng, heading: location.heading }), [location.lat, location.lng, location.heading]);
  const pose = useAnimatedPose(target);
  const pointing = pose.heading !== null;
  const tracking = useTracksViewChanges(`${pointing}-${scheme}`);
  return (
    <Marker
      coordinate={{ latitude: pose.lat, longitude: pose.lng }}
      title={t('busMap.busMarker')}
      anchor={CENTRE}
      flat
      rotation={pose.heading ?? 0}
      opacity={dimmed ? 0.55 : 1}
      tracksViewChanges={tracking}
      zIndex={10}
    >
      <View style={styles.bus}>
        <Feather name={pointing ? 'arrow-up' : 'truck'} size={pointing ? 24 : 20} color={colors.onAccent} />
      </View>
    </Marker>
  );
}

export type BusMapCanvasProps = {
  location: BusLocation | null;
  stops: BusStopPoint[];
  /** The last known position of a bus that is not live right now. */
  dimmed: boolean;
  /** While true the camera follows the bus. */
  following: boolean;
  /** The parent dragged the map: stop following. */
  onUserMove: () => void;
  /** Height of whatever covers the bottom of the map, so the map's own logos and centre stay clear of it. */
  bottomInset: number;
};

function BusMapCanvasBase({ location, stops, dimmed, following, onUserMove, bottomInset }: BusMapCanvasProps) {
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [region] = useState(() => initialRegion(location, stops));
  const path = useMemo(() => routePath(stops), [stops]);
  const padding = useMemo(() => ({ top: 0, left: 0, right: 0, bottom: bottomInset }), [bottomInset]);
  const lat = location?.lat;
  const lng = location?.lng;

  useEffect(() => {
    if (!ready || !following || lat === undefined || lng === undefined) return;
    mapRef.current?.animateCamera({ center: { latitude: lat, longitude: lng } }, { duration: CAMERA_MS });
  }, [ready, following, lat, lng]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={region}
      userInterfaceStyle={isDark ? 'dark' : 'light'}
      customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
      mapPadding={padding}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      moveOnMarkerPress={false}
      onMapReady={() => setReady(true)}
      onPanDrag={onUserMove}
    >
      {path.length >= 2 ? <Polyline coordinates={path} strokeColor={colors.accent} strokeWidth={4} lineCap="round" lineJoin="round" /> : null}
      {stops.filter(hasStopPoint).map((stop, index) => (
        <StopMarker key={`${stop.order}-${stop.name}`} stop={stop} number={index + 1} />
      ))}
      {location ? <BusMarker location={location} dimmed={dimmed} /> : null}
    </MapView>
  );
}

export const BusMapCanvas = memo(BusMapCanvasBase);

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    stop: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
    stopText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
    bus: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  });
