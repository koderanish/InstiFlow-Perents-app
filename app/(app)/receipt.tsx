import { useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';

import { DetailCard, Hint, Section, SecondaryButton, type DetailItem } from '@/components/account/bits';
import { useGoBack } from '@/components/account/nav';
import { CountUpText, PopIn } from '@/components/account/motion-bits';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { WashCard } from '@/components/account/surfaces';
import { AppText, BackHeader, Chip, EmptyState, ListCard, ListRow, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useInvoice } from '@/features/parent/hooks';
import { toISODate } from '@/lib/dates';
import { dayMonth, rupees } from '@/lib/format';
import { invoiceChip, receiptText } from '@/lib/receipt';
import { Reveal } from '@/motion/reveal';
import { colors, fonts } from '@/theme';
import type { InvoiceDetail, ParentChild, Payment } from '@/types/parent';

const modeText = (mode: string | null): string => (mode ? mode.replace(/[_-]+/g, ' ').toUpperCase() : '');

const paymentSubtitle = (p: Payment): string =>
  [p.receiptNo ? `Receipt no. ${p.receiptNo}` : null, modeText(p.mode) || null, p.reference ? `Ref ${p.reference}` : null].filter(Boolean).join(' · ');

function paidLine(inv: InvoiceDetail): string {
  const last = inv.payments[inv.payments.length - 1];
  if (!last) return 'No payment recorded yet';
  const mode = modeText(last.mode);
  return `Paid on ${dayMonth(last.paidOn) ?? last.paidOn}${mode ? ` by ${mode}` : ''}`;
}

function ReceiptBody({ inv, child }: { inv: InvoiceDetail; child: ParentChild }) {
  const paid = inv.balance <= 0;
  const chip = invoiceChip(inv, toISODate(new Date()));
  const rows: DetailItem[] = [
    { label: 'Student', value: child.name },
    ...(child.className ? [{ label: 'Class', value: child.className }] : []),
    { label: 'Invoice no.', value: inv.invoiceNo },
    ...inv.lines.map((l) => ({ label: l.label, value: rupees(l.amount) })),
    ...(inv.fine > 0 ? [{ label: 'Late fine', value: rupees(inv.fine) }] : []),
    { label: 'Total', value: rupees(inv.total), bold: true },
    ...(inv.paid > 0 && !paid ? [{ label: 'Paid so far', value: rupees(inv.paid) }] : []),
    ...(!paid ? [{ label: 'Balance', value: rupees(inv.balance), bold: true }] : []),
  ];

  const share = async () => {
    try {
      await Share.share({ message: receiptText(inv, SCHOOL.name, child.name), title: `${inv.period} fee receipt` });
    } catch {
      // The parent closed or could not open the share sheet; nothing to report.
    }
  };

  return (
    <>
      <Reveal index={0}>
        <WashCard tint={paid ? colors.goodBg : chip.tone === 'bad' ? colors.badBg : colors.accentTint}>
          <PopIn delay={200}>
            <Chip label={chip.label} tone={chip.tone} />
          </PopIn>
          <CountUpText
            value={paid ? inv.total : inv.balance}
            format={rupees}
            style={{ fontFamily: fonts.display, fontSize: 52, lineHeight: 56, marginTop: 14 }}
          />
          <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>
            {paid ? paidLine(inv) : `Still to pay, due ${dayMonth(inv.dueDate) ?? inv.dueDate}`}
          </AppText>
        </WashCard>
      </Reveal>
      <Reveal index={1}>
        <DetailCard items={rows} />
      </Reveal>
      {inv.payments.length > 0 ? (
        <Reveal index={2}>
          <Section title="Payments">
            <ListCard>
              {inv.payments.map((p, i) => (
                <ListRow
                  key={p.id}
                  title={`${rupees(p.amount)} on ${dayMonth(p.paidOn) ?? p.paidOn}`}
                  subtitle={paymentSubtitle(p) || undefined}
                  icon="credit-card"
                  dot="good"
                  last={i === inv.payments.length - 1}
                />
              ))}
            </ListCard>
          </Section>
        </Reveal>
      ) : null}
      {!paid ? (
        <Reveal index={3}>
          <Hint>Paying online is not available in this app yet. Please pay the balance at the school office.</Hint>
        </Reveal>
      ) : null}
      <Reveal index={4}>
        <SecondaryButton label="Share receipt" onPress={() => void share()} />
      </Reveal>
    </>
  );
}

export default function ReceiptScreen() {
  const goBack = useGoBack();
  const { invoiceId } = useLocalSearchParams<{ invoiceId?: string }>();
  const id = Number(invoiceId);
  const valid = Number.isInteger(id) && id > 0;
  const page = useChildPage();
  const child = page.child;
  const invoice = useInvoice(child?.id, valid ? id : undefined);
  return (
    <Screen
      header={<BackHeader title="Receipt" subtitle={invoice.data?.period} onBack={goBack} />}
      refreshing={invoice.isRefetching}
      onRefresh={() => {
        void page.refetch();
        void invoice.refetch();
      }}
    >
      {!valid ? (
        <EmptyState title="We could not open this receipt" message="Go back to Fees and choose an invoice." />
      ) : child ? (
        <QueryBoundary query={invoice}>{(data) => <ReceiptBody inv={data} child={child} />}</QueryBoundary>
      ) : (
        page.gate
      )}
    </Screen>
  );
}
