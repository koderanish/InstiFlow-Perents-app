import type { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { IconBadge } from '@/components/icon-badge';
import { AppText } from '@/components/ui';
import { tapHaptic } from '@/motion/haptics';
import { colors, fonts } from '@/theme';

const DIMMED = 0.55;

/** A settings row with an icon tile, a title, a short line under it and an on/off switch. Turning it off dims the row. */
export function PrefRow({
  title,
  subtitle,
  icon,
  value,
  onChange,
  last,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  const reduced = useReducedMotion();
  const level = useSharedValue(value ? 1 : DIMMED);

  useEffect(() => {
    const target = value ? 1 : DIMMED;
    level.set(reduced ? target : withTiming(target, { duration: 200 }));
  }, [value, reduced, level]);

  const dim = useAnimatedStyle(() => ({ opacity: level.get() }));

  return (
    <View style={[styles.row, !last && styles.divider]}>
      <Animated.View style={[styles.copy, dim]}>
        {icon ? <IconBadge name={icon} size={40} /> : null}
        <View style={{ flex: 1 }}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" style={{ fontSize: 14, marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </Animated.View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={(next) => {
          tapHaptic();
          onChange(next);
        }}
        trackColor={{ false: '#E4DBD3', true: colors.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E4DBD3"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 12, paddingHorizontal: 18 },
  copy: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
});
