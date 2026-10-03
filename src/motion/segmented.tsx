import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

import { tapHaptic } from './haptics';
import { PressableScale } from './pressable-scale';
import { SPRING } from './tokens';

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
  /** Spoken label, when the visible one is short ("Mon" -> "Monday"). */
  spoken?: string;
  /** Small accent marker under the label, e.g. today. */
  dot?: boolean;
}

const PAD = 4;
const HEIGHT = 44;

/**
 * Pill selector with a sliding highlight (day of the week, list filter). The pill travels on a
 * critically damped spring so it never overshoots, and a light haptic marks each change.
 * Segments share the width equally and are at least 44pt tall.
 */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentOption<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const count = Math.max(1, options.length);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const segment = width > 0 ? (width - PAD * 2) / count : 0;
  const x = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    setWidth(next);
    // Place the pill on the current option straight away: no slide on first paint.
    x.set(index * ((next - PAD * 2) / count));
  };

  useEffect(() => {
    if (segment <= 0) return;
    const target = index * segment;
    x.set(reduced ? target : withSpring(target, SPRING));
  }, [index, segment, reduced, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} onLayout={onLayout} style={styles.track}>
      {segment > 0 ? <Animated.View pointerEvents="none" style={[styles.pill, { width: segment }, pill]} /> : null}
      {options.map((option) => {
        const on = option.key === value;
        return (
          <PressableScale
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={option.spoken ?? option.label}
            haptic={false}
            scaleTo={0.97}
            onPress={() => {
              if (on) return;
              tapHaptic();
              onChange(option.key);
            }}
            style={styles.segment}
          >
            <AppText
              numberOfLines={1}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.3}
              style={{ fontFamily: on ? fonts.bold : fonts.medium, fontSize: 14, color: on ? colors.ink : colors.muted }}
            >
              {option.label}
            </AppText>
            <View style={[styles.dot, { backgroundColor: option.dot ? colors.accent : 'transparent' }]} />
          </PressableScale>
        );
      })}
    </View>
  );
}

/** In dark mode the pill is the lighter step so it still reads as raised. */
const createStyles = ({ colors, shadow, isDark }: Theme) =>
  StyleSheet.create({
    // Outer radius = pill radius + padding, so the two curves stay concentric.
    track: { flexDirection: 'row', backgroundColor: isDark ? colors.card : colors.border, borderRadius: HEIGHT / 2 + PAD, padding: PAD },
    pill: { position: 'absolute', left: PAD, top: PAD, height: HEIGHT, borderRadius: HEIGHT / 2, backgroundColor: isDark ? colors.border : colors.card, ...shadow.card },
    segment: { flex: 1, minHeight: HEIGHT, borderRadius: HEIGHT / 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  });
