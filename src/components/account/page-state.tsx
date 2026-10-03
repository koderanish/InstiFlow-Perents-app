import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, EmptyState, ErrorState } from '@/components/ui';
import { useChildren } from '@/features/parent/hooks';
import { friendlyError, isOffline } from '@/lib/errors';
import { clock } from '@/lib/format';
import { colors, fonts } from '@/theme';

/** Placeholder blocks while the first load runs (matches the approved loading board). */
export function SkeletonCards({ rows = 3 }: { rows?: number }) {
  return (
    <View accessible accessibilityLabel="Loading" accessibilityState={{ busy: true }} style={styles.skeletonWrap}>
      <View style={[styles.bar, { width: '55%', height: 28, borderRadius: 10 }]} />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={[styles.bar, { width: '38%', height: 16 }]} />
          <View style={[styles.bar, { width: '82%', height: 12, marginTop: 10 }]} />
          <View style={[styles.bar, { width: '64%', height: 12, marginTop: 8 }]} />
        </View>
      ))}
    </View>
  );
}

/** "No internet" strip shown above saved data when a refresh fails. */
export function StaleBanner({ error, savedAt }: { error: unknown; savedAt: number }) {
  const when = savedAt > 0 ? clock(new Date(savedAt).toISOString()) : null;
  const lead = isOffline(error) ? 'No internet.' : 'Could not refresh.';
  const text = when ? `${lead} Showing what we saved at ${when}.` : `${lead} Showing what we saved.`;
  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <View style={styles.bannerDot} />
      <AppText style={styles.bannerText}>{text}</AppText>
    </View>
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
  const { data } = query;
  if (data === undefined) {
    if (query.isError) return <ErrorState message={friendlyError(query.error)} onRetry={() => void query.refetch()} />;
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
  const { child, children: all, isLoading, isError, error, refetch } = useChildren();
  let gate: ReactNode = null;
  if (isLoading) gate = <SkeletonCards />;
  else if (isError && !child) gate = <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />;
  else if (!child) {
    gate = (
      <EmptyState
        title="No children linked yet"
        message="The school has not linked a child to this account. Please contact the school office."
      />
    );
  }
  return { child, all, gate, refetch };
}

const styles = StyleSheet.create({
  skeletonWrap: { gap: 16 },
  skeletonCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20 },
  bar: { backgroundColor: colors.border, borderRadius: 8 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warnBg, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bannerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.warnFg },
  bannerText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.warnFg },
});
