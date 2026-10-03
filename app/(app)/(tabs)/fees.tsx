import { Hint, Section } from '@/components/account/bits';
import { CountUpText, PopIn } from '@/components/account/motion-bits';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { WashCard } from '@/components/account/surfaces';
import { ChildChips } from '@/components/child-chips';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { AppText, Chip, ListCard, ListRow } from '@/components/ui';
import { useFees } from '@/features/parent/hooks';
import { useLocale, useT, type Locale, type TFunction } from '@/i18n';
import { toISODate } from '@/lib/dates';
import { dayMonth, firstName, rupees } from '@/lib/format';
import { invoiceChip } from '@/lib/receipt';
import { feesLine } from '@/lib/status-copy';
import { Reveal } from '@/motion/reveal';
import { fonts, useTheme } from '@/theme';
import type { FeesData } from '@/types/parent';

const dueText = (day: string | null, overdue: boolean, t: TFunction, locale: Locale): string => {
  const when = dayMonth(day, locale);
  if (!when) return t('account.fees.payAtOffice');
  return overdue ? t('account.fees.wasDue', { date: when }) : t('account.fees.dueBy', { date: when });
};

function FeesContent({ data }: { data: FeesData }) {
  const t = useT();
  const locale = useLocale();
  const { colors } = useTheme();
  const line = feesLine(data.summary, t, locale);
  const today = toISODate(new Date());
  const { summary, invoices } = data;
  const hero = { fontFamily: fonts.display, fontSize: 52, lineHeight: 56 } as const;
  return (
    <>
      <Reveal index={0}>
        <WashCard tint={line ? (summary.overdue ? colors.badBg : colors.accentTint) : colors.goodBg}>
          {line ? (
            <>
              <PopIn>
                <Chip label={summary.overdue ? t('account.fees.overdue') : t('account.fees.due')} tone={summary.overdue ? 'bad' : 'warn'} />
              </PopIn>
              <AppText variant="caption" style={{ fontSize: 15, marginTop: 14 }}>
                {dueText(summary.nextDueDate, summary.overdue, t, locale)}
              </AppText>
              <CountUpText value={summary.dueAmount} format={rupees} style={[hero, { marginTop: 4 }]} />
              <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>
                {t('account.fees.unpaid', { count: summary.unpaidCount })}
              </AppText>
            </>
          ) : (
            <>
              <PopIn>
                <Chip label={t('account.fees.allPaid')} tone="good" />
              </PopIn>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 24, marginTop: 14 }}>{t('account.fees.nothingDue')}</AppText>
              <AppText variant="caption" style={{ fontSize: 15, marginTop: 6 }}>
                {t('account.fees.thanks')}
              </AppText>
            </>
          )}
        </WashCard>
      </Reveal>
      {line ? (
        <Reveal index={1}>
          <Hint>{t('account.fees.noOnline')}</Hint>
        </Reveal>
      ) : null}
      {invoices.length > 0 ? (
        <Reveal index={2}>
          <Section title={t('account.fees.thisYear')}>
            <ListCard>
              {invoices.map((inv, i) => {
                const chip = invoiceChip(inv, today, t, locale);
                return (
                  <ListRow
                    key={inv.id}
                    title={inv.period}
                    subtitle={rupees(inv.total)}
                    icon="file-text"
                    dot={chip.tone}
                    href={{ pathname: '/(app)/receipt', params: { invoiceId: String(inv.id) } }}
                    last={i === invoices.length - 1}
                    right={<Chip label={chip.label} tone={chip.tone} />}
                  />
                );
              })}
            </ListCard>
          </Section>
        </Reveal>
      ) : null}
    </>
  );
}

export default function FeesScreen() {
  const t = useT();
  const locale = useLocale();
  const page = useChildPage();
  const fees = useFees(page.child?.id);
  const sub = page.child ? `${firstName(page.child.name)}${page.child.className ? `, ${page.child.className}` : ''}` : undefined;
  return (
    <CollapsingScreen
      title={t('tab.fees')}
      subtitle={sub}
      refreshing={fees.isRefetching}
      onRefresh={() => {
        void page.refetch();
        void fees.refetch();
      }}
    >
      {page.child ? (
        <>
          <ChildChips items={page.all} selectedId={page.child.id} />
          <QueryBoundary
            query={fees}
            isEmpty={(d) => d.invoices.length === 0 && !feesLine(d.summary, t, locale)}
            empty={{ title: t('account.fees.emptyTitle'), message: t('account.fees.emptyMessage') }}
          >
            {(data) => <FeesContent data={data} />}
          </QueryBoundary>
        </>
      ) : (
        page.gate
      )}
    </CollapsingScreen>
  );
}
