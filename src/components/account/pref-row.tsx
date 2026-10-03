import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, fonts } from '@/theme';

/** A settings row with a title, a short line under it and an on/off switch. */
export function PrefRow({
  title,
  subtitle,
  value,
  onChange,
  last,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" style={{ fontSize: 14, marginTop: 2 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E4DBD3', true: colors.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E4DBD3"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 12, paddingHorizontal: 18 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
});
