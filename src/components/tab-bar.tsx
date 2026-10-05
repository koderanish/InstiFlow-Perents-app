import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, Text as RNText, View, type LayoutChangeEvent } from 'react-native';
import Reanimated, { FadeIn, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT, type TKey } from '@/i18n';
import { PressableScale } from '@/motion/pressable-scale';
import { SPRING_SNAPPY } from '@/motion/tokens';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabSpec = { name: string; icon: IoniconName; label: TKey };

/** Visible tabs, in order. Routes not listed here (the hidden inbox) get no slot. */
const TABS: TabSpec[] = [
  { name: 'index', icon: 'today', label: 'tab.today' },
  { name: 'progress', icon: 'bar-chart', label: 'tab.progress' },
  { name: 'fees', icon: 'card', label: 'tab.fees' },
  { name: 'profile', icon: 'person', label: 'tab.profile' },
];

const BAR_H_PADDING = 20;

/**
 * Bottom tab bar: an accent pill glides between tabs on a spring that can be interrupted mid-flight
 * (tap another tab and it re-aims from where it is), while icon and label fade in.
 * Same motion as the Teacher app, in the school's own colour.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const [barWidth, setBarWidth] = useState(0);

  const focusedRoute = state.routes[state.index];
  const found = TABS.findIndex((tab) => tab.name === focusedRoute?.name);
  const activeIndex = found === -1 ? 0 : found;

  // Equal slots inside the padded bar, so the pill position never depends on per-slot layout timing.
  const slotWidth = Math.max(barWidth - BAR_H_PADDING * 2, 0) / TABS.length;
  const pillCenterX = BAR_H_PADDING + activeIndex * slotWidth + slotWidth / 2;

  const pillX = useSharedValue(0);
  const placed = useSharedValue(false);
  useEffect(() => {
    if (!barWidth) return;
    if (placed.get()) {
      pillX.set(withSpring(pillCenterX, { ...SPRING_SNAPPY, reduceMotion: ReduceMotion.System }));
    } else {
      pillX.set(pillCenterX); // first layout: no slide in from the corner
      placed.set(true);
    }
  }, [barWidth, pillCenterX, pillX, placed]);

  const pillStyle = useAnimatedStyle(() => ({ opacity: barWidth ? 1 : 0, left: pillX.get() }));

  const activeTab = TABS[activeIndex];
  const bottomInset = Math.max(insets.bottom, 14);

  const open = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.tabBar, { paddingBottom: bottomInset }]}
      onLayout={(event: LayoutChangeEvent) => setBarWidth(event.nativeEvent.layout.width)}
    >
      {TABS.map((tab, index) => {
        const focused = index === activeIndex;
        return (
          <PressableScale
            key={tab.name}
            onPress={() => {
              if (!focused) open(tab.name);
            }}
            haptic={focused ? false : 'tap'}
            scaleTo={0.95}
            style={styles.slot}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t(tab.label)}
          >
            {focused ? null : <Ionicons name={`${tab.icon}-outline` as IoniconName} size={21} color={colors.faint} />}
          </PressableScale>
        );
      })}
      {barWidth && activeTab ? (
        <Reanimated.View pointerEvents="none" style={[styles.pill, { bottom: bottomInset }, pillStyle]}>
          <Reanimated.View key={activeTab.name} entering={FadeIn.duration(180)} style={styles.pillContent}>
            <Ionicons name={activeTab.icon} size={18} color={colors.onAccent} />
            <RNText style={styles.pillLabel} numberOfLines={1}>
              {t(activeTab.label)}
            </RNText>
          </Reanimated.View>
        </Reanimated.View>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    tabBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: BAR_H_PADDING,
      paddingTop: 8,
    },
    pill: {
      position: 'absolute',
      top: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: colors.accent,
      transform: [{ translateX: '-50%' }],
      shadowColor: colors.accent,
      shadowOpacity: isDark ? 0.2 : 0.35,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 5,
    },
    pillContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    slot: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
    pillLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onAccent },
  });
