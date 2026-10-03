import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useErrorText, useIsOffline } from '@/components/account/error-text';
import { AppText, EmptyState, ErrorState } from '@/components/ui';
import { useChildren } from '@/features/parent/hooks';
import { useLocale, useT } from '@/i18n';
import { isOffline } from '@/lib/errors';
import { clock } from '@/lib/format';
import { enterRise, exitFade } from '@/motion/presets';
import { Skeleton } from '@/motion/skeleton';
import { fonts, useStyles, type Theme } from '@/theme';

/** Placeholder blocks while the first load runs (matches the approved loading board). They breathe, they do not spin. */
export function SkeletonCards({ rows = 3 }: { rows?: number }) {
  const styles = useStyles(createStyles);
  const t = useT();
  return (
    <View accessible accessibilityLabel={t('common.loading')} accessibilityState={{ busy: true }} style={styles.skeletonWrap}>
      <Skeleton width="55%" height={28} rounded={10} />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton width="38%" height={16} />
          <Skeleton width="82%" height={12} style={{ marginTop: 10 }} />
          <Skeleton width="64%" height={12} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

/** "No internet" strip shown above saved data when a refresh fails. */
export function StaleBanner({ error, savedAt }: { error: unknown; savedAt: number }) {
  const styles = useStyles(createStyles);
  const t = useT();
  const locale = useLocale();
  const phoneOffline = useIsOffline();
  const when = savedAt > 0 ? clock(new Date(savedAt).toISOString(), locale) : null;
  const offline = phoneOffline || isOffline(error);
  const text = offline
    ? when
      ? t('account.stale.offlineAt', { time: when })
      : t('account.stale.offline')
    : when
      ? t('account.stale.failedAt', { time: when })
      : t('account.stale.failed');
  return (
    <Animated.View accessibilityRole="alert" entering={enterRise(0)} exiting={exitFade} style={styles.banner}>
      <View style={styles.bannerDot} />
      <AppText style={styles.bannerText}>{text}</AppText>
    </Animated.View>
  );
}

/**
 * Shows loading, error or (when `isEmpty` says so) empty states for one query,
 * and the data otherwise. Saved data stays on screen with a banner if a refresh fails.
 */
export function QueryBoundary<T>({
  query,
  isEmpty,
  empty,
  children,
}: {
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  empty?: { title: string; message?: string };
  children: (data: T) => ReactNode;
}) {
  const errorText = useErrorText();
  const { data } = query;
  if (data === undefined) {
    if (query.isError) return <ErrorState message={errorText(query.error)} onRetry={() => void query.refetch()} />;
    return <SkeletonCards />;
  }
  if (isEmpty?.(data) && empty) return <EmptyState title={empty.title} message={empty.message} />;
  return (
    <>
      {query.isError ? <StaleBanner error={query.error} savedAt={query.dataUpdatedAt} /> : null}
      {children(data)}
    </>
  );
}

/** Resolves which child a page is about; `gate` is the state to show until one is known. */
export function useChildPage() {
  const t = useT();
  const errorText = useErrorText();
  const { child, children: all, isLoading, isError, error, refetch } = useChildren();
  let gate: ReactNode = null;
  if (isLoading) gate = <SkeletonCards />;
  else if (isError && !child) gate = <ErrorState message={errorText(error)} onRetry={() => void refetch()} />;
  else if (!child) {
    gate = <EmptyState title={t('account.noChildren.title')} message={t('account.noChildren.message')} />;
  }
  return { child, all, gate, refetch };
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    skeletonWrap: { gap: 16 },
    skeletonCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20 },
    banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warnBg, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bannerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.warnFg },
    bannerText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.warnFg },
  });
