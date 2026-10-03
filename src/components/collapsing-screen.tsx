import type { PropsWithChildren, ReactNode } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts, useStyles, useTheme, type Theme } from '@/theme';

/** How far the page scrolls before the large title has fully become the compact bar. */
const COLLAPSE_AT = 56;

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  /** Back button or other leading control, drawn inside the compact bar. */
  leading?: ReactNode;
  /** Optional trailing control (for example a share button). */
  trailing?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

/**
 * Scrolling page with a large title that shrinks into a small centred title bar as you scroll,
 * like iOS. The motion is driven by the scroll position on the UI thread, so it stays in step with
 * the finger and is fully interruptible.
 */
export function CollapsingScreen({ title, subtitle, leading, trailing, refreshing, onRefresh, children }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  const compactTitle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [COLLAPSE_AT * 0.6, COLLAPSE_AT], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [0, COLLAPSE_AT], [6, 0], Extrapolation.CLAMP) }],
  }));
  const barBorder = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [COLLAPSE_AT * 0.6, COLLAPSE_AT], [0, 1], Extrapolation.CLAMP) }));
  const largeTitle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, COLLAPSE_AT * 0.8], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [-80, 0, COLLAPSE_AT], [8, 0, -6], Extrapolation.CLAMP) }],
  }));

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.bar}>
        <View style={styles.side}>{leading}</View>
        <Animated.View pointerEvents="none" style={[styles.compactWrap, compactTitle]}>
          <Text numberOfLines={1} accessibilityRole="header" style={styles.compactTitle}>
            {title}
          </Text>
        </Animated.View>
        <View style={[styles.side, styles.sideEnd]}>{trailing}</View>
        <Animated.View pointerEvents="none" style={[styles.barBorder, barBorder]} />
      </View>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}
      >
        <Animated.View style={[styles.large, largeTitle]}>
          <Text maxFontSizeMultiplier={1.2} style={styles.largeTitle}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </Animated.View>
        {children}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    bar: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: colors.bg },
    side: { minWidth: 48, justifyContent: 'center' },
    sideEnd: { alignItems: 'flex-end', marginLeft: 'auto' },
    compactWrap: { position: 'absolute', left: 64, right: 64, alignItems: 'center' },
    compactTitle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
    barBorder: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
    page: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
    large: { paddingTop: 4, gap: 2 },
    largeTitle: { fontFamily: fonts.semibold, fontSize: 30, lineHeight: 34, letterSpacing: -0.75, color: colors.ink },
    subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  });
