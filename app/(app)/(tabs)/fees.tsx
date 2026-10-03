import { View } from 'react-native';

import { Hint, Section } from '@/components/account/bits';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { ChildChips } from '@/components/child-chips';
import { AppText, Card, Chip, ListCard, ListRow, Screen } from '@/components/ui';
import { useFees } from '@/features/parent/hooks';
import { toISODate } from '@/lib/dates';
import { dayMonth, firstName, rupees } from '@/lib/format';
import { invoiceChip } from '@/lib/receipt';
import { feesLine } from '@/lib/status-copy';
import { fonts } from '@/theme';
import type { FeesData } from '@/types/parent';

const dueText = (day: string | null, overdue: boolean): string => {
  const when = dayMonth(day);
  if (!when) return 'Please pay at the school office';
  return overdue ? `Was due ${when}` : `Due by ${when}`;
};

function FeesContent({ data }: { data: FeesData }) {
  const line = feesLine(data.summary);
  const today = toISODate(new Date());
  const { summary, invoices } = data;
  return (
    <>
      <Card hero>
        {line ? (
          <>
            <Chip label={summary.overdue ? 'Overdue' : 'Due'} tone={summary.overdue ? 'bad' : 'warn'} />
            <AppText variant="caption" style={{ fontSize: 15, marginTop: 14 }}>
              {dueText(summary.nextDueDate, summary.overdue)}
            </AppText>
            <AppText style={{ fontFamily: fonts.display, fontSize: 52, lineHeight: 56, marginTop: 4 }}>{rupees(summary.dueAmount)}</AppText>
            <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>
              {summary.unpaidCount === 1 ? '1 invoice is unpaid' : `${summary.unpaidCount} invoices are unpaid`}
            </AppText>
          </>
        ) : (
          <>
            <Chip label="All paid" tone="good" />
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 24, marginTop: 14 }}>Nothing is due</AppText>
            <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>
              Thank you. Your receipts are listed below.
            </AppText>
          </>
        )}
      </Card>
      {line ? (
        <Hint>Paying online is not available in this app yet. Please pay at the school office and ask for a receipt.</Hint>
      ) : null}
      {invoices.length > 0 ? (
        <Section title="This year">
          <ListCard>
            {invoices.map((inv, i) => {
              const chip = invoiceChip(inv, today);
              return (
                <ListRow
                  key={inv.id}
                  title={inv.period}
                  subtitle={rupees(inv.total)}
                  href={{ pathname: '/(app)/receipt', params: { invoiceId: String(inv.id) } }}
                  last={i === invoices.length - 1}
                  right={<Chip label={chip.label} tone={chip.tone} />}
                />
              );
            })}
          </ListCard>
        </Section>
      ) : null}
    </>
  );
}

export default function FeesScreen() {
  const page = useChildPage();
  const fees = useFees(page.child?.id);
  const sub = page.child ? `${firstName(page.child.name)}${page.child.className ? `, ${page.child.className}` : ''}` : null;
  return (
    <Screen
      refreshing={fees.isRefetching}
      onRefresh={() => {
        void page.refetch();
        void fees.refetch();
      }}
    >
      <View>
        <AppText variant="title">Fees</AppText>
        {sub ? (
          <AppText variant="caption" style={{ marginTop: 4 }}>
            {sub}
          </AppText>
        ) : null}
      </View>
      {page.child ? (
        <>
          <ChildChips items={page.all} selectedId={page.child.id} />
          <QueryBoundary
            query={fees}
            isEmpty={(d) => d.invoices.length === 0 && !feesLine(d.summary)}
            empty={{ title: 'No fee invoices yet', message: 'Invoices will appear here when the school generates them.' }}
          >
            {(data) => <FeesContent data={data} />}
          </QueryBoundary>
        </>
      ) : (
        page.gate
      )}
    </Screen>
  );
}
