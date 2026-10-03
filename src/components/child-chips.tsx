import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { useT } from '@/i18n';
import { firstName } from '@/lib/format';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { SPRING } from '@/motion/tokens';
import { useChildStore } from '@/stores/child-store';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';
import type { ParentChild } from '@/types/parent';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Child switcher: a card-coloured pill on a soft track that slides to whoever is selected.
 * Hidden when there is only one child. Keep it above the keyed content, so it is not remounted on a switch.
 */
export function ChildChips({ items, selectedId, revealIndex = 1 }: { items: ParentChild[]; selectedId: number | undefined; revealIndex?: number }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const select = useChildStore((s) => s.select);
  const reduced = useReducedMotion();
  const rects = useRef<Record<number, Rect>>({});
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const placed = useSharedValue(0);

  const moveTo = useCallback(
    (id: number | undefined) => {
      if (id === undefined) return;
      const r = rects.current[id];
      if (!r) return;
      if (placed.get() === 0 || reduced) {
        x.set(r.x);
        y.set(r.y);
        width.set(r.width);
        height.set(r.height);
        placed.set(1);
        return;
      }
      x.set(withSpring(r.x, SPRING));
      y.set(withSpring(r.y, SPRING));
      width.set(withSpring(r.width, SPRING));
      height.set(r.height);
    },
    [height, placed, reduced, width, x, y],
  );

  useEffect(() => {
    moveTo(selectedId);
  }, [moveTo, selectedId]);

  const pill = useAnimatedStyle(() => ({
    opacity: placed.get(),
    width: width.get(),
    height: height.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }],
  }));

  if (items.length < 2) return null;
  return (
    <Reveal index={revealIndex} style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View style={[styles.pill, pill]} />
        {items.map((c) => {
          const on = c.id === selectedId;
          return (
            <PressableScale
              key={c.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t('account.chips.show', { name: c.name })}
              haptic={on ? false : 'tap'}
              hitSlop={4}
              onPress={() => select(c.id)}
              onLayout={(e) => {
                rects.current[c.id] = e.nativeEvent.layout;
                if (c.id === selectedId) moveTo(c.id);
              }}
              style={styles.chip}
            >
              <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 15, color: on ? colors.ink : colors.muted }}>
                {firstName(c.name)}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </Reveal>
  );
}

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    wrap: { alignSelf: 'flex-start' },
    track: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 4, borderRadius: 24, backgroundColor: colors.border },
    pill: { position: 'absolute', top: 0, left: 0, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
    chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  });
