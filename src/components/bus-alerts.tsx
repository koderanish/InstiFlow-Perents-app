import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useNow } from '@/components/learn/hooks';
import { AppText } from '@/components/ui';
import { useBusAlerts } from '@/features/parent/hooks';
import { useT, type TFunction } from '@/i18n';
import { alertAge, type BusAlert, type BusAlertKind } from '@/lib/bus-alerts';
import { enterRise } from '@/motion/presets';
import { fonts, useStyles, useTheme } from '@/theme';

type Icon = 'alert-triangle' | 'x-circle' | 'info';

const KIND: Record<BusAlertKind, { icon: Icon; tone: 'warn' | 'bad' | 'neutral'; label: 'learn.bus.alertDelay' | 'learn.bus.alertCancelled' | 'learn.bus.alertInfo' }> = {
  delay: { icon: 'alert-triangle', tone: 'warn', label: 'learn.bus.alertDelay' },
  cancelled: { icon: 'x-circle', tone: 'bad', label: 'learn.bus.alertCancelled' },
  info: { icon: 'info', tone: 'neutral', label: 'learn.bus.alertInfo' },
};

const ageText = (iso: string, now: Date, t: TFunction): string => {
  const age = alertAge(iso, now);
  switch (age.unit) {
    case 'now':
      return t('learn.bus.alertJustNow');
    case 'minutes':
      return t('learn.bus.alertMinutes', { count: age.count });
    case 'hours':
      return t('learn.bus.alertHours', { count: age.count });
    case 'days':
      return t('learn.bus.alertDays', { count: age.count });
  }
};

function AlertBanner({ alert, now, index }: { alert: BusAlert; now: Date; index: number }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const kind = KIND[alert.kind];
  const tone = {
    warn: { bg: colors.warnBg, fg: colors.warnFg },
    bad: { bg: colors.badBg, fg: colors.badFg },
    neutral: { bg: colors.accentTint, fg: colors.accentInk },
  }[kind.tone];
  const kindLabel = t(kind.label);
  const heading = alert.routeName ? t('learn.bus.alertRoute', { kind: kindLabel, route: alert.routeName }) : kindLabel;
  const age = ageText(alert.createdAt, now, t);
  return (
    <Animated.View
      entering={enterRise(index)}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${heading}. ${alert.message}. ${age}`}
      style={[styles.banner, { backgroundColor: tone.bg }]}
    >
      <Feather name={kind.icon} size={20} color={tone.fg} style={styles.icon} />
      <View style={styles.body}>
        <AppText numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: fonts.semibold, fontSize: 14, color: tone.fg }}>
          {heading}
        </AppText>
        <AppText style={{ fontSize: 15, lineHeight: 21, marginTop: 2, color: colors.ink }}>{alert.message}</AppText>
        <AppText variant="caption" style={{ fontSize: 13, marginTop: 4 }}>
          {age}
        </AppText>
      </View>
    </Animated.View>
  );
}

/** Service notices for the child's bus, newest first. Draws nothing while loading, on error, or when there are none. */
export function BusAlerts({ childId }: { childId: number }) {
  const t = useT();
  const q = useBusAlerts(childId);
  const now = useNow();
  const styles = useStyles(createStyles);
  const alerts = q.data ?? [];
  if (alerts.length === 0) return null;
  return (
    <View accessibilityLabel={t('learn.bus.alerts')} style={styles.list}>
      {alerts.map((alert, i) => (
        <AlertBanner key={alert.id} alert={alert} now={now} index={i} />
      ))}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    list: { gap: 10 },
    banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 18 },
    icon: { marginTop: 1 },
    body: { flex: 1, minWidth: 0 },
  });
