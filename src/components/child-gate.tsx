import type { ReactNode } from 'react';

import { EmptyState, ErrorState, Loading } from '@/components/ui';
import { useChildren } from '@/features/parent/hooks';
import { friendlyError } from '@/lib/errors';
import type { ParentChild } from '@/types/parent';

/** Renders `children(child)` once a child is known; otherwise the right loading, error or empty state. */
export function ChildGate({ children }: { children: (child: ParentChild, all: ParentChild[]) => ReactNode }) {
  const { child, children: all, isLoading, isError, error, refetch } = useChildren();
  if (isLoading) return <Loading label="Loading" />;
  if (isError) return <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />;
  if (!child) {
    return (
      <EmptyState
        title="No children linked yet"
        message="The school has not linked a child to this account. Please contact the school office."
      />
    );
  }
  return <>{children(child, all)}</>;
}
