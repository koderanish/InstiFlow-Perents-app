import type { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { Hint } from '@/components/account/bits';
import { useGoBack } from '@/components/account/nav';
import { PrefRow } from '@/components/account/pref-row';
import { InsetList, Tray } from '@/components/account/surfaces';
import { BackHeader, ListCard, Screen } from '@/components/ui';
import type { PrefKey } from '@/lib/prefs';
import { Reveal } from '@/motion/reveal';
import { usePrefsStore } from '@/stores/prefs-store';

type Topic = { key: PrefKey; title: string; subtitle: string; icon: React.ComponentProps<typeof Feather>['name'] };

const TOPICS: Topic[] = [
  { key: 'bus', icon: 'truck', title: 'Bus pickup and drop', subtitle: 'When your child gets on or off the bus' },
  { key: 'attendance', icon: 'check-circle', title: 'Attendance', subtitle: 'If your child is marked absent or late' },
  { key: 'fees', icon: 'credit-card', title: 'Fees', subtitle: 'Due dates and receipts' },
  { key: 'notices', icon: 'bell', title: 'Notices', subtitle: 'Messages from the school' },
  { key: 'homework', icon: 'book-open', title: 'Homework and diary', subtitle: 'When a teacher adds something' },
];

export default function NotificationSettingsScreen() {
  const goBack = useGoBack();
  const prefs = usePrefsStore((s) => s.notifications);
  const set = usePrefsStore((s) => s.setNotification);
  return (
    <Screen header={<BackHeader title="Notifications" subtitle="Choose what reaches you" onBack={goBack} />}>
      <Reveal index={0}>
        <ListCard>
          {TOPICS.map((t, i) => (
            <PrefRow key={t.key} icon={t.icon} title={t.title} subtitle={t.subtitle} value={prefs[t.key]} onChange={(v) => set(t.key, v)} last={i === TOPICS.length - 1} />
          ))}
        </ListCard>
      </Reveal>
      <Reveal index={1}>
        <Tray>
          <InsetList>
            <PrefRow icon="moon" title="Quiet hours" subtitle="9 pm to 7 am, except bus alerts" value={prefs.quietHours} onChange={(v) => set('quietHours', v)} last />
          </InsetList>
        </Tray>
      </Reveal>
      <Reveal index={2}>
        <View style={{ gap: 8 }}>
          <Hint>Push notifications will start once the school turns them on. Your choices here are saved on this phone and will apply from then.</Hint>
          <Hint>When they start, if alerts do not arrive, allow notifications for this app in your phone settings.</Hint>
        </View>
      </Reveal>
    </Screen>
  );
}
