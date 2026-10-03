import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ChildGate } from '@/components/child-gate';
import { AppText, BackHeader, ListCard, ListRow, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { initials } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import { useChildStore } from '@/stores/child-store';
import { colors, fonts } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const select = useChildStore((s) => s.select);
  return (
    <Screen header={<BackHeader title="Profile" onBack={() => router.back()} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 4 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.accentInk }}>{initials(user?.full_name ?? '')}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 20 }}>{user?.full_name}</AppText>
          <AppText variant="caption" style={{ fontSize: 15, marginTop: 2 }}>{user?.email}</AppText>
        </View>
      </View>

      <ChildGate>
        {(child, all) => (
          <View>
            <AppText variant="heading" style={{ marginHorizontal: 4, marginBottom: 10 }}>Your children</AppText>
            <ListCard>
              {all.map((c, i) => (
                <ListRow
                  key={c.id}
                  title={c.name}
                  subtitle={c.className}
                  last={i === all.length - 1}
                  right={
                    c.id === child.id ? (
                      <AppText style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.accentInk }}>Viewing</AppText>
                    ) : (
                      <Pressable accessibilityRole="button" onPress={() => select(c.id)} hitSlop={8}>
                        <AppText style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.accentInk }}>Switch</AppText>
                      </Pressable>
                    )
                  }
                />
              ))}
            </ListCard>
          </View>
        )}
      </ChildGate>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <Pressable accessibilityRole="button" onPress={() => void logout()} hitSlop={8}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.badFg }}>Sign out</AppText>
        </Pressable>
        <AppText variant="caption" style={{ fontSize: 13 }}>{SCHOOL.name} · Powered by InstiFlow</AppText>
      </View>
    </Screen>
  );
}
