import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Avatar } from '@/components/account/bits';
import { AppText } from '@/components/ui';
import { useT } from '@/i18n';
import { firstName } from '@/lib/format';
import { tapHaptic } from '@/motion/haptics';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { EXIT_MS, SPRING } from '@/motion/tokens';
import { useChildStore } from '@/stores/child-store';
import { fonts, radius, useStyles, useTheme, type Theme } from '@/theme';
import type { ParentChild } from '@/types/parent';

/** Drag further than this (px), or flick faster than the velocity (px/s), and the sheet closes. */
const DISMISS_DISTANCE = 90;
const DISMISS_VELOCITY = 800;
/** The backdrop is fully dim at rest and clear once the sheet has dropped this far. */
const BACKDROP_FADE_RANGE = 320;

/**
 * Bottom sheet to choose which child the app shows. Springs up, closes on a tap of the dim backdrop,
 * a pull down on the sheet, or the Android back button. Mount it only while it should be open:
 * it plays its own exit and then calls `onClose`.
 */
export function ChildSheet({ items, selectedId, onClose }: { items: ParentChild[]; selectedId: number | undefined; onClose: () => void }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const reduced = useReducedMotion();
  const select = useChildStore((s) => s.select);
  // Distance the sheet is pushed down from its resting place; the screen height means fully off screen.
  const y = useSharedValue(screenHeight);

  useEffect(() => {
    y.set(reduced ? 0 : withSpring(0, SPRING));
  }, [reduced, y]);

  const dismiss = useCallback(() => {
    if (reduced) {
      onClose();
      return;
    }
    y.set(
      withTiming(screenHeight, { duration: EXIT_MS }, (finished) => {
        if (finished) scheduleOnRN(onClose);
      }),
    );
  }, [onClose, reduced, screenHeight, y]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          y.set(Math.max(0, e.translationY));
        })
        .onEnd((e) => {
          if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
            y.set(
              withTiming(screenHeight, { duration: EXIT_MS }, (finished) => {
                if (finished) scheduleOnRN(onClose);
              }),
            );
          } else {
            y.set(withSpring(0, SPRING));
          }
        }),
    [onClose, screenHeight, y],
  );

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: interpolate(y.get(), [0, BACKDROP_FADE_RANGE], [1, 0], Extrapolation.CLAMP) }));

  const choose = (id: number) => {
    select(id);
    dismiss();
  };

  return (
    <Modal transparent animationType="none" statusBarTranslucent visible onRequestClose={dismiss}>
      <GestureHandlerRootView style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={dismiss} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View style={styles.bottom}>
          <GestureDetector gesture={pan}>
            <Animated.View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }, sheetStyle]}>
              <View accessibilityElementsHidden importantForAccessibility="no" style={styles.grabber} />
              <AppText accessibilityRole="header" style={styles.title}>
                {t('account.switcher.title')}
              </AppText>
              <View style={styles.list}>
                {items.map((c, i) => {
                  const on = c.id === selectedId;
                  return (
                    <Reveal key={c.id} index={i}>
                      <PressableScale
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={on ? t('account.switcher.rowSelected', { name: c.name }) : t('account.chips.show', { name: c.name })}
                        haptic={false}
                        scaleTo={0.985}
                        onPress={() => {
                          if (!on) tapHaptic();
                          choose(c.id);
                        }}
                        style={[styles.row, on && styles.rowOn]}
                      >
                        <Avatar name={c.name} />
                        <View style={{ flex: 1 }}>
                          <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 16 }}>
                            {firstName(c.name)}
                          </AppText>
                          {c.className ? (
                            <AppText variant="caption" numberOfLines={1} style={{ marginTop: 2 }}>
                              {c.className}
                            </AppText>
                          ) : null}
                        </View>
                        {on ? <Feather name="check-circle" size={22} color={colors.accentInk} /> : null}
                      </PressableScale>
                    </Reveal>
                  );
                })}
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

/** The pill on Today that shows who you are looking at and opens the child sheet. Hidden for a single child. */
export function ChildSwitcher({ items, selectedId, revealIndex = 2 }: { items: ParentChild[]; selectedId: number | undefined; revealIndex?: number }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const [open, setOpen] = useState(false);
  const closeSheet = useCallback(() => setOpen(false), []);
  if (items.length < 2) return null;
  const current = items.find((c) => c.id === selectedId) ?? items[0];
  if (!current) return null;
  return (
    <Reveal index={revealIndex} style={styles.pillWrap}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t('account.switcher.open', { name: current.name })}
        accessibilityHint={t('account.switcher.hint')}
        hitSlop={4}
        onPress={() => setOpen(true)}
        style={styles.pill}
      >
        <Avatar name={current.name} size={28} />
        <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 15, flexShrink: 1 }}>
          {firstName(current.name)}
        </AppText>
        <Feather name="chevron-down" size={18} color={colors.muted} />
      </PressableScale>
      {open ? <ChildSheet items={items} selectedId={current.id} onClose={closeSheet} /> : null}
    </Reveal>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    fill: { flex: 1 },
    backdrop: { backgroundColor: colors.scrim },
    bottom: { flex: 1, justifyContent: 'flex-end', pointerEvents: 'box-none' },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.hero, borderTopRightRadius: radius.hero, paddingHorizontal: 20, paddingTop: 10, gap: 14 },
    grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border },
    title: { fontFamily: fonts.semibold, fontSize: 20, letterSpacing: -0.3 },
    list: { gap: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.card, backgroundColor: colors.bg },
    rowOn: { backgroundColor: colors.accentTint },
    pillWrap: { alignSelf: 'flex-start' },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingLeft: 8, paddingRight: 14, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  });
