import { StyleSheet, View } from 'react-native';

import { Avatar, CallButton, DetailCard, Hint, Section, openUrl, type DetailItem } from '@/components/account/bits';
import { useGoBack } from '@/components/account/nav';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { AppText, BackHeader, Screen } from '@/components/ui';
import { useChildProfile } from '@/features/parent/hooks';
import { present, telUrl } from '@/lib/contact';
import { fullDate } from '@/lib/dates';
import { colors, fonts, radius, shadow } from '@/theme';
import type { ChildProfile } from '@/types/parent';

const classLabel = (p: ChildProfile): string | null => {
  const cls = present(p.className);
  const section = present(p.sectionName);
  if (cls && section) return `${cls}, ${section}`;
  return cls ?? section;
};

const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const row = (label: string, value: string | null): DetailItem | null => (value ? { label, value } : null);

function detailItems(p: ChildProfile): DetailItem[] {
  const teacherPhone = present(p.classTeacher?.phone);
  const gender = present(p.gender);
  const candidates: (DetailItem | null)[] = [
    row('Admission no.', present(p.admissionNo)),
    row('Class', classLabel(p)),
    row('Roll no.', present(p.rollNo)),
    row('Gender', gender ? capitalise(gender) : null),
    row('Date of birth', fullDate(p.dateOfBirth)),
    row('Blood group', present(p.bloodGroup)),
    row('Class teacher', present(p.classTeacher?.name)),
    teacherPhone
      ? { label: 'Teacher phone', value: teacherPhone, onPress: () => void openUrl(telUrl(teacherPhone)), hint: 'Calls the class teacher' }
      : null,
  ];
  return candidates.filter((c): c is DetailItem => c !== null);
}

function Guardians({ items }: { items: ChildProfile['guardians'] }) {
  return (
    <Section title="Parents and guardians">
      <View style={[styles.card, shadow.card]}>
        {items.map((g, i) => {
          const phone = present(g.phone);
          const relation = present(g.relation);
          const sub = [relation ? capitalise(relation) : null, g.isPrimary ? 'Primary contact' : null].filter(Boolean).join(', ');
          return (
            <View key={`${g.name}-${i}`} style={[styles.row, i < items.length - 1 && styles.divider]}>
              <Avatar name={g.name} />
              <View style={{ flex: 1 }}>
                <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{g.name}</AppText>
                {sub ? (
                  <AppText variant="caption" style={{ marginTop: 2 }}>
                    {sub}
                  </AppText>
                ) : null}
                {phone ? (
                  <AppText variant="caption" style={{ marginTop: 2 }}>
                    {phone}
                  </AppText>
                ) : null}
              </View>
              {phone ? <CallButton label={`Call ${g.name}`} onPress={() => void openUrl(telUrl(phone))} /> : null}
            </View>
          );
        })}
      </View>
      <Hint>The school office keeps this list. To change it, please ask the office.</Hint>
    </Section>
  );
}

function ProfileBody({ profile }: { profile: ChildProfile }) {
  const items = detailItems(profile);
  return (
    <>
      {items.length > 0 ? <DetailCard items={items} /> : null}
      {profile.guardians.length > 0 ? <Guardians items={profile.guardians} /> : null}
    </>
  );
}

export default function ChildProfileScreen() {
  const goBack = useGoBack();
  const page = useChildPage();
  const profile = useChildProfile(page.child?.id);
  const name = profile.data?.name ?? page.child?.name ?? 'Child profile';
  const subtitle = profile.data ? (classLabel(profile.data) ?? undefined) : (page.child?.className ?? undefined);
  return (
    <Screen
      header={<BackHeader title={name} subtitle={subtitle} onBack={goBack} />}
      refreshing={profile.isRefetching}
      onRefresh={() => {
        void page.refetch();
        void profile.refetch();
      }}
    >
      {page.child ? (
        <QueryBoundary
          query={profile}
          isEmpty={(p) => detailItems(p).length === 0 && p.guardians.length === 0}
          empty={{ title: 'No details yet', message: 'The school has not added more details. Please contact the school office.' }}
        >
          {(data) => <ProfileBody profile={data} />}
        </QueryBoundary>
      ) : (
        page.gate
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14, minHeight: 72 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
});
