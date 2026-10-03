import { Feather } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, ReduceMotion } from 'react-native-reanimated';

import { useT } from '@/i18n';
import { fonts, useStyles, type Theme } from '@/theme';

const enter = FadeInUp.duration(220).reduceMotion(ReduceMotion.System);
const leave = FadeOutUp.duration(160).reduceMotion(ReduceMotion.System);

/** Slim bar shown while the phone has no internet. Cached data stays visible underneath. */
export function OfflineBanner() {
  const net = useNetInfo();
  const t = useT();
  const styles = useStyles(createStyles);
  // `isConnected` is null until the first reading; only an explicit false counts as offline.
  const offline = net.isConnected === false || net.isInternetReachable === false;
  if (!offline) return null;
  return (
    <Animated.View entering={enter} exiting={leave} accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.bar}>
      <Feather name="wifi-off" size={16} color={styles.icon.color} />
      <View style={styles.copy}>
        <Text style={styles.title}>{t('offline.title')}</Text>
        <Text style={styles.message}>{t('offline.message')}</Text>
      </View>
    </Animated.View>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.warnBg },
    icon: { color: colors.warnFg },
    copy: { flex: 1 },
    title: { fontFamily: fonts.semibold, fontSize: 13, color: colors.warnFg },
    message: { fontFamily: fonts.body, fontSize: 12, color: colors.warnFg, marginTop: 1 },
  });
