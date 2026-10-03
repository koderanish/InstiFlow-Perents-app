import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { firstName } from '@/lib/format';
import { useChildStore } from '@/stores/child-store';
import { colors, fonts } from '@/theme';
import type { ParentChild } from '@/types/parent';

/** Child switcher. Hidden when there is only one child. */
export function ChildChips({ items, selectedId }: { items: ParentChild[]; selectedId: number | undefined }) {
  const select = useChildStore((s) => s.select);
  if (items.length < 2) return null;
  return (
    <View style={styles.row}>
      {items.map((c) => {
        const on = c.id === selectedId;
        return (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`Show ${c.name}`}
            onPress={() => select(c.id)}
            style={[styles.chip, on ? { backgroundColor: colors.accentTint } : { borderWidth: 1, borderColor: colors.border }]}
          >
            <AppText style={{ fontFamily: on ? fonts.semibold : fonts.medium, fontSize: 15, color: on ? colors.ink : colors.muted }}>
              {firstName(c.name)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
