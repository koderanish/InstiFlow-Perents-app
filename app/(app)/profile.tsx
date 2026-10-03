import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppearancePicker } from '@/components/account/appearance-picker';
import { BackButton } from '@/components/account/back-button';
import { Avatar, DetailCard, Section } from '@/components/account/bits';
import { PoweredBy } from '@/components/account/brand';
import { InsetList, Tray, WashCard } from '@/components/account/surfaces';
import { CollapsingScreen } from '@/components/collapsing-screen';
import { AppText, ListCard, ListRow } from '@/components/ui';
import { useSchool } from '@/branding';
import { useChildren } from '@/features/parent/hooks';
import { detectLocale, LOCALE_NAMES, useT } from '@/i18n';
import { initials } from '@/lib/format';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { useAuthStore } from '@/stores/auth-store';
import { useChildStore } from '@/stores/child-store';
import { usePrefsStore } from '@/stores/prefs-store';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';

export default function ProfileScreen() {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const school = useSchool();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const select = useChildStore((s) => s.select);
  const language = usePrefsStore((s) => s.language);
  const { child, children: all, refetch, isRefetching } = useChildren();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const name = user?.full_name ?? '';
  const languageName = language ? LOCALE_NAMES[language] : t('account.language.phoneNamed', { language: LOCALE_NAMES[detectLocale()] });

  return (
    <CollapsingScreen title={t('account.profile.title')} leading={<BackButton />} refreshing={isRefetching} onRefresh={() => void refetch()}>
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
          <Section title={t('account.profile.children')}>
            <ListCard>
              {all.map((c, i) => {
                const viewing = child?.id === c.id;
                return (
                  <PressableScale
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityLabel={viewing ? t('account.profile.childRowViewing', { name: c.name, class: c.className }) : t('account.profile.childRow', { name: c.name, class: c.className })}
                    accessibilityHint={t('account.profile.childHint')}
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
                          <AppText style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.accentInk }}>{t('account.profile.viewing')}</AppText>
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
            <ListRow icon="file-text" title={t('account.profile.leave')} subtitle={t('account.profile.leaveHint')} href="/(app)/leave" />
            <ListRow icon="phone" title={t('account.profile.contact')} href="/(app)/contact" />
            <ListRow icon="bell" title={t('account.profile.notifications')} href="/(app)/notification-settings" />
            <ListRow icon="lock" title={t('account.profile.password')} href="/(app)/change-password" last />
          </InsetList>
        </Tray>
      </Reveal>

      <Reveal index={3}>
        <Section title={t('account.profile.preferences')}>
          <ListCard>
            <ListRow icon="globe" title={t('account.language.title')} subtitle={languageName} href="/(app)/language" last />
          </ListCard>
        </Section>
      </Reveal>

      <Reveal index={4}>
        <AppearancePicker />
      </Reveal>

      <Reveal index={5}>
        <Section title={t('account.profile.about')}>
          <DetailCard
            items={[
              { label: t('account.profile.school'), value: school.name },
              { label: t('account.profile.version'), value: version },
            ]}
          />
        </Section>
      </Reveal>

      <Reveal index={6}>
        <View style={styles.footer}>
          <PressableScale accessibilityRole="button" accessibilityLabel={t('account.profile.signOut')} haptic="press" hitSlop={8} onPress={() => void logout()} style={styles.signOut}>
            <Feather name="log-out" size={16} color={colors.badFg} />
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.badFg }}>{t('account.profile.signOut')}</AppText>
          </PressableScale>
          <PoweredBy />
        </View>
      </Reveal>
    </CollapsingScreen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    who: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16, minHeight: 64 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    viewing: { backgroundColor: colors.accentTint, borderRadius: 16, minHeight: 32, paddingHorizontal: 12, justifyContent: 'center' },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
    signOut: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  });
