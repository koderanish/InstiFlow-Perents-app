import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { openUrl } from '@/components/account/bits';
import { useGoBack } from '@/components/account/nav';
import { QueryBoundary } from '@/components/account/page-state';
import { InsetList, Tray, WashCard } from '@/components/account/surfaces';
import { IconBadge } from '@/components/icon-badge';
import { AppText, BackHeader, Screen } from '@/components/ui';
import { useSchool } from '@/branding';
import { useSchoolContact } from '@/features/parent/hooks';
import { useT } from '@/i18n';
import { contactActions, hasContact, mapsUrl, present, type ContactAction } from '@/lib/contact';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { fonts, useStyles, useTheme, type Theme } from '@/theme';
import type { SchoolContact } from '@/types/parent';

const ICONS = { call: 'phone', email: 'mail', website: 'globe' } as const;

function ActionRow({ action, last }: { action: ContactAction; last: boolean }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={`${action.title}, ${action.subtitle}`}
      scaleTo={0.985}
      onPress={() => void openUrl(action.url, t)}
    >
      <View style={[styles.row, !last && styles.divider]}>
        <IconBadge name={ICONS[action.id]} />
        <View style={{ flex: 1 }}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{action.title}</AppText>
          <AppText variant="caption" tabular style={{ marginTop: 2 }}>
            {action.subtitle}
          </AppText>
        </View>
        <Feather name="chevron-right" size={18} color={colors.faint} />
      </View>
    </PressableScale>
  );
}

function ContactBody({ school }: { school: SchoolContact }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = useT();
  const address = present(school.address);
  const actions = contactActions(school, t);
  return (
    <>
      {address ? (
        <Reveal index={0}>
          <WashCard padding={22}>
            <View style={styles.addressTop}>
              <IconBadge name="map-pin" />
              <AppText variant="caption" style={{ fontFamily: fonts.medium }}>
                {t('account.contact.address')}
              </AppText>
            </View>
            <AppText style={{ fontFamily: fonts.medium, fontSize: 17, lineHeight: 25, marginTop: 12 }}>{address}</AppText>
            <PressableScale accessibilityRole="link" accessibilityLabel={t('account.contact.mapsLabel')} onPress={() => void openUrl(mapsUrl(address), t)} style={styles.mapsLink}>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.accentInk }}>{t('account.contact.maps')}</AppText>
            </PressableScale>
          </WashCard>
        </Reveal>
      ) : null}
      {actions.length > 0 ? (
        <Reveal index={1}>
          <Tray>
            <InsetList>
              {actions.map((a, i) => (
                <ActionRow key={a.id} action={a} last={i === actions.length - 1} />
              ))}
            </InsetList>
          </Tray>
        </Reveal>
      ) : null}
    </>
  );
}

export default function ContactScreen() {
  const t = useT();
  const school = useSchool();
  const goBack = useGoBack();
  const contact = useSchoolContact();
  return (
    <Screen
      header={<BackHeader title={t('account.contact.title')} subtitle={contact.data?.name ?? school.name} onBack={goBack} />}
      refreshing={contact.isRefetching}
      onRefresh={() => void contact.refetch()}
    >
      <QueryBoundary
        query={contact}
        isEmpty={(d) => !hasContact(d)}
        empty={{ title: t('account.contact.emptyTitle'), message: t('account.contact.emptyMessage') }}
      >
        {(data) => <ContactBody school={data} />}
      </QueryBoundary>
    </Screen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14, minHeight: 72 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    addressTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    mapsLink: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  });
