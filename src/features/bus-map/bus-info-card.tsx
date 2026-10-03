import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Chip } from '@/components/ui';
import { PulseDot } from '@/components/learn/learn-parts';
import { useT } from '@/i18n';
import { agoLabel, type BusLive, type BusMapState } from '@/lib/bus-live';
import { fonts, radius, useStyles, useTheme, type Theme } from '@/theme';

function LivePill() {
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.livePill}>
      <PulseDot color={colors.goodDot} size={5} />
      <Text style={styles.livePillText}>{t('busMap.live')}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const styles = useStyles(createStyles);
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} style={styles.stat}>
      <AppText variant="caption" numberOfLines={1} style={{ fontSize: 13 }}>
        {label}
      </AppText>
      <AppText tabular numberOfLines={1} maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.semibold, fontSize: 17, marginTop: 2 }}>
        {value}
      </AppText>
    </View>
  );
}

/**
 * Sheet-like card at the bottom of the live map: route, live state, speed and how fresh the fix is.
 * It carries all the information, so it is also the whole screen when the map cannot be shown.
 */
export function BusInfoCard({ data, state, now }: { data: BusLive; state: BusMapState; now: Date }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { location } = data;
  const live = state.kind === 'live';
  const speed = live && location && typeof location.speedKmh === 'number' ? t('busMap.speedValue', { speed: Math.round(location.speedKmh) }) : null;
  const updated = location ? agoLabel(location.updatedAt, now, t) : null;
  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <View accessibilityElementsHidden importantForAccessibility="no" style={styles.grabber} />
      <View style={styles.header}>
        <AppText accessibilityRole="header" variant="heading" numberOfLines={2} ellipsizeMode="tail" style={{ flex: 1 }}>
          {data.routeName ?? t('bus.title')}
        </AppText>
        {live ? <LivePill /> : <Chip label={t('busMap.notLive')} />}
      </View>
      {live ? (
        <View style={styles.stats}>
          {speed ? <Stat label={t('busMap.speed')} value={speed} /> : null}
          {updated ? <Stat label={t('busMap.updated')} value={updated} /> : null}
        </View>
      ) : (
        <View accessible style={{ gap: 4 }}>
          <AppText style={{ fontFamily: fonts.semibold }}>{t('busMap.notLiveTitle')}</AppText>
          {updated ? (
            <AppText variant="caption" tabular>
              {t('busMap.lastSeen', { ago: updated })}
            </AppText>
          ) : (
            <AppText variant="caption">{t('busMap.notLiveBody')}</AppText>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.hero, borderTopRightRadius: radius.hero, paddingHorizontal: 20, paddingTop: 10, gap: 14, ...shadow.card },
    grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stats: { flexDirection: 'row', gap: 12 },
    stat: { flex: 1, minWidth: 0 },
    livePill: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 30, paddingLeft: 6, paddingRight: 12, borderRadius: 15, backgroundColor: colors.goodBg },
    livePillText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.goodFg },
  });
