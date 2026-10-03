import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DetailCard, Section } from '@/components/account/bits';
import { PoweredBy } from '@/components/account/brand';
import { useGoBack } from '@/components/account/nav';
import { AppText, BackHeader, ListCard, ListRow, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useChildren } from '@/features/parent/hooks';
import { initials } from '@/lib/format';
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
      <View style={styles.who}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.avatar}>
          <AppText style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.accentInk }}>{initials(name)}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 20 }}>{name}</AppText>
          {user?.email ? (
            <AppText variant="caption" style={{ fontSize: 15, marginTop: 2 }}>
              {user.email}
            </AppText>
          ) : null}
          {user?.phone ? (
            <AppText variant="caption" style={{ fontSize: 15, marginTop: 2 }}>
              {user.phone}
            </AppText>
          ) : null}
        </View>
      </View>

      {all.length > 0 ? (
        <Section title="Your children">
          <ListCard>
            {all.map((c, i) => {
              const viewing = child?.id === c.id;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name}, ${c.className}${viewing ? ', currently viewing' : ''}`}
                  accessibilityHint="Opens the profile"
                  onPress={() => {
                    select(c.id);
                    router.push('/(app)/child');
                  }}
                >
                  <View style={[styles.row, i < all.length - 1 && styles.divider]}>
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{c.name}</AppText>
                      {c.className ? (
                        <AppText variant="caption" style={{ marginTop: 2 }}>
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
                </Pressable>
              );
            })}
          </ListCard>
        </Section>
      ) : null}

      <ListCard>
        <ListRow title="Leave notes" subtitle="Tell the school your child will be away" href="/(app)/leave" />
        <ListRow title="Contact the school" href="/(app)/contact" />
        <ListRow title="Notification settings" href="/(app)/notification-settings" />
        <ListRow title="Change password" href="/(app)/change-password" last />
      </ListCard>

      <Section title="About">
        <DetailCard
          items={[
            { label: 'School', value: SCHOOL.name },
            { label: 'App version', value: version },
          ]}
        />
      </Section>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => void logout()} hitSlop={8} style={styles.signOut}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.badFg }}>Sign out</AppText>
        </Pressable>
        <PoweredBy />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 4 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16, minHeight: 64 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  viewing: { backgroundColor: colors.accentTint, borderRadius: 16, minHeight: 32, paddingHorizontal: 12, justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  signOut: { minHeight: 44, justifyContent: 'center' },
});
