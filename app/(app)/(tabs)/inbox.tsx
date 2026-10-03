import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { NoticeRow } from '@/components/account/notice-row';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { SelectChip } from '@/components/account/select-chip';
import { ChildChips } from '@/components/child-chips';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { ListCard } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useNotices } from '@/features/parent/hooks';
import { useT } from '@/i18n';
import { ALL_CATEGORIES, filterNotices, noticeCategories } from '@/lib/notices';
import { Reveal } from '@/motion/reveal';
import type { Notice } from '@/types/parent';

function CategoryFilter({ options, value, onChange }: { options: string[]; value: string; onChange: (next: string) => void }) {
  const t = useT();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterScroll}>
      {[ALL_CATEGORIES, ...options].map((key) => {
        const all = key === ALL_CATEGORIES;
        return (
          <SelectChip
            key={key}
            label={all ? t('account.inbox.all') : key}
            selected={key === value}
            accessibilityLabel={all ? t('account.inbox.showAll') : t('account.inbox.showCategory', { category: key })}
            onPress={() => onChange(key)}
          />
        );
      })}
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
  const t = useT();
  const page = useChildPage();
  const notices = useNotices(page.child?.id);
  return (
    <CollapsingScreen
      title={t('tab.inbox')}
      subtitle={t('account.inbox.from', { school: SCHOOL.name })}
      refreshing={notices.isRefetching}
      onRefresh={() => {
        void page.refetch();
        void notices.refetch();
      }}
    >
      {page.child ? (
        <>
          <ChildChips items={page.all} selectedId={page.child.id} />
          <QueryBoundary
            query={notices}
            isEmpty={(d) => d.length === 0}
            empty={{ title: t('account.inbox.emptyTitle'), message: t('account.inbox.emptyMessage') }}
          >
            {(data) => <NoticeList notices={data} />}
          </QueryBoundary>
        </>
      ) : (
        page.gate
      )}
    </CollapsingScreen>
  );
}

const styles = StyleSheet.create({
  filterScroll: { marginHorizontal: -20 },
  filters: { gap: 8, paddingHorizontal: 20 },
});
