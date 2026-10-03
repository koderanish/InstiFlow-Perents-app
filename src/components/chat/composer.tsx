import { Feather } from '@expo/vector-icons';
import { useEffect, useState, type RefObject } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MESSAGE_MAX, remainingChars } from '@/lib/messages';
import { useT } from '@/i18n';
import { PressableScale } from '@/motion/pressable-scale';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  inputRef: RefObject<TextInput | null>;
};

/** True while the on-screen keyboard is up, so the safe-area padding is not added on top of it. */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

export function Composer({ value, onChangeText, onSend, inputRef }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  const canSend = value.trim().length > 0;
  const left = remainingChars(value);

  return (
    <View style={[styles.bar, { paddingBottom: keyboardOpen ? 10 : Math.max(insets.bottom, 10) }]}>
      {left !== null ? (
        <Text accessibilityLiveRegion="polite" style={[styles.counter, left <= 0 && { color: colors.badFg }]}>
          {t('chat.counter', { count: left })}
        </Text>
      ) : null}
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={t('chat.inputLabel')}
          multiline
          maxLength={MESSAGE_MAX}
          value={value}
          onChangeText={onChangeText}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          maxFontSizeMultiplier={1.3}
          textAlignVertical="center"
          style={styles.input}
        />
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          haptic="press"
          onPress={onSend}
          style={[styles.send, canSend ? styles.sendOn : styles.sendOff]}
        >
          <Feather name="send" size={20} color={canSend ? colors.onAccent : colors.faint} />
        </PressableScale>
      </View>
    </View>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    bar: { paddingHorizontal: 12, paddingTop: 10, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
    counter: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, textAlign: 'right', marginBottom: 6, marginRight: 4 },
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    input: {
      flex: 1,
      minHeight: 48,
      maxHeight: 132,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderRadius: 24,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      fontFamily: fonts.medium,
      fontSize: 16,
      color: colors.ink,
    },
    send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    sendOn: { backgroundColor: colors.accent },
    sendOff: { backgroundColor: colors.divider },
  });
