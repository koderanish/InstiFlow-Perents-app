import type { ReactNode, Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { colors, fonts } from '@/theme';

type TextFieldProps = Omit<TextInputProps, 'style' | 'onFocus' | 'onBlur' | 'placeholderTextColor' | 'accessibilityLabel'> & {
  label: string;
  /** Turns the outline red. */
  error?: boolean;
  /** A control that sits inside the field on the right, such as a show/hide button. */
  right?: ReactNode;
  inputRef?: Ref<TextInput>;
};

/** Labelled input. A focus ring grows around it (colour and width animate) without moving anything else. */
export function TextField({ label, error, right, inputRef, ...input }: TextFieldProps) {
  const reduced = useReducedMotion();
  const focus = useSharedValue(0);

  const ring = useAnimatedStyle(() => ({ opacity: focus.get(), borderWidth: 2 * focus.get() }));
  const move = (to: number) => focus.set(reduced ? to : withTiming(to, { duration: 160 }));

  return (
    <View style={{ gap: 8 }}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.box, error && { borderColor: colors.badFg }]}>
        <TextInput
          {...input}
          ref={inputRef}
          accessibilityLabel={label}
          placeholderTextColor={colors.faint}
          style={styles.input}
          onFocus={() => move(1)}
          onBlur={() => move(0)}
        />
        {right}
        <Animated.View style={[styles.ring, { borderColor: error ? colors.badFg : colors.accent }, ring]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: '#E8E0D9', backgroundColor: colors.card },
  input: { flex: 1, minHeight: 56, paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 16, color: colors.ink, outlineWidth: 0 },
  ring: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 17, pointerEvents: 'none' },
});
