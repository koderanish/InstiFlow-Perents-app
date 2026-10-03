import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStyles, useTheme, type Theme } from '@/theme';

/** Like `Screen`, but the keyboard never covers a field and taps on buttons work while it is open. */
export function FormScreen({
  header,
  children,
  refreshing,
  onRefresh,
}: PropsWithChildren<{ header?: ReactNode; refreshing?: boolean; onRefresh?: () => void }>) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    page: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 20 },
  });
