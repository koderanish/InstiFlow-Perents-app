import { Feather } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { enterRise, exitFade } from '@/motion/presets';
import { colors, fonts } from '@/theme';

/** Inline error that rises in and fades out. Mount it only while there is a message. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <Animated.View accessibilityRole="alert" entering={enterRise(0)} exiting={exitFade} style={styles.banner}>
      <Feather name="alert-circle" size={18} color={colors.badFg} />
      <AppText style={styles.text}>{message}</AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.badBg, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.badFg },
});
