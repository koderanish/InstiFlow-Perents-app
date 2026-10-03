import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, type TextInput, View } from 'react-native';

import { authApi } from '@/api/services';
import { Hint } from '@/components/account/bits';
import { FormScreen } from '@/components/account/form-screen';
import { useGoBack } from '@/components/account/nav';
import { PasswordField } from '@/components/account/password-field';
import { AppText, BackHeader, Card, Chip, PrimaryButton } from '@/components/ui';
import { friendlyError, validationMessage } from '@/lib/errors';
import { checkChangePassword } from '@/lib/password';
import { colors, fonts } from '@/theme';

function RuleLine({ label, met }: { label: string; met: boolean }) {
  return (
    <View accessible accessibilityLabel={`${label}, ${met ? 'done' : 'not yet'}`} style={styles.rule}>
      <Feather name={met ? 'check-circle' : 'circle'} size={16} color={met ? colors.goodFg : colors.faint} />
      <AppText style={{ fontSize: 14, color: met ? colors.goodFg : colors.muted, fontFamily: met ? fonts.semibold : fonts.body }}>{label}</AppText>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const goBack = useGoBack();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const nextRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const change = useMutation({ mutationFn: authApi.changePassword });
  const check = checkChangePassword({ current, next, confirm });
  const touched = next.length > 0 || confirm.length > 0;

  const submit = () => {
    if (!check.ok || change.isPending) return;
    Keyboard.dismiss();
    setError(null);
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          setConfirm('');
          setDone(true);
        },
        onError: (e) => setError(validationMessage(e) ?? friendlyError(e)),
      },
    );
  };

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setError(null);
    setDone(false);
  };

  return (
    <FormScreen header={<BackHeader title="Change password" subtitle="Use a password only you know" onBack={goBack} />}>
      {done ? (
        <Card>
          <Chip label="Password changed" tone="good" />
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 20, marginTop: 12 }}>Your new password is ready</AppText>
          <AppText variant="caption" style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>
            You stay signed in on this phone. If you were signed in on another phone, it will ask you to sign in again.
          </AppText>
        </Card>
      ) : null}

      <View style={{ gap: 18 }}>
        <PasswordField label="Current password" value={current} onChangeText={edit(setCurrent)} autoComplete="current-password" returnKeyType="next" onSubmitEditing={() => nextRef.current?.focus()} />
        <PasswordField inputRef={nextRef} label="New password" value={next} onChangeText={edit(setNext)} autoComplete="new-password" returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
        <View style={styles.rules}>
          {check.rules.map((r) => (
            <RuleLine key={r.id} label={r.label} met={r.met} />
          ))}
          <RuleLine label="Different from your current password" met={check.differs} />
        </View>
        <PasswordField inputRef={confirmRef} label="Confirm new password" value={confirm} onChangeText={edit(setConfirm)} autoComplete="new-password" returnKeyType="done" onSubmitEditing={submit} />
        {confirm.length > 0 ? <RuleLine label={check.matches ? 'Both passwords match' : 'The two passwords do not match yet'} met={check.matches} /> : null}
      </View>

      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.badFg, fontFamily: fonts.medium, fontSize: 14, paddingHorizontal: 4 }}>
          {error}
        </AppText>
      ) : null}
      <PrimaryButton label="Change password" onPress={submit} loading={change.isPending} disabled={!check.ok} />
      {touched && check.blocker ? <Hint>{check.blocker}</Hint> : null}
      <Hint>If you forgot your current password, ask the school office to reset it.</Hint>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  rules: { gap: 6, paddingHorizontal: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 22 },
});
