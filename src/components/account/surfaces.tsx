import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, mix, radius, shadow } from '@/theme';

/** A whisper of the school accent, lighter than `accentTint`. For trays and quiet backgrounds. */
export const wash = mix(colors.accent, '#FFFFFF', 0.94);

/**
 * A card with a soft gradient wash that fades from `tint` into white. The shadow sits on the outer
 * view and the clipping on the inner one, so the shadow is not cut off on iOS.
 */
export function WashCard({
  children,
  tint = colors.accentTint,
  padding = 24,
  style,
}: PropsWithChildren<{ tint?: string; padding?: number; style?: StyleProp<ViewStyle> }>) {
  return (
    <View style={[styles.washOuter, shadow.card, style]}>
      <View style={[styles.washInner, { padding }]}>
        <LinearGradient colors={[tint, colors.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.9 }} style={StyleSheet.absoluteFill} />
        {children}
      </View>
    </View>
  );
}

export const TRAY_PADDING = 6;

/** A tinted tray that holds a white list. The list's corners are the tray's minus the padding, so they stay concentric. */
export function Tray({ children, tint = wash }: PropsWithChildren<{ tint?: string }>) {
  return <View style={[styles.tray, { backgroundColor: tint }]}>{children}</View>;
}

export function InsetList({ children }: PropsWithChildren) {
  return <View style={[styles.inset, shadow.card]}>{children}</View>;
}

const styles = StyleSheet.create({
  washOuter: { backgroundColor: colors.card, borderRadius: radius.hero },
  washInner: { borderRadius: radius.hero, overflow: 'hidden' },
  tray: { borderRadius: radius.card, padding: TRAY_PADDING },
  inset: { backgroundColor: colors.card, borderRadius: radius.card - TRAY_PADDING },
});
