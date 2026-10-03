import { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/account/error-banner';
import { LoginHero } from '@/components/account/login-hero';
import { Glide, useShake } from '@/components/account/motion-bits';
import { PasswordField } from '@/components/account/password-field';
import { TextField } from '@/components/account/text-field';
import { IconBadge } from '@/components/icon-badge';
import { AppText, PrimaryButton } from '@/components/ui';
import { useT } from '@/i18n';
import { isOffline } from '@/lib/errors';
import { Reveal } from '@/motion/reveal';
import { useAuthStore } from '@/stores/auth-store';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

export default function LoginScreen() {
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const { style: shakeStyle, shake } = useShake();

  const canSubmit = email.trim().length > 3 && password.length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      setError(isOffline(e) ? t('error.network') : e instanceof Error ? e.message : t('account.login.failed'));
      shake();
    } finally {
      setBusy(false);
    }
  };

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (error) setError(null);
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <LoginHero topInset={insets.top} />

          <Reveal index={1} style={styles.sheetWrap}>
            <View style={styles.sheet}>
              <AppText variant="title" style={{ fontSize: 26, lineHeight: 30 }}>{t('account.login.welcome')}</AppText>
              <Animated.View style={[{ gap: 18, marginTop: 22 }, shakeStyle]}>
                <TextField
                  label={t('account.login.email')}
                  error={!!error}
                  left={<Feather name="mail" size={18} color={colors.faint} />}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  returnKeyType="next"
                  value={email}
                  onChangeText={edit(setEmail)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                <PasswordField
                  inputRef={passwordRef}
                  label={t('account.login.password')}
                  error={!!error}
                  left={<Feather name="lock" size={18} color={colors.faint} />}
                  autoComplete="password"
                  returnKeyType="go"
                  value={password}
                  onChangeText={edit(setPassword)}
                  onSubmitEditing={() => void submit()}
                />
                {error ? <ErrorBanner message={error} /> : null}
                <Glide>
                  <PrimaryButton label={t('account.login.submit')} onPress={() => void submit()} loading={busy} disabled={!canSubmit} />
                </Glide>
              </Animated.View>

              <View style={styles.help}>
                <IconBadge name="help-circle" size={36} />
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{t('account.login.helpTitle')}</AppText>
                  <AppText variant="caption" style={{ fontSize: 13, lineHeight: 18, marginTop: 2 }}>
                    {t('account.login.forgot')}
                  </AppText>
                </View>
              </View>
            </View>
          </Reveal>

          <View style={styles.footer}>
            <View style={styles.secure}>
              <Feather name="shield" size={13} color={colors.faint} />
              <AppText variant="caption" style={{ fontSize: 12 }}>{t('account.login.secure')}</AppText>
            </View>
            <View style={styles.secure}>
              <View style={styles.footerMark} />
              <AppText variant="caption" style={{ fontSize: 13 }}>{t('account.poweredBy')}</AppText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { flexGrow: 1 },
    // The form card overlaps the gradient so the two read as one surface.
    sheetWrap: { marginTop: -32 },
    sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 8 },
    help: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, padding: 14, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
    footer: { marginTop: 'auto', paddingTop: 28, paddingBottom: 28, gap: 10, alignItems: 'center' },
    secure: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerMark: { width: 14, height: 14, borderRadius: 4, backgroundColor: colors.accent },
  });
