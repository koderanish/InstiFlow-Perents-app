import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { mix, radius, useStyles, useTheme, type Palette, type Theme } from '@/theme';

/** A whisper of the school accent, lighter than `accentTint`. For trays and quiet backgrounds. */
export const washOf = (colors: Palette): string => mix(colors.accent, colors.card, 0.94);

/** The wash colour for the current theme. */
export const useWash = (): string => washOf(useTheme().colors);

/**
 * A card with a soft gradient wash that fades from `tint` into the card colour. The shadow sits on the
 * outer view and the clipping on the inner one, so the shadow is not cut off on iOS.
 */
export function WashCard({
  children,
  tint,
  padding = 24,
  style,
}: PropsWithChildren<{ tint?: string; padding?: number; style?: StyleProp<ViewStyle> }>) {
  const styles = useStyles(createStyles);
  const { colors, shadow } = useTheme();
  return (
    <View style={[styles.washOuter, shadow.card, style]}>
      <View style={[styles.washInner, { padding }]}>
        <LinearGradient colors={[tint ?? colors.accentTint, colors.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.9 }} style={StyleSheet.absoluteFill} />
        {children}
      </View>
    </View>
  );
}

export const TRAY_PADDING = 6;

/** A tinted tray that holds a card-coloured list. The list's corners are the tray's minus the padding, so they stay concentric. */
export function Tray({ children, tint }: PropsWithChildren<{ tint?: string }>) {
  const styles = useStyles(createStyles);
  const wash = useWash();
  return <View style={[styles.tray, { backgroundColor: tint ?? wash }]}>{children}</View>;
}

export function InsetList({ children }: PropsWithChildren) {
  const styles = useStyles(createStyles);
  const { shadow } = useTheme();
  return <View style={[styles.inset, shadow.card]}>{children}</View>;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    washOuter: { backgroundColor: colors.card, borderRadius: radius.hero },
    washInner: { borderRadius: radius.hero, overflow: 'hidden' },
    tray: { borderRadius: radius.card, padding: TRAY_PADDING },
    inset: { backgroundColor: colors.card, borderRadius: radius.card - TRAY_PADDING },
  });
