import { StyleSheet, View } from 'react-native';

import { Avatar, CallButton, DetailCard, Hint, Section, openUrl, type DetailItem } from '@/components/account/bits';
import { useGoBack } from '@/components/account/nav';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { InsetList, Tray } from '@/components/account/surfaces';
import { AppText, BackHeader, Screen } from '@/components/ui';
import { useChildProfile } from '@/features/parent/hooks';
import { useLocale, useT, type Locale, type TFunction, type TKey } from '@/i18n';
import { present, telUrl } from '@/lib/contact';
import { fullDate } from '@/lib/dates';
import { Reveal } from '@/motion/reveal';
import { fonts, useStyles, type Theme } from '@/theme';
import type { ChildProfile } from '@/types/parent';

const classLabel = (p: ChildProfile): string | null => {
  const cls = present(p.className);
  const section = present(p.sectionName);
  if (cls && section) return `${cls}, ${section}`;
  return cls ?? section;
};

const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** Known words from the school's records get a translation; anything else is shown as written. */
const KNOWN_WORDS: Record<string, TKey> = {
  male: 'account.child.male',
  female: 'account.child.female',
  other: 'account.child.otherGender',
  father: 'account.child.father',
  mother: 'account.child.mother',
  guardian: 'account.child.guardian',
};

const knownWord = (value: string, t: TFunction): string => {
  const key = KNOWN_WORDS[value.trim().toLowerCase()];
  return key ? t(key) : capitalise(value);
};

const row = (label: string, value: string | null): DetailItem | null => (value ? { label, value } : null);

function detailItems(p: ChildProfile, t: TFunction, locale: Locale): DetailItem[] {
  const teacherPhone = present(p.classTeacher?.phone);
  const gender = present(p.gender);
  const candidates: (DetailItem | null)[] = [
    row(t('account.child.admissionNo'), present(p.admissionNo)),
    row(t('account.child.class'), classLabel(p)),
    row(t('account.child.rollNo'), present(p.rollNo)),
    row(t('account.child.gender'), gender ? knownWord(gender, t) : null),
    row(t('account.child.dob'), fullDate(p.dateOfBirth, locale)),
    row(t('account.child.bloodGroup'), present(p.bloodGroup)),
    row(t('account.child.classTeacher'), present(p.classTeacher?.name)),
    teacherPhone
      ? { label: t('account.child.teacherPhone'), value: teacherPhone, onPress: () => void openUrl(telUrl(teacherPhone), t), hint: t('account.child.teacherPhoneHint') }
      : null,
  ];
  return candidates.filter((c): c is DetailItem => c !== null);
}

function Guardians({ items }: { items: ChildProfile['guardians'] }) {
  const styles = useStyles(createStyles);
  const t = useT();
  return (
    <Section title={t('account.child.guardians')}>
      <Tray>
        <InsetList>
          {items.map((g, i) => {
            const phone = present(g.phone);
            const relation = present(g.relation);
            const sub = [relation ? knownWord(relation, t) : null, g.isPrimary ? t('account.child.primary') : null].filter(Boolean).join(', ');
            return (
              <View key={`${g.name}-${i}`} style={[styles.row, i < items.length - 1 && styles.divider]}>
                <Avatar name={g.name} />
                <View style={{ flex: 1 }}>
                  <AppText numberOfLines={2} style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{g.name}</AppText>
                  {sub ? (
                    <AppText variant="caption" style={{ marginTop: 2 }}>
                      {sub}
                    </AppText>
                  ) : null}
                  {phone ? (
                    <AppText variant="caption" tabular style={{ marginTop: 2 }}>
                      {phone}
                    </AppText>
                  ) : null}
                </View>
                {phone ? <CallButton label={t('account.child.callName', { name: g.name })} onPress={() => void openUrl(telUrl(phone), t)} /> : null}
              </View>
            );
          })}
        </InsetList>
      </Tray>
      <Hint>{t('account.child.guardiansHint')}</Hint>
    </Section>
  );
}

function ProfileBody({ profile }: { profile: ChildProfile }) {
  const t = useT();
  const locale = useLocale();
  const items = detailItems(profile, t, locale);
  return (
    <>
      {items.length > 0 ? (
        <Reveal index={0}>
          <DetailCard items={items} />
        </Reveal>
      ) : null}
      {profile.guardians.length > 0 ? (
        <Reveal index={1}>
          <Guardians items={profile.guardians} />
        </Reveal>
      ) : null}
    </>
  );
}

export default function ChildProfileScreen() {
  const t = useT();
  const locale = useLocale();
  const goBack = useGoBack();
  const page = useChildPage();
  const profile = useChildProfile(page.child?.id);
  const name = profile.data?.name ?? page.child?.name ?? t('account.child.title');
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
          isEmpty={(p) => detailItems(p, t, locale).length === 0 && p.guardians.length === 0}
          empty={{ title: t('account.child.emptyTitle'), message: t('account.child.emptyMessage') }}
        >
          {(data) => <ProfileBody profile={data} />}
        </QueryBoundary>
      ) : (
        page.gate
      )}
    </Screen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14, minHeight: 72 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  });
