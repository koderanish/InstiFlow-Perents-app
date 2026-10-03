import { useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';

import { DetailCard, Hint, Section, SecondaryButton, type DetailItem } from '@/components/account/bits';
import { useGoBack } from '@/components/account/nav';
import { CountUpText, PopIn } from '@/components/account/motion-bits';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { WashCard } from '@/components/account/surfaces';
import { AppText, BackHeader, Chip, EmptyState, ListCard, ListRow, Screen } from '@/components/ui';
import { useSchool } from '@/branding';
import { useInvoice } from '@/features/parent/hooks';
import { useLocale, useT, type Locale, type TFunction } from '@/i18n';
import { toISODate } from '@/lib/dates';
import { dayMonth, rupees } from '@/lib/format';
import { invoiceChip, receiptText } from '@/lib/receipt';
import { Reveal } from '@/motion/reveal';
import { fonts, useTheme } from '@/theme';
import type { InvoiceDetail, ParentChild, Payment } from '@/types/parent';

const modeText = (mode: string | null): string => (mode ? mode.replace(/[_-]+/g, ' ').toUpperCase() : '');

const paymentSubtitle = (p: Payment, t: TFunction): string =>
  [
    p.receiptNo ? t('account.receipt.receiptNo', { no: p.receiptNo }) : null,
    modeText(p.mode) || null,
    p.reference ? t('account.receipt.ref', { ref: p.reference }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

function paidLine(inv: InvoiceDetail, t: TFunction, locale: Locale): string {
  const last = inv.payments[inv.payments.length - 1];
  if (!last) return t('account.receipt.noPayment');
  const mode = modeText(last.mode);
  const date = dayMonth(last.paidOn, locale) ?? last.paidOn;
  return mode ? t('account.receipt.paidOnBy', { date, mode }) : t('account.receipt.paidOn', { date });
}

function ReceiptBody({ inv, child }: { inv: InvoiceDetail; child: ParentChild }) {
  const t = useT();
  const school = useSchool();
  const locale = useLocale();
  const { colors } = useTheme();
  const paid = inv.balance <= 0;
  const chip = invoiceChip(inv, toISODate(new Date()), t, locale);
  const rows: DetailItem[] = [
    { label: t('account.receipt.student'), value: child.name },
    ...(child.className ? [{ label: t('account.receipt.class'), value: child.className }] : []),
    { label: t('account.receipt.invoiceNo'), value: inv.invoiceNo },
    ...inv.lines.map((l) => ({ label: l.label, value: rupees(l.amount) })),
    ...(inv.fine > 0 ? [{ label: t('account.receipt.fine'), value: rupees(inv.fine) }] : []),
    { label: t('account.receipt.total'), value: rupees(inv.total), bold: true },
    ...(inv.paid > 0 && !paid ? [{ label: t('account.receipt.paidSoFar'), value: rupees(inv.paid) }] : []),
    ...(!paid ? [{ label: t('account.receipt.balance'), value: rupees(inv.balance), bold: true }] : []),
  ];

  const share = async () => {
    try {
      await Share.share({ message: receiptText(inv, school.name, child.name, t, locale), title: t('account.receipt.shareTitle', { period: inv.period }) });
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
            {paid ? paidLine(inv, t, locale) : t('account.receipt.stillToPay', { date: dayMonth(inv.dueDate, locale) ?? inv.dueDate })}
          </AppText>
        </WashCard>
      </Reveal>
      <Reveal index={1}>
        <DetailCard items={rows} />
      </Reveal>
      {inv.payments.length > 0 ? (
        <Reveal index={2}>
          <Section title={t('account.receipt.payments')}>
            <ListCard>
              {inv.payments.map((p, i) => (
                <ListRow
                  key={p.id}
                  title={t('account.receipt.paymentTitle', { amount: rupees(p.amount), date: dayMonth(p.paidOn, locale) ?? p.paidOn })}
                  subtitle={paymentSubtitle(p, t) || undefined}
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
          <Hint>{t('account.receipt.noOnline')}</Hint>
        </Reveal>
      ) : null}
      <Reveal index={4}>
        <SecondaryButton label={t('account.receipt.share')} onPress={() => void share()} />
      </Reveal>
    </>
  );
}

export default function ReceiptScreen() {
  const t = useT();
  const goBack = useGoBack();
  const { invoiceId } = useLocalSearchParams<{ invoiceId?: string }>();
  const id = Number(invoiceId);
  const valid = Number.isInteger(id) && id > 0;
  const page = useChildPage();
  const child = page.child;
  const invoice = useInvoice(child?.id, valid ? id : undefined);
  return (
    <Screen
      header={<BackHeader title={t('account.receipt.title')} subtitle={invoice.data?.period} onBack={goBack} />}
      refreshing={invoice.isRefetching}
      onRefresh={() => {
        void page.refetch();
        void invoice.refetch();
      }}
    >
      {!valid ? (
        <EmptyState title={t('account.receipt.invalidTitle')} message={t('account.receipt.invalidMessage')} />
      ) : child ? (
        <QueryBoundary query={invoice}>{(data) => <ReceiptBody inv={data} child={child} />}</QueryBoundary>
      ) : (
        page.gate
      )}
    </Screen>
  );
}
