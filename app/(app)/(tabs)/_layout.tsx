import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';
import { useT } from '@/i18n';

export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tab.today') }} />
      <Tabs.Screen name="progress" options={{ title: t('tab.progress') }} />
      <Tabs.Screen name="fees" options={{ title: t('tab.fees') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile') }} />
      <Tabs.Screen name="inbox" options={{ href: null }} />
    </Tabs>
  );
}
