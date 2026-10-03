import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { WashCard } from '@/components/account/surfaces';
import { AppText, Chip } from '@/components/ui';
import { useT } from '@/i18n';
import type { AttendanceStatus } from '@/types/parent';
import { PressableScale } from '@/motion/pressable-scale';
import { SPRING } from '@/motion/tokens';
import type { Hero, Tone } from '@/lib/status-copy';
import { fonts, radius, useThemed, type Theme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const GLYPH = 56;
const RING_RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const toneColors = ({ colors }: Theme): Record<Tone, { bg: string; fg: string }> => ({
  good: { bg: colors.goodBg, fg: colors.goodFg },
  warn: { bg: colors.warnBg, fg: colors.warnFg },
  bad: { bg: colors.badBg, fg: colors.badFg },
  neutral: { bg: colors.card, fg: colors.accentInk },
});

const iconFor = (status: AttendanceStatus): React.ComponentProps<typeof Feather>['name'] => {
  switch (status) {
    case 'present':
      return 'check';
    case 'late':
      return 'clock';
    case 'absent':
      return 'x';
    case 'leave':
      return 'calendar';
    default:
      return 'minus';
  }
};

/** A ring that draws itself, then the symbol grows in from 0.25. Plays once, when the hero first appears. */
function StatusGlyph({ tone, icon }: { tone: Tone; icon: React.ComponentProps<typeof Feather>['name'] }) {
  const reduced = useReducedMotion();
  const ring = useSharedValue(reduced ? 1 : 0);
  const mark = useSharedValue(reduced ? 1 : 0);
  const c = useThemed(toneColors)[tone];

  useEffect(() => {
    if (reduced) return;
    ring.set(withDelay(240, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })));
    mark.set(withDelay(520, withSpring(1, SPRING)));
  }, [reduced, ring, mark]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - ring.get()) }));
  const markStyle = useAnimatedStyle(() => ({ opacity: mark.get(), transform: [{ scale: 0.25 + 0.75 * mark.get() }] }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={styles.glyph}>
      <Svg width={GLYPH} height={GLYPH} viewBox={`0 0 ${GLYPH} ${GLYPH}`}>
        <Circle cx={GLYPH / 2} cy={GLYPH / 2} r={RING_RADIUS} fill={c.bg} />
        <AnimatedCircle
          cx={GLYPH / 2}
          cy={GLYPH / 2}
          r={RING_RADIUS}
          stroke={c.fg}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          rotation={-90}
          origin={`${GLYPH / 2}, ${GLYPH / 2}`}
          animatedProps={ringProps}
        />
      </Svg>
      <Animated.View style={[styles.mark, markStyle]}>
        <Feather name={icon} size={26} color={c.fg} />
      </Animated.View>
    </View>
  );
}

/** The Today hero: status, a gradient wash in the school accent, and an animated glyph. Taps through to Attendance. */
export function AttendanceHero({ hero, status }: { hero: Hero; status: AttendanceStatus }) {
  const t = useT();
  return (
    <Link href="/(app)/attendance" asChild>
      <PressableScale accessibilityRole="button" accessibilityLabel={t('account.today.attendanceLabel', { title: hero.title, chip: hero.chip })} scaleTo={0.98} style={styles.press}>
        <WashCard>
          <View style={styles.row}>
            <View style={styles.text}>
              <Chip label={hero.chip} tone={hero.tone} />
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, marginTop: 16 }}>{hero.title}</AppText>
              <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>
                {hero.subtitle}
              </AppText>
            </View>
            <StatusGlyph tone={hero.tone} icon={iconFor(status)} />
          </View>
        </WashCard>
      </PressableScale>
    </Link>
  );
}

const styles = StyleSheet.create({
  press: { borderRadius: radius.hero },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  text: { flex: 1 },
  glyph: { width: GLYPH, height: GLYPH },
  mark: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
