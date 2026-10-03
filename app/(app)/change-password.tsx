import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, type TextInput, View } from 'react-native';

import { authApi } from '@/api/services';
import { Hint } from '@/components/account/bits';
import { DrawnCheck } from '@/components/account/drawn-check';
import { ErrorBanner } from '@/components/account/error-banner';
import { useErrorText } from '@/components/account/error-text';
import { FormScreen } from '@/components/account/form-screen';
import { Glide } from '@/components/account/motion-bits';
import { useGoBack } from '@/components/account/nav';
import { PasswordField } from '@/components/account/password-field';
import { RuleLine, StrengthMeter } from '@/components/account/password-rules';
import { WashCard } from '@/components/account/surfaces';
import { AppText, BackHeader, PrimaryButton } from '@/components/ui';
import { useT } from '@/i18n';
import { validationMessage } from '@/lib/errors';
import { checkChangePassword } from '@/lib/password';
import { passwordStrength } from '@/lib/password-strength';
import { successHaptic } from '@/motion/haptics';
import { Reveal } from '@/motion/reveal';
import { fonts, useTheme } from '@/theme';

export default function ChangePasswordScreen() {
  const t = useT();
  const { colors } = useTheme();
  const errorText = useErrorText();
  const goBack = useGoBack();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const nextRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const change = useMutation({ mutationFn: authApi.changePassword });
  const check = checkChangePassword({ current, next, confirm }, t);
  const strength = passwordStrength(next, t);
  const touched = next.length > 0 || confirm.length > 0;

  const submit = () => {
    if (!check.ok || change.isPending) return;
    Keyboard.dismiss();
    setError(null);
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          successHaptic();
          setCurrent('');
          setNext('');
          setConfirm('');
          setDone(true);
        },
        onError: (e) => setError(validationMessage(e) ?? errorText(e)),
      },
    );
  };

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setError(null);
    setDone(false);
  };

  return (
    <FormScreen header={<BackHeader title={t('account.password.title')} subtitle={t('account.password.subtitle')} onBack={goBack} />}>
      {done ? (
        <Reveal index={0}>
          <WashCard tint={colors.goodBg}>
            <View style={styles.success}>
              <DrawnCheck />
              <View style={{ flex: 1 }}>
                <AppText style={{ fontFamily: fonts.semibold, fontSize: 20 }}>{t('account.password.doneTitle')}</AppText>
                <AppText variant="caption" style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>
                  {t('account.password.doneMessage')}
                </AppText>
              </View>
            </View>
          </WashCard>
        </Reveal>
      ) : null}

      <Reveal index={0} style={{ gap: 18 }}>
        <PasswordField label={t('account.password.current')} value={current} onChangeText={edit(setCurrent)} autoComplete="current-password" returnKeyType="next" onSubmitEditing={() => nextRef.current?.focus()} />
        <PasswordField inputRef={nextRef} label={t('account.password.new')} value={next} onChangeText={edit(setNext)} autoComplete="new-password" returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
        {next.length > 0 ? <StrengthMeter strength={strength} /> : null}
        <View style={styles.rules}>
          {check.rules.map((r) => (
            <RuleLine key={r.id} label={r.label} met={r.met} />
          ))}
          <RuleLine label={t('account.password.rule.different')} met={check.differs} />
        </View>
        <PasswordField inputRef={confirmRef} label={t('account.password.confirm')} value={confirm} onChangeText={edit(setConfirm)} autoComplete="new-password" returnKeyType="done" onSubmitEditing={submit} />
        {confirm.length > 0 ? <RuleLine label={check.matches ? t('account.password.matchYes') : t('account.password.matchNo')} met={check.matches} /> : null}
      </Reveal>

      {error ? <ErrorBanner message={error} /> : null}
      <Glide>
        <PrimaryButton label={t('account.password.submit')} onPress={submit} loading={change.isPending} disabled={!check.ok} />
      </Glide>
      {touched && check.blocker ? <Hint>{check.blocker}</Hint> : null}
      <Hint>{t('account.password.forgot')}</Hint>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  rules: { gap: 6, paddingHorizontal: 4 },
  success: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
