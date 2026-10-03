import { useState, type Ref } from 'react';
import { StyleSheet, type TextInput, type TextInputProps } from 'react-native';

import { IconSwap } from '@/components/account/icon-swap';
import { TextField } from '@/components/account/text-field';
import { PressableScale } from '@/motion/pressable-scale';
import { colors } from '@/theme';

/** Password input with a show/hide button (52 by 56) whose icon cross-fades. */
export function PasswordField({
  label,
  value,
  onChangeText,
  autoComplete,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  autoComplete?: TextInputProps['autoComplete'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: Ref<TextInput>;
  error?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      label={label}
      error={error}
      inputRef={inputRef}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={autoComplete}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      secureTextEntry={!shown}
      value={value}
      onChangeText={onChangeText}
      right={
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onPress={() => setShown((s) => !s)}
          style={styles.eye}
        >
          <IconSwap active={shown} from="eye" to="eye-off" size={20} fromColor={colors.muted} toColor={colors.muted} />
        </PressableScale>
      }
    />
  );
}

const styles = StyleSheet.create({
  eye: { width: 52, height: 56, alignItems: 'center', justifyContent: 'center' },
});
