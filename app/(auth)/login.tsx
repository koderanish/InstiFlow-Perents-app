import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, PrimaryButton } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useAuthStore } from '@/stores/auth-store';
import { colors, fonts } from '@/theme';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 3 && password.length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <AppText style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.accentInk }}>{SCHOOL.shortName}</AppText>
          </View>
          <AppText variant="caption" style={{ marginTop: 16, fontFamily: fonts.medium }}>{SCHOOL.name}</AppText>
          <AppText variant="title" style={{ fontSize: 34, lineHeight: 37, marginTop: 8 }}>Welcome back</AppText>

          <View style={{ marginTop: 36, gap: 18 }}>
            <View style={{ gap: 8 }}>
              <AppText variant="label">Email</AppText>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.faint}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={{ gap: 8 }}>
              <AppText variant="label">Password</AppText>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="password"
                placeholder="Your password"
                placeholderTextColor={colors.faint}
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={submit}
              />
            </View>
            {error ? (
              <AppText accessibilityRole="alert" style={{ color: colors.badFg, fontFamily: fonts.medium, fontSize: 14 }}>
                {error}
              </AppText>
            ) : null}
            <PrimaryButton label="Sign in" onPress={submit} loading={busy} disabled={!canSubmit} />
          </View>

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
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0D9',
    backgroundColor: colors.card,
    paddingHorizontal: 18,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  footer: { marginTop: 'auto', paddingTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerMark: { width: 14, height: 14, borderRadius: 4, backgroundColor: '#FF4F2E' },
});
