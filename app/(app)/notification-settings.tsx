import type { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { Hint } from '@/components/account/bits';
import { useGoBack } from '@/components/account/nav';
import { PrefRow } from '@/components/account/pref-row';
import { PushCard } from '@/components/account/push-card';
import { InsetList, Tray } from '@/components/account/surfaces';
import { BackHeader, ListCard, Screen } from '@/components/ui';
import { useT, type TKey } from '@/i18n';
import type { PrefKey } from '@/lib/prefs';
import { Reveal } from '@/motion/reveal';
import { usePrefsStore } from '@/stores/prefs-store';

type Topic = { key: PrefKey; title: TKey; subtitle: TKey; icon: React.ComponentProps<typeof Feather>['name'] };

const TOPICS: Topic[] = [
  { key: 'bus', icon: 'truck', title: 'account.notifications.bus', subtitle: 'account.notifications.busHint' },
  { key: 'attendance', icon: 'check-circle', title: 'account.notifications.attendance', subtitle: 'account.notifications.attendanceHint' },
  { key: 'fees', icon: 'credit-card', title: 'account.notifications.fees', subtitle: 'account.notifications.feesHint' },
  { key: 'notices', icon: 'bell', title: 'account.notifications.notices', subtitle: 'account.notifications.noticesHint' },
  { key: 'homework', icon: 'book-open', title: 'account.notifications.homework', subtitle: 'account.notifications.homeworkHint' },
];

export default function NotificationSettingsScreen() {
  const t = useT();
  const goBack = useGoBack();
  const prefs = usePrefsStore((s) => s.notifications);
  const set = usePrefsStore((s) => s.setNotification);
  return (
    <Screen header={<BackHeader title={t('account.notifications.title')} subtitle={t('account.notifications.subtitle')} onBack={goBack} />}>
      <Reveal index={0}>
        <PushCard />
      </Reveal>
      <Reveal index={1}>
        <ListCard>
          {TOPICS.map((topic, i) => (
            <PrefRow
              key={topic.key}
              icon={topic.icon}
              title={t(topic.title)}
              subtitle={t(topic.subtitle)}
              value={prefs[topic.key]}
              onChange={(v) => set(topic.key, v)}
              last={i === TOPICS.length - 1}
            />
          ))}
        </ListCard>
      </Reveal>
      <Reveal index={2}>
        <Tray>
          <InsetList>
            <PrefRow icon="moon" title={t('account.notifications.quiet')} subtitle={t('account.notifications.quietHint')} value={prefs.quietHours} onChange={(v) => set('quietHours', v)} last />
          </InsetList>
        </Tray>
      </Reveal>
      <Reveal index={3}>
        <View style={{ gap: 8 }}>
          <Hint>{t('account.notifications.hint1')}</Hint>
          <Hint>{t('account.notifications.hint2')}</Hint>
        </View>
      </Reveal>
    </Screen>
  );
}
