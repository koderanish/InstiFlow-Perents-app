import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useGoBack } from '@/components/account/nav';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { WashCard, useWash } from '@/components/account/surfaces';
import { AppText, BackHeader, EmptyState, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useNotices } from '@/features/parent/hooks';
import { monthName, useLocale, useT, type Locale, type TFunction } from '@/i18n';
import { postedInfo } from '@/lib/dates';
import { clock } from '@/lib/format';
import { categoryLabel, priorityInfo } from '@/lib/notices';
import { Reveal } from '@/motion/reveal';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';
import type { Notice } from '@/types/parent';

const postedLine = (iso: string, t: TFunction, locale: Locale): string => {
  const info = postedInfo(iso);
  const time = clock(iso);
  if (!info) return t('account.notice.posted');
  if (info.kind === 'date') {
    const date = `${info.day} ${monthName(locale, info.month)}`;
    return time ? t('account.notice.postedOnAt', { date, time }) : t('account.notice.postedOn', { date });
  }
  if (info.kind === 'today') return time ? t('account.notice.postedTodayAt', { time }) : t('account.notice.postedToday');
  return time ? t('account.notice.postedYesterdayAt', { time }) : t('account.notice.postedYesterday');
};

function Tag({ label, urgent }: { label: string; urgent?: boolean }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={[styles.tag, urgent ? { backgroundColor: colors.badBg } : { backgroundColor: colors.accentTint }]}>
      <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, color: urgent ? colors.badFg : colors.accentInk }}>{label}</AppText>
    </View>
  );
}

function NoticeCard({ notice }: { notice: Notice }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const wash = useWash();
  const t = useT();
  const locale = useLocale();
  const priority = priorityInfo(notice.priority, t);
  const category = categoryLabel(notice.category);
  const tint = priority?.tone === 'bad' ? colors.badBg : priority?.tone === 'warn' ? colors.warnBg : wash;
  return (
    <WashCard tint={tint} padding={22}>
      <Reveal index={0}>
        <View style={styles.top}>
          <View style={styles.posted}>
            <View style={[styles.dot, { backgroundColor: priority?.tone === 'bad' ? colors.badFg : colors.accent }]} />
            <AppText variant="caption" style={{ fontFamily: fonts.medium, fontSize: 13, flexShrink: 1 }}>
              {postedLine(notice.postedAt, t, locale)}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {priority ? <Tag label={priority.label} urgent={priority.tone === 'bad'} /> : null}
            {category ? <Tag label={category} /> : null}
          </View>
        </View>
      </Reveal>
      <Reveal index={1}>
        <AppText accessibilityRole="header" style={styles.title}>
          {notice.title}
        </AppText>
      </Reveal>
      <Reveal index={2}>
        <AppText style={styles.body}>{notice.content?.trim() || t('account.notice.noDetails')}</AppText>
      </Reveal>
    </WashCard>
  );
}

export default function NoticeScreen() {
  const t = useT();
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const noticeId = Number(id);
  const page = useChildPage();
  const notices = useNotices(page.child?.id);
  return (
    <Screen
      header={<BackHeader title={t('account.notice.title')} subtitle={t('account.notice.from', { school: SCHOOL.name })} onBack={goBack} />}
      refreshing={notices.isRefetching}
      onRefresh={() => {
        void page.refetch();
        void notices.refetch();
      }}
    >
      {page.child ? (
        <QueryBoundary query={notices}>
          {(data) => {
            const notice = data.find((n) => n.id === noticeId);
            return notice ? (
              <NoticeCard notice={notice} />
            ) : (
              <EmptyState title={t('account.notice.missingTitle')} message={t('account.notice.missingMessage')} />
            );
          }}
        </QueryBoundary>
      ) : (
        page.gate
      )}
    </Screen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
    posted: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    tag: { minHeight: 24, paddingHorizontal: 10, borderRadius: 12, justifyContent: 'center' },
    title: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, color: colors.ink, marginTop: 12 },
    body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.ink, marginTop: 12 },
  });
