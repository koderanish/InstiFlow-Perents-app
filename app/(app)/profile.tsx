import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, DetailCard, Section } from '@/components/account/bits';
import { PoweredBy } from '@/components/account/brand';
import { useGoBack } from '@/components/account/nav';
import { InsetList, Tray, WashCard } from '@/components/account/surfaces';
import { AppText, BackHeader, ListCard, ListRow, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useChildren } from '@/features/parent/hooks';
import { initials } from '@/lib/format';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { useAuthStore } from '@/stores/auth-store';
import { useChildStore } from '@/stores/child-store';
import { colors, fonts } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const select = useChildStore((s) => s.select);
  const { child, children: all, refetch, isRefetching } = useChildren();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const name = user?.full_name ?? '';

  return (
    <Screen header={<BackHeader title="Profile" onBack={goBack} />} refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Reveal index={0}>
        <WashCard padding={20}>
          <View style={styles.who}>
            <View accessibilityElementsHidden importantForAccessibility="no" style={styles.avatar}>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.accentInk }}>{initials(name)}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText numberOfLines={2} style={{ fontFamily: fonts.semibold, fontSize: 20 }}>
                {name}
              </AppText>
              {user?.email ? (
                <AppText variant="caption" numberOfLines={1} style={{ fontSize: 15, marginTop: 2 }}>
                  {user.email}
                </AppText>
              ) : null}
              {user?.phone ? (
                <AppText variant="caption" numberOfLines={1} tabular style={{ fontSize: 15, marginTop: 2 }}>
                  {user.phone}
                </AppText>
              ) : null}
            </View>
          </View>
        </WashCard>
      </Reveal>

      {all.length > 0 ? (
        <Reveal index={1}>
          <Section title="Your children">
            <ListCard>
              {all.map((c, i) => {
                const viewing = child?.id === c.id;
                return (
                  <PressableScale
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.name}, ${c.className}${viewing ? ', currently viewing' : ''}`}
                    accessibilityHint="Opens the profile"
                    scaleTo={0.985}
                    onPress={() => {
                      select(c.id);
                      router.push('/(app)/child');
                    }}
                  >
                    <View style={[styles.row, i < all.length - 1 && styles.divider]}>
                      <Avatar name={c.name} />
                      <View style={{ flex: 1 }}>
                        <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 16 }}>
                          {c.name}
                        </AppText>
                        {c.className ? (
                          <AppText variant="caption" numberOfLines={1} style={{ marginTop: 2 }}>
                            {c.className}
                          </AppText>
                        ) : null}
                      </View>
                      {viewing ? (
                        <View style={styles.viewing}>
                          <AppText style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.accentInk }}>Viewing</AppText>
                        </View>
                      ) : null}
                      <Feather name="chevron-right" size={18} color={colors.faint} />
                    </View>
                  </PressableScale>
                );
              })}
            </ListCard>
          </Section>
        </Reveal>
      ) : null}

      <Reveal index={2}>
        <Tray>
          <InsetList>
            <ListRow icon="file-text" title="Leave notes" subtitle="Tell the school your child will be away" href="/(app)/leave" />
            <ListRow icon="phone" title="Contact the school" href="/(app)/contact" />
            <ListRow icon="bell" title="Notification settings" href="/(app)/notification-settings" />
            <ListRow icon="lock" title="Change password" href="/(app)/change-password" last />
          </InsetList>
        </Tray>
      </Reveal>

      <Reveal index={3}>
        <Section title="About">
          <DetailCard
            items={[
              { label: 'School', value: SCHOOL.name },
              { label: 'App version', value: version },
            ]}
          />
        </Section>
      </Reveal>

      <Reveal index={4}>
        <View style={styles.footer}>
          <PressableScale accessibilityRole="button" accessibilityLabel="Sign out" haptic="press" hitSlop={8} onPress={() => void logout()} style={styles.signOut}>
            <Feather name="log-out" size={16} color={colors.badFg} />
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.badFg }}>Sign out</AppText>
          </PressableScale>
          <PoweredBy />
        </View>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16, minHeight: 64 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  viewing: { backgroundColor: colors.accentTint, borderRadius: 16, minHeight: 32, paddingHorizontal: 12, justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  signOut: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
});
