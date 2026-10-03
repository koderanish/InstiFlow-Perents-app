import { Feather } from '@expo/vector-icons';
import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, fonts } from '@/theme';

/** Password input with a show/hide button that is at least 44pt wide and tall. */
export function PasswordField({
  label,
  value,
  onChangeText,
  autoComplete,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  autoComplete?: TextInputProps['autoComplete'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: Ref<TextInput>;
}) {
  const [shown, setShown] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.box}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={!shown}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onPress={() => setShown((s) => !s)}
          style={styles.eye}
        >
          <Feather name={shown ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#E8E0D9', backgroundColor: colors.card },
  input: { flex: 1, height: 56, paddingLeft: 18, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  eye: { width: 52, height: 56, alignItems: 'center', justifyContent: 'center' },
});
