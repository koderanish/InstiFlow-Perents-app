import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, Keyframe, ReduceMotion } from 'react-native-reanimated';

import { SCHOOL } from '@/config/school';
import { colors, fonts, shadow } from '@/theme';

/** The school's letters on a soft accent tile. Uses the school accent, never a fixed colour. */
export function SchoolMark({ size = 64 }: { size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{ width: size, height: size, borderRadius: size * 0.31, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }, size > 80 && shadow.card]}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.36, color: colors.accentInk }}>{SCHOOL.shortName}</Text>
    </View>
  );
}

export function PoweredBy() {
  return (
    <View style={styles.powered}>
      <View style={styles.poweredMark} />
      <Text style={styles.poweredText}>Powered by InstiFlow</Text>
    </View>
  );
}

/** The logo settles in: 0.85 to full size while it fades up. No overshoot. */
const logoIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.85 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.out(Easing.cubic) },
})
  .duration(480)
  .reduceMotion(ReduceMotion.System);

const fadeInAfter = (delay: number) => FadeIn.delay(delay).duration(360).reduceMotion(ReduceMotion.System);

/**
 * Shown while fonts load and the saved sign-in is checked. Matches the approved Splash board.
 * The root layout keeps this mounted and fades it out over the app, so there is no flash between them.
 */
export function BrandSplash() {
  return (
    <View accessible accessibilityLabel={`${SCHOOL.name}, loading`} style={styles.splash}>
      <View style={styles.center}>
        <Animated.View entering={logoIn}>
          <SchoolMark size={112} />
        </Animated.View>
        <Animated.View entering={fadeInAfter(180)}>
          <Text style={styles.name}>{SCHOOL.name}</Text>
        </Animated.View>
      </View>
      <Animated.View entering={fadeInAfter(320)} style={styles.bottom}>
        <PoweredBy />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 20, paddingHorizontal: 32 },
  name: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink, textAlign: 'center' },
  bottom: { position: 'absolute', bottom: 44, left: 0, right: 0, alignItems: 'center' },
  powered: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  poweredMark: { width: 14, height: 14, borderRadius: 4, backgroundColor: colors.accent },
  poweredText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
