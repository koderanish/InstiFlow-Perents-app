import type { ReactNode } from 'react';

import { useErrorText } from '@/components/account/error-text';
import { EmptyState, ErrorState, Loading } from '@/components/ui';
import { useChildren } from '@/features/parent/hooks';
import { useT } from '@/i18n';
import type { ParentChild } from '@/types/parent';

/** Renders `children(child)` once a child is known; otherwise the right loading, error or empty state. */
export function ChildGate({ children }: { children: (child: ParentChild, all: ParentChild[]) => ReactNode }) {
  const t = useT();
  const errorText = useErrorText();
  const { child, children: all, isLoading, isError, error, refetch } = useChildren();
  if (isLoading) return <Loading label={t('common.loading')} />;
  // Saved data keeps showing even when a refresh fails; only a page with nothing to show gets the error.
  if (isError && !child) return <ErrorState message={errorText(error)} onRetry={() => void refetch()} />;
  if (!child) return <EmptyState title={t('account.noChildren.title')} message={t('account.noChildren.message')} />;
  return <>{children(child, all)}</>;
}
