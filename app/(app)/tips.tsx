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
import { firstName } from '@/lib/format';
import { dotProgress, pageIndex } from '@/lib/pager';
import type { Tone } from '@/lib/status-copy';
import { tapHaptic } from '@/motion/haptics';
import { enterFade, exitFade } from '@/motion/presets';
import { PressableScale } from '@/motion/pressable-scale';
import { usePrefsStore } from '@/stores/prefs-store';
import { colors, fonts, radius, shadow } from '@/theme';

interface Tip {
  chip: string;
  tone: Tone;
  sample: string;
  sampleLine: string;
  title: string;
  body: string;
}

const tipsFor = (kid: string): Tip[] => [
  {
    chip: 'Today',
    tone: 'good',
    sample: `${kid} is at school`,
    sampleLine: 'Attendance, bus and fees in one place',
    title: `See ${kid}'s day\nat a glance`,
    body: 'The Today tab shows attendance, the school bus and anything due. Pull down to refresh.',
  },
  {
    chip: 'Fees',
    tone: 'warn',
    sample: 'Term fees',
    sampleLine: 'Open any invoice to see its receipt',
    title: 'Check fees\nand receipts',
    body: 'See what is due and share a receipt. For now, fees are paid at the school office.',
  },
  {
    chip: 'Leave note',
    tone: 'neutral',
    sample: `${kid} will be away`,
    sampleLine: 'Send a note from your Profile',
    title: 'Tell the school\nwhen needed',
    body: 'Send a leave note and read school notices in the Inbox. You can change your choices in Profile.',
  },
];

/** One card of the pager. Its art drifts a little slower than the page and the whole card fades as it leaves. */
function TipPage({ tip, index, width, scrollX, total }: { tip: Tip; index: number; width: number; scrollX: SharedValue<number>; total: number }) {
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
        <View style={[styles.sample, shadow.card]}>
          <Chip label={tip.chip} tone={tip.tone} />
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 19, marginTop: 10 }}>{tip.sample}</AppText>
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {tip.sampleLine}
          </AppText>
        </View>
      </Animated.View>
      <Animated.View accessible accessibilityLabel={`Tip ${index + 1} of ${total}. ${tip.title.replace('\n', ' ')}. ${tip.body}`} style={[{ gap: 12 }, copy]}>
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
  const style = useAnimatedStyle(() => {
    const near = dotProgress(scrollX.get(), width, index);
    return { width: interpolate(near, [0, 1], [8, 24]), backgroundColor: interpolateColor(near, [0, 1], [colors.border, colors.accent]) };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

export default function TipsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { child } = useChildren();
  const markSeen = usePrefsStore((s) => s.markTipsSeen);
  const [index, setIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const scroller = useRef<ScrollView | null>(null);
  const tips = tipsFor(child ? firstName(child.name) : 'Your child');
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
            <PressableScale accessibilityRole="button" accessibilityLabel="Skip the tips" haptic={false} onPress={finish} style={styles.skip}>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.muted }}>Skip</AppText>
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
          <TipPage key={tip.chip} tip={tip} index={i} width={width} scrollX={scrollX} total={tips.length} />
        ))}
      </Animated.ScrollView>

      <View style={styles.bottom}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.dots}>
          {tips.map((t, i) => (
            <PagerDot key={t.chip} index={i} width={width} scrollX={scrollX} />
          ))}
        </View>
        <View style={styles.cta}>
          {last ? (
            <Animated.View key="start" entering={enterFade(0)} exiting={exitFade} style={styles.ctaFill}>
              <PressableScale accessibilityRole="button" haptic="press" onPress={finish} style={[styles.next, { backgroundColor: colors.accent }]}>
                <AppText maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.onAccent }}>Get started</AppText>
              </PressableScale>
            </Animated.View>
          ) : (
            <Animated.View key="next" entering={enterFade(0)} exiting={exitFade} style={styles.ctaFill}>
              <PressableScale accessibilityRole="button" onPress={goNext} style={[styles.next, { backgroundColor: colors.accentTint }]}>
                <AppText maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.accentInk }}>Next</AppText>
              </PressableScale>
            </Animated.View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { alignItems: 'flex-end', minHeight: 52, paddingTop: 8, paddingHorizontal: 24 },
  skip: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  pager: { flex: 1 },
  page: { justifyContent: 'center', gap: 28, paddingHorizontal: 24 },
  art: { minHeight: 240, borderRadius: radius.hero, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sample: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: 24, padding: 20 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  cta: { width: 148, height: 52 },
  ctaFill: { ...StyleSheet.absoluteFill },
  next: { flex: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
