import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { openUrl } from '@/components/account/bits';
import { useGoBack } from '@/components/account/nav';
import { QueryBoundary } from '@/components/account/page-state';
import { AppText, BackHeader, Card, Screen } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useSchoolContact } from '@/features/parent/hooks';
import { contactActions, hasContact, mapsUrl, present, type ContactAction } from '@/lib/contact';
import { colors, fonts, radius, shadow } from '@/theme';
import type { SchoolContact } from '@/types/parent';

const ICONS = { call: 'phone', email: 'mail', website: 'globe' } as const;

function ActionRow({ action, last }: { action: ContactAction; last: boolean }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${action.title}, ${action.subtitle}`}
      onPress={() => void openUrl(action.url)}
      style={[styles.row, !last && styles.divider]}
    >
      <View style={{ flex: 1 }}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{action.title}</AppText>
        <AppText variant="caption" style={{ marginTop: 2 }}>
          {action.subtitle}
        </AppText>
      </View>
      <View style={styles.icon}>
        <Feather name={ICONS[action.id]} size={18} color={colors.accentInk} />
      </View>
    </Pressable>
  );
}

function ContactBody({ school }: { school: SchoolContact }) {
  const address = present(school.address);
  const actions = contactActions(school);
  return (
    <>
      {address ? (
        <Card>
          <AppText variant="caption" style={{ fontFamily: fonts.medium }}>
            Address
          </AppText>
          <AppText style={{ fontFamily: fonts.medium, fontSize: 17, lineHeight: 25, marginTop: 6 }}>{address}</AppText>
          <Pressable accessibilityRole="link" accessibilityLabel="Open the address in Maps" onPress={() => void openUrl(mapsUrl(address))} style={styles.mapsLink}>
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.accentInk }}>Open in Maps</AppText>
          </Pressable>
        </Card>
      ) : null}
      {actions.length > 0 ? (
        <View style={[styles.card, shadow.card]}>
          {actions.map((a, i) => (
            <ActionRow key={a.id} action={a} last={i === actions.length - 1} />
          ))}
        </View>
      ) : null}
    </>
  );
}

export default function ContactScreen() {
  const goBack = useGoBack();
  const contact = useSchoolContact();
  return (
    <Screen
      header={<BackHeader title="Contact the school" subtitle={contact.data?.name ?? SCHOOL.name} onBack={goBack} />}
      refreshing={contact.isRefetching}
      onRefresh={() => void contact.refetch()}
    >
      <QueryBoundary
        query={contact}
        isEmpty={(d) => !hasContact(d)}
        empty={{ title: 'No contact details yet', message: 'The school has not added a phone number or address. Please ask at the school office.' }}
      >
        {(data) => <ContactBody school={data} />}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14, minHeight: 72 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  mapsLink: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});
