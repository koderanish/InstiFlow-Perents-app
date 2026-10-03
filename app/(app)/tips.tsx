import { Stack, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Chip } from '@/components/ui';
import { useChildren } from '@/features/parent/hooks';
import { useT, type TFunction } from '@/i18n';
import { firstName } from '@/lib/format';
import { dotProgress, pageIndex } from '@/lib/pager';
import type { Tone } from '@/lib/status-copy';
import { tapHaptic } from '@/motion/haptics';
import { enterFade, exitFade } from '@/motion/presets';
import { PressableScale } from '@/motion/pressable-scale';
import { usePrefsStore } from '@/stores/prefs-store';
import { fonts, radius, useStyles, useTheme, type Theme } from '@/theme';

interface Tip {
  id: string;
  chip: string;
  tone: Tone;
  sample: string;
  sampleLine: string;
  title: string;
  body: string;
}

const tipsFor = (kid: string, t: TFunction): Tip[] => [
  {
    id: 'today',
    chip: t('account.tips.today.chip'),
    tone: 'good',
    sample: t('account.tips.today.sample', { name: kid }),
    sampleLine: t('account.tips.today.sampleLine'),
    title: t('account.tips.today.title', { name: kid }),
    body: t('account.tips.today.body'),
  },
  {
    id: 'fees',
    chip: t('account.tips.fees.chip'),
    tone: 'warn',
    sample: t('account.tips.fees.sample'),
    sampleLine: t('account.tips.fees.sampleLine'),
    title: t('account.tips.fees.title'),
    body: t('account.tips.fees.body'),
  },
  {
    id: 'leave',
    chip: t('account.tips.leave.chip'),
    tone: 'neutral',
    sample: t('account.tips.leave.sample', { name: kid }),
    sampleLine: t('account.tips.leave.sampleLine'),
    title: t('account.tips.leave.title'),
    body: t('account.tips.leave.body'),
  },
];

/** One card of the pager. Its art drifts a little slower than the page and the whole card fades as it leaves. */
function TipPage({ tip, index, width, scrollX, total }: { tip: Tip; index: number; width: number; scrollX: SharedValue<number>; total: number }) {
  const styles = useStyles(createStyles);
  const t = useT();
  const art = useAnimatedStyle(() => {
    const near = dotProgress(scrollX.get(), width, index);
    return {
      opacity: interpolate(near, [0, 1], [0.35, 1]),
      transform: [{ translateX: (scrollX.get() - index * width) * 0.25 }, { scale: interpolate(near, [0, 1], [0.94, 1]) }],
    };
  });
  const copy = useAnimatedStyle(() => ({ opacity: interpolate(dotProgress(scrollX.get(), width, index), [0, 0.6, 1], [0, 0.4, 1]) }));
  return (
    <View style={[styles.page, { width }]}>
      <Animated.View style={[styles.art, art]}>
        <View style={styles.sample}>
          <Chip label={tip.chip} tone={tip.tone} />
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 19, marginTop: 10 }}>{tip.sample}</AppText>
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {tip.sampleLine}
          </AppText>
        </View>
      </Animated.View>
      <Animated.View
        accessible
        accessibilityLabel={t('account.tips.pageLabel', { index: index + 1, total, title: tip.title.replace('\n', ' '), body: tip.body })}
        style={[{ gap: 12 }, copy]}
      >
        <AppText variant="title">{tip.title}</AppText>
        <AppText variant="caption" style={{ fontSize: 17, lineHeight: 25 }}>
          {tip.body}
        </AppText>
      </Animated.View>
    </View>
  );
}

/** A dot that stretches into a pill and takes the accent colour as its page scrolls into view. */
function PagerDot({ index, width, scrollX }: { index: number; width: number; scrollX: SharedValue<number> }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const { border, accent } = colors;
  const style = useAnimatedStyle(() => {
    const near = dotProgress(scrollX.get(), width, index);
    return { width: interpolate(near, [0, 1], [8, 24]), backgroundColor: interpolateColor(near, [0, 1], [border, accent]) };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

export default function TipsScreen() {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { child } = useChildren();
  const markSeen = usePrefsStore((s) => s.markTipsSeen);
  const [index, setIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const scroller = useRef<ScrollView | null>(null);
  const tips = tipsFor(child ? firstName(child.name) : t('account.tips.yourChild'), t);
  const last = index === tips.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });
  const setScroller = useCallback((node: unknown) => {
    scroller.current = node as ScrollView | null;
  }, []);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const landed = pageIndex(e.nativeEvent.contentOffset.x, width, tips.length);
    if (landed !== index) {
      tapHaptic();
      setIndex(landed);
    }
  };

  const goNext = () => {
    scroller.current?.scrollTo({ x: (index + 1) * width, y: 0, animated: true });
    setIndex(index + 1);
  };

  const finish = () => {
    markSeen();
    router.replace('/(app)/(tabs)');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.top}>
        {last ? null : (
          <Animated.View entering={enterFade(0)} exiting={exitFade}>
            <PressableScale accessibilityRole="button" accessibilityLabel={t('account.tips.skipLabel')} haptic={false} onPress={finish} style={styles.skip}>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.muted }}>{t('account.tips.skip')}</AppText>
            </PressableScale>
          </Animated.View>
        )}
      </View>

      <Animated.ScrollView
        ref={setScroller}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={settle}
        style={styles.pager}
      >
        {tips.map((tip, i) => (
          <TipPage key={tip.id} tip={tip} index={i} width={width} scrollX={scrollX} total={tips.length} />
        ))}
      </Animated.ScrollView>

      <View style={styles.bottom}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.dots}>
          {tips.map((tip, i) => (
            <PagerDot key={tip.id} index={i} width={width} scrollX={scrollX} />
          ))}
        </View>
        <View style={styles.cta}>
          {last ? (
            <Animated.View key="start" entering={enterFade(0)} exiting={exitFade} style={styles.ctaFill}>
              <PressableScale accessibilityRole="button" haptic="press" onPress={finish} style={styles.start}>
                <AppText maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.onAccent }}>{t('account.tips.start')}</AppText>
              </PressableScale>
            </Animated.View>
          ) : (
            <Animated.View key="next" entering={enterFade(0)} exiting={exitFade} style={styles.ctaFill}>
              <PressableScale accessibilityRole="button" onPress={goNext} style={styles.nextButton}>
                <AppText maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.accentInk }}>{t('account.tips.next')}</AppText>
              </PressableScale>
            </Animated.View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    top: { alignItems: 'flex-end', minHeight: 52, paddingTop: 8, paddingHorizontal: 24 },
    skip: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    pager: { flex: 1 },
    page: { justifyContent: 'center', gap: 28, paddingHorizontal: 24 },
    art: { minHeight: 240, borderRadius: radius.hero, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center', padding: 24 },
    sample: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: 24, padding: 20, ...shadow.card },
    bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 },
    dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { height: 8, borderRadius: 4 },
    cta: { width: 148, height: 52 },
    ctaFill: { ...StyleSheet.absoluteFill },
    start: { flex: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
    nextButton: { flex: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentTint },
  });
