import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { NoticeRow } from '@/components/account/notice-row';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { SelectChip } from '@/components/account/select-chip';
import { ChildChips } from '@/components/child-chips';
import { AppText, ListCard, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useNotices } from '@/features/parent/hooks';
import { ALL_CATEGORIES, filterNotices, noticeCategories } from '@/lib/notices';
import { Reveal } from '@/motion/reveal';
import type { Notice } from '@/types/parent';

function CategoryFilter({ options, value, onChange }: { options: string[]; value: string; onChange: (next: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterScroll}>
      {[ALL_CATEGORIES, ...options].map((label) => (
        <SelectChip
          key={label}
          label={label}
          selected={label === value}
          accessibilityLabel={label === ALL_CATEGORIES ? 'Show all notices' : `Show ${label} notices`}
          onPress={() => onChange(label)}
        />
      ))}
    </ScrollView>
  );
}

function NoticeList({ notices }: { notices: Notice[] }) {
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const options = noticeCategories(notices);
  // A refresh can drop the chosen category; fall back to everything.
  const active = options.includes(category) ? category : ALL_CATEGORIES;
  const shown = filterNotices(notices, active);
  return (
    <>
      {options.length > 1 ? (
        <Reveal index={0}>
          <CategoryFilter options={options} value={active} onChange={setCategory} />
        </Reveal>
      ) : null}
      <ListCard>
        {shown.map((n, i) => (
          <Reveal key={n.id} index={i + 1}>
            <NoticeRow notice={n} last={i === shown.length - 1} />
          </Reveal>
        ))}
      </ListCard>
    </>
  );
}

export default function InboxScreen() {
  const page = useChildPage();
  const notices = useNotices(page.child?.id);
  return (
    <Screen
      refreshing={notices.isRefetching}
      onRefresh={() => {
        void page.refetch();
        void notices.refetch();
      }}
    >
      <Reveal index={0}>
        <AppText variant="title">Inbox</AppText>
        <AppText variant="caption" numberOfLines={1} style={{ marginTop: 4 }}>
          Messages from {SCHOOL.name}
        </AppText>
      </Reveal>
      {page.child ? (
        <>
          <ChildChips items={page.all} selectedId={page.child.id} />
          <QueryBoundary query={notices} isEmpty={(d) => d.length === 0} empty={{ title: 'No messages yet', message: 'Notices from the school will show up here.' }}>
            {(data) => <NoticeList notices={data} />}
          </QueryBoundary>
        </>
      ) : (
        page.gate
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterScroll: { marginHorizontal: -20 },
  filters: { gap: 8, paddingHorizontal: 20 },
});
