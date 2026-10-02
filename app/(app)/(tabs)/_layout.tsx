import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, fonts } from '@/theme';

const icon = (name: React.ComponentProps<typeof Feather>['name']) =>
  function TabIcon({ color, size }: { color: string; size: number }) {
    return <Feather name={name} size={size} color={color} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 84, paddingTop: 8 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('bar-chart-2') }} />
      <Tabs.Screen name="fees" options={{ title: 'Fees', tabBarIcon: icon('credit-card') }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarIcon: icon('bell') }} />
    </Tabs>
  );
}
