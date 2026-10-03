import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, type ColorValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { tapHaptic } from '@/motion/haptics';
import { SPRING_SNAPPY } from '@/motion/tokens';
import { useT } from '@/i18n';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

type IconName = React.ComponentProps<typeof Feather>['name'];

/** The active tab's icon pops up a touch; inactive ones settle back. Interruptible, UI thread. */
function TabIcon({ name, color, size, focused }: { name: IconName; color: ColorValue; size: number; focused: boolean }) {
  const lift = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    lift.value = withSpring(focused ? 1 : 0, SPRING_SNAPPY);
  }, [focused, lift]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + lift.value * 0.14 }, { translateY: -lift.value * 1.5 }] }));
  return (
    <Animated.View style={style}>
      <Feather name={name} size={size} color={color as string} />
    </Animated.View>
  );
}

const icon = (name: IconName) =>
  function renderIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <TabIcon name={name} color={color} size={size} focused={focused} />;
  };

export default function TabsLayout() {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const t = useT();
  return (
    <Tabs
      screenListeners={{ tabPress: () => tapHaptic() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
        tabBarStyle: styles.bar,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tab.today'), tabBarIcon: icon('home') }} />
      <Tabs.Screen name="progress" options={{ title: t('tab.progress'), tabBarIcon: icon('bar-chart-2') }} />
      <Tabs.Screen name="fees" options={{ title: t('tab.fees'), tabBarIcon: icon('credit-card') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile'), tabBarIcon: icon('user') }} />
      <Tabs.Screen name="inbox" options={{ href: null }} />
    </Tabs>
  );
}

// A soft shadow lifts the bar off the page instead of a hard hairline.
const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    bar: { backgroundColor: colors.card, borderTopWidth: 0, height: 84, paddingTop: 8, ...shadow.card, shadowOffset: { width: 0, height: -4 } },
  });
