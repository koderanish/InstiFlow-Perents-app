import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Chip } from '@/components/ui';
import { useChildren } from '@/features/parent/hooks';
import { firstName } from '@/lib/format';
import type { Tone } from '@/lib/status-copy';
import { usePrefsStore } from '@/stores/prefs-store';
import { colors, fonts, radius, shadow } from '@/theme';

interface Tip {
  chip: string;
  tone: Tone;
  sample: string;
  sampleLine: string;
  title: string;
  body: string;
}

const tipsFor = (kid: string): Tip[] => [
  {
    chip: 'Today',
    tone: 'good',
    sample: `${kid} is at school`,
    sampleLine: 'Attendance, bus and fees in one place',
    title: `See ${kid}'s day\nat a glance`,
    body: 'The Today tab shows attendance, the school bus and anything due. Pull down to refresh.',
  },
  {
    chip: 'Fees',
    tone: 'warn',
    sample: 'Term fees',
    sampleLine: 'Open any invoice to see its receipt',
    title: 'Check fees\nand receipts',
    body: 'See what is due and share a receipt. For now, fees are paid at the school office.',
  },
  {
    chip: 'Leave note',
    tone: 'neutral',
    sample: `${kid} will be away`,
    sampleLine: 'Send a note from your Profile',
    title: 'Tell the school\nwhen needed',
    body: 'Send a leave note and read school notices in the Inbox. You can change your choices in Profile.',
  },
];

export default function TipsScreen() {
  const router = useRouter();
  const { child } = useChildren();
  const markSeen = usePrefsStore((s) => s.markTipsSeen);
  const [index, setIndex] = useState(0);
  const tips = tipsFor(child ? firstName(child.name) : 'Your child');
  const tip = tips[index] ?? tips[0];
  const last = index === tips.length - 1;

  const finish = () => {
    markSeen();
    router.replace('/(app)/(tabs)');
  };

  if (!tip) return null;
  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Skip the tips" onPress={finish} style={styles.skip}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.muted }}>Skip</AppText>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.art}>
          <View style={[styles.sample, shadow.card]}>
            <Chip label={tip.chip} tone={tip.tone} />
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 19, marginTop: 10 }}>{tip.sample}</AppText>
            <AppText variant="caption" style={{ marginTop: 2 }}>
              {tip.sampleLine}
            </AppText>
          </View>
        </View>
        <View accessible accessibilityLabel={`Tip ${index + 1} of ${tips.length}. ${tip.title.replace('\n', ' ')}. ${tip.body}`} style={{ gap: 12 }}>
          <AppText variant="title">{tip.title}</AppText>
          <AppText variant="caption" style={{ fontSize: 17, lineHeight: 25 }}>
            {tip.body}
          </AppText>
        </View>
      </View>

      <View style={styles.bottom}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.dots}>
          {tips.map((t, i) => (
            <View key={t.chip} style={[styles.dot, i === index ? { width: 24, backgroundColor: colors.accent } : { width: 8, backgroundColor: colors.border }]} />
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={last ? finish : () => setIndex(index + 1)} style={styles.next}>
          <AppText style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.onAccent }}>{last ? 'Get started' : 'Next'}</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  top: { alignItems: 'flex-end', paddingTop: 8 },
  skip: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  body: { flex: 1, justifyContent: 'center', gap: 28 },
  art: { minHeight: 240, borderRadius: radius.hero, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sample: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: 24, padding: 20 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24, paddingTop: 12 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  next: { minHeight: 52, minWidth: 100, paddingHorizontal: 28, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
