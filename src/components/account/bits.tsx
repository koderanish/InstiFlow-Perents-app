import { Feather } from '@expo/vector-icons';
import type { PropsWithChildren } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui';
import { defaultT, type TFunction } from '@/i18n/translate';
import { PressableScale } from '@/motion/pressable-scale';
import { fonts, radius, useStyles, useTheme, type Theme } from '@/theme';

/** Opens a tel:, mailto: or web link. Tells the parent plainly if the phone cannot. */
export const openUrl = async (url: string, t: TFunction = defaultT): Promise<void> => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(t('account.link.failedTitle'), t('account.link.failedMessage'));
  }
};

export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={{ gap: 10 }}>
      <AppText variant="heading" accessibilityRole="header" style={{ marginHorizontal: 4 }}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function Hint({ children }: PropsWithChildren) {
  return (
    <AppText variant="caption" style={{ fontSize: 13, lineHeight: 19, paddingHorizontal: 4 }}>
      {children}
    </AppText>
  );
}

export interface DetailItem {
  label: string;
  value: string;
  bold?: boolean;
  /** Makes the value a tappable link (call, email, open). */
  onPress?: () => void;
  hint?: string;
}

/** Label on the left, value on the right, as on the Receipt and Child profile boards. */
export function DetailCard({ items }: { items: DetailItem[] }) {
  const styles = useStyles(createStyles);
  const { colors, shadow } = useTheme();
  return (
    <View style={[styles.detailCard, shadow.card]}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const value = (
          <AppText
            style={[
              styles.detailValue,
              item.bold && { fontFamily: fonts.bold },
              item.onPress && { color: colors.accentInk, textDecorationLine: 'underline' },
            ]}
          >
            {item.value}
          </AppText>
        );
        return (
          <View key={`${item.label}-${i}`} style={[styles.detailRow, !last && styles.divider]}>
            <AppText style={[styles.detailLabel, item.bold && { fontFamily: fonts.bold, color: colors.ink }]}>{item.label}</AppText>
            {item.onPress ? (
              <PressableScale
                accessibilityRole="link"
                accessibilityLabel={`${item.label}: ${item.value}`}
                accessibilityHint={item.hint}
                onPress={item.onPress}
                hitSlop={8}
                style={styles.linkValue}
              >
                {value}
              </PressableScale>
            ) : (
              value
            )}
          </View>
        );
      })}
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.36, color: colors.accentInk }}>{letter}</Text>
    </View>
  );
}

/** Round call button, 44pt, used beside a phone number. */
export function CallButton({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} haptic="press" onPress={onPress} style={styles.callButton}>
      <Feather name="phone" size={18} color={colors.accentInk} />
    </PressableScale>
  );
}

/** Outlined full-width button for the second action on a page. */
export function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const styles = useStyles(createStyles);
  return (
    <PressableScale accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} scaleTo={0.97} onPress={onPress} style={styles.secondary}>
      <Text maxFontSizeMultiplier={1.3} style={styles.secondaryText}>
        {label}
      </Text>
    </PressableScale>
  );
}

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    detailCard: { backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 18 },
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 52, paddingVertical: 12 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    detailLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, flexShrink: 0 },
    detailValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, textAlign: 'right', flexShrink: 1 },
    linkValue: { flexShrink: 1, minHeight: 44, justifyContent: 'center' },
    callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
    secondary: { minHeight: 56, borderRadius: radius.button, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, ...shadow.card },
    secondaryText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  });
