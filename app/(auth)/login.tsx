import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/account/error-banner';
import { Glide, useShake } from '@/components/account/motion-bits';
import { PasswordField } from '@/components/account/password-field';
import { TextField } from '@/components/account/text-field';
import { AppText, PrimaryButton } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { Reveal } from '@/motion/reveal';
import { useAuthStore } from '@/stores/auth-store';
import { colors, fonts } from '@/theme';

export default function LoginScreen() {
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
      setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
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
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <Reveal index={0}>
            <View style={styles.logo}>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.accentInk }}>{SCHOOL.shortName}</AppText>
            </View>
            <AppText variant="caption" style={{ marginTop: 16, fontFamily: fonts.medium }}>{SCHOOL.name}</AppText>
          </Reveal>
          <Reveal index={1}>
            <AppText variant="title" style={{ fontSize: 34, lineHeight: 37, marginTop: 8 }}>Welcome back</AppText>
          </Reveal>

          <Reveal index={2} style={{ marginTop: 36 }}>
            <Animated.View style={[{ gap: 18 }, shakeStyle]}>
              <TextField
                label="Email"
                error={!!error}
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
                label="Password"
                error={!!error}
                autoComplete="password"
                returnKeyType="go"
                value={password}
                onChangeText={edit(setPassword)}
                onSubmitEditing={() => void submit()}
              />
              {error ? <ErrorBanner message={error} /> : null}
              <Glide>
                <PrimaryButton label="Sign in" onPress={() => void submit()} loading={busy} disabled={!canSubmit} />
              </Glide>
            </Animated.View>
          </Reveal>

          <Reveal index={3}>
            <View style={{ gap: 2, alignItems: 'center', paddingHorizontal: 8, marginTop: 18 }}>
              <AppText variant="caption" style={{ fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
                Forgot your password? Ask the school office to reset it.
              </AppText>
              <AppText variant="caption" style={{ fontSize: 13, fontFamily: fonts.semibold, textAlign: 'center' }}>
                {SCHOOL.name}
              </AppText>
            </View>
          </Reveal>

          <View style={styles.footer}>
            <View style={styles.footerMark} />
            <AppText variant="caption" style={{ fontSize: 13 }}>Powered by InstiFlow</AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 28 },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: 'auto', paddingTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerMark: { width: 14, height: 14, borderRadius: 4, backgroundColor: colors.accent },
});
