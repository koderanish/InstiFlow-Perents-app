import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useGoBack } from '@/components/account/nav';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { WashCard, wash } from '@/components/account/surfaces';
import { AppText, BackHeader, EmptyState, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useNotices } from '@/features/parent/hooks';
import { postedLabel } from '@/lib/dates';
import { clock } from '@/lib/format';
import { categoryLabel, priorityInfo } from '@/lib/notices';
import { Reveal } from '@/motion/reveal';
import { colors, fonts } from '@/theme';
import type { Notice } from '@/types/parent';

const postedLine = (iso: string): string => {
  const day = postedLabel(iso);
  const time = clock(iso);
  const when = day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day ? `on ${day}` : '';
  return ['Posted', when].filter(Boolean).join(' ') + (time ? `, ${time}` : '');
};

function Tag({ label, urgent }: { label: string; urgent?: boolean }) {
  return (
    <View style={[styles.tag, urgent ? { backgroundColor: colors.badBg } : { backgroundColor: colors.accentTint }]}>
      <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, color: urgent ? colors.badFg : colors.accentInk }}>{label}</AppText>
    </View>
  );
}

function NoticeCard({ notice }: { notice: Notice }) {
  const priority = priorityInfo(notice.priority);
  const category = categoryLabel(notice.category);
  const tint = priority?.tone === 'bad' ? colors.badBg : priority?.tone === 'warn' ? colors.warnBg : wash;
  return (
    <WashCard tint={tint} padding={22}>
      <Reveal index={0}>
        <View style={styles.top}>
          <View style={styles.posted}>
            <View style={[styles.dot, { backgroundColor: priority?.tone === 'bad' ? colors.badFg : colors.accent }]} />
            <AppText variant="caption" style={{ fontFamily: fonts.medium, fontSize: 13, flexShrink: 1 }}>
              {postedLine(notice.postedAt)}
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
        <AppText style={styles.body}>{notice.content?.trim() || 'The school did not add more details to this notice.'}</AppText>
      </Reveal>
    </WashCard>
  );
}

export default function NoticeScreen() {
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const noticeId = Number(id);
  const page = useChildPage();
  const notices = useNotices(page.child?.id);
  return (
    <Screen
      header={<BackHeader title="Notice" subtitle={`From ${SCHOOL.name}`} onBack={goBack} />}
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
              <EmptyState title="This notice is not in your list" message="It may have been removed by the school. Pull down to refresh, or go back to the Inbox." />
            );
          }}
        </QueryBoundary>
      ) : (
        page.gate
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  posted: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tag: { minHeight: 24, paddingHorizontal: 10, borderRadius: 12, justifyContent: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, color: colors.ink, marginTop: 12 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: '#3B352F', marginTop: 12 },
});
