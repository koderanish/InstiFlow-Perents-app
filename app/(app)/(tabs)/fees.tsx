import { ChildGate } from '@/components/child-gate';
import { AppText, Card, Chip, EmptyState, ErrorState, ListCard, ListRow, Loading, Screen } from '@/components/ui';
import { useFees } from '@/features/parent/hooks';
import { dayMonth, rupees } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { feesLine } from '@/lib/status-copy';
import { fonts } from '@/theme';
import type { Invoice } from '@/types/parent';

const invoiceChip = (inv: Invoice, today: string): { label: string; tone: 'good' | 'warn' | 'bad' } => {
  if (inv.balance <= 0) return { label: 'Paid', tone: 'good' };
  if (inv.dueDate < today) return { label: `Overdue, ${rupees(inv.balance)}`, tone: 'bad' };
  return { label: `Due ${dayMonth(inv.dueDate) ?? ''}`.trim(), tone: 'warn' };
};

const dueText = (day: string | null, overdue: boolean): string => {
  const when = dayMonth(day);
  if (!when) return 'Please pay at the school office';
  return overdue ? `Was due ${when}` : `Due by ${when}`;
};

function FeesBody({ childId }: { childId: number }) {
  const q = useFees(childId);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  const line = feesLine(q.data.summary);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <Card hero>
        {line ? (
          <>
            <Chip label={q.data.summary.overdue ? 'Overdue' : 'Due'} tone={q.data.summary.overdue ? 'bad' : 'warn'} />
            <AppText style={{ fontFamily: fonts.display, fontSize: 52, lineHeight: 56, marginTop: 14 }}>{rupees(q.data.summary.dueAmount)}</AppText>
            <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>{dueText(q.data.summary.nextDueDate, q.data.summary.overdue)}</AppText>
          </>
        ) : (
          <>
            <Chip label="All paid" tone="good" />
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 24, marginTop: 14 }}>Nothing is due</AppText>
          </>
        )}
      </Card>
      {q.data.invoices.length === 0 ? (
        <EmptyState title="No fee invoices yet" message="Invoices will appear here when the school generates them." />
      ) : (
        <>
          <AppText variant="heading">This year</AppText>
          <ListCard>
            {q.data.invoices.map((inv, i) => {
              const chip = invoiceChip(inv, today);
              return (
                <ListRow
                  key={inv.id}
                  title={inv.period}
                  subtitle={rupees(inv.total)}
                  last={i === q.data.invoices.length - 1}
                  right={<Chip label={chip.label} tone={chip.tone} />}
                />
              );
            })}
          </ListCard>
        </>
      )}
    </>
  );
}

export default function FeesScreen() {
  return (
    <Screen>
      <AppText variant="title">Fees</AppText>
      <ChildGate>{(child) => <FeesBody childId={child.id} />}</ChildGate>
    </Screen>
  );
}
