import { useMemo, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Hint, Section } from '@/components/account/bits';
import { DayStrip } from '@/components/account/date-strip';
import { DrawnCheck } from '@/components/account/drawn-check';
import { ErrorBanner } from '@/components/account/error-banner';
import { FormScreen } from '@/components/account/form-screen';
import { Glide } from '@/components/account/motion-bits';
import { useGoBack } from '@/components/account/nav';
import { QueryBoundary, useChildPage } from '@/components/account/page-state';
import { SelectChip } from '@/components/account/select-chip';
import { WashCard } from '@/components/account/surfaces';
import { AppText, BackHeader, Card, Chip, ListCard, ListRow, PrimaryButton } from '@/components/ui';
import { useApplyLeave, useChildProfile, useLeave } from '@/features/parent/hooks';
import { dayStrip, shortDate, toISODate } from '@/lib/dates';
import { friendlyError, validationMessage } from '@/lib/errors';
import { firstName } from '@/lib/format';
import { composeReason, leaveRange, leaveStatusChip, MAX_LEAVE_DAYS, REASON_CHOICES, REASON_MAX, validateLeave, type ReasonChoice } from '@/lib/leave';
import { successHaptic } from '@/motion/haptics';
import { enterFade, exitFade } from '@/motion/presets';
import { PressableScale } from '@/motion/pressable-scale';
import { Reveal } from '@/motion/reveal';
import { colors, fonts } from '@/theme';
import type { LeaveData, ParentChild } from '@/types/parent';

type Field = 'from' | 'to' | null;

function DateField({ label, day, open, onPress }: { label: string; day: string; open: boolean; onPress: () => void }) {
  const text = shortDate(day) ?? day;
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="caption" style={{ fontSize: 13, marginBottom: 6 }}>
        {label}
      </AppText>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${label} date, ${text}`}
        accessibilityHint="Opens the day chooser"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          Keyboard.dismiss();
          onPress();
        }}
        style={[styles.field, open && { borderColor: colors.accent }]}
      >
        <AppText numberOfLines={1} tabular style={{ fontFamily: fonts.medium }}>{text}</AppText>
      </PressableScale>
    </View>
  );
}

function LeaveForm({ child, teacher }: { child: ParentChild; teacher: string | null }) {
  const apply = useApplyLeave(child.id);
  const today = useMemo(() => toISODate(new Date()), []);
  const days = useMemo(() => dayStrip(today, MAX_LEAVE_DAYS), [today]);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [open, setOpen] = useState<Field>(null);
  const [choice, setChoice] = useState<ReasonChoice | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const pickStart = (iso: string) => {
    setStart(iso);
    if (end < iso) setEnd(iso);
    setError(null);
    setOpen('to');
  };
  const pickEnd = (iso: string) => {
    setEnd(iso);
    setError(null);
    setOpen(null);
  };

  const submit = () => {
    Keyboard.dismiss();
    const input = { startDate: start, endDate: end, reason: composeReason(choice, note) };
    const check = validateLeave(input);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError(null);
    apply.mutate(input, {
      onSuccess: () => {
        successHaptic();
        setSent(true);
        setChoice(null);
        setNote('');
        setOpen(null);
      },
      onError: (e) => setError(validationMessage(e) ?? friendlyError(e)),
    });
  };

  if (sent) {
    return (
      <Reveal index={0}>
        <WashCard tint={colors.goodBg}>
          <DrawnCheck />
          <View style={{ marginTop: 16 }}>
            <Chip label="Sent" tone="good" />
          </View>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 24, lineHeight: 28, marginTop: 14 }}>Leave note sent</AppText>
          <AppText variant="caption" style={{ fontSize: 15, lineHeight: 22, marginTop: 6 }}>
            {teacher ? `${teacher} and the school office can see it now.` : 'The school can see it now.'} You will see its status in the list below.
          </AppText>
          <View style={{ marginTop: 18 }}>
            <PrimaryButton label="Write another note" onPress={() => setSent(false)} />
          </View>
        </WashCard>
      </Reveal>
    );
  }

  return (
    <>
      <Reveal index={0}>
        <Card style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <DateField label="From" day={start} open={open === 'from'} onPress={() => setOpen(open === 'from' ? null : 'from')} />
            <DateField label="To" day={end} open={open === 'to'} onPress={() => setOpen(open === 'to' ? null : 'to')} />
          </View>
          {open ? (
            <Animated.View entering={enterFade(0)} exiting={exitFade}>
              <DayStrip
                label={open === 'from' ? 'Choose the first day' : 'Choose the last day'}
                days={days}
                selected={open === 'from' ? start : end}
                minDay={open === 'to' ? start : undefined}
                onSelect={open === 'from' ? pickStart : pickEnd}
              />
            </Animated.View>
          ) : null}

          <Glide>
            <AppText variant="caption" style={{ fontSize: 13, marginBottom: 8 }}>
              Reason
            </AppText>
            <View style={styles.choices}>
              {REASON_CHOICES.map((r) => (
                <SelectChip
                  key={r}
                  label={r}
                  selected={choice === r}
                  onPress={() => {
                    Keyboard.dismiss();
                    setChoice(choice === r ? null : r);
                    setError(null);
                  }}
                />
              ))}
            </View>
          </Glide>

          <Glide>
            <AppText variant="caption" style={{ fontSize: 13, marginBottom: 6 }}>
              Note for the teacher
            </AppText>
            <TextInput
              accessibilityLabel="Note for the teacher"
              multiline
              maxLength={REASON_MAX}
              placeholder={`For example, ${firstName(child.name)} has a fever and the doctor advised rest.`}
              placeholderTextColor={colors.faint}
              style={styles.note}
              textAlignVertical="top"
              value={note}
              onChangeText={(t) => {
                setNote(t);
                setError(null);
              }}
            />
          </Glide>
        </Card>
      </Reveal>
      {error ? <ErrorBanner message={error} /> : null}
      <Reveal index={1} style={{ gap: 20 }}>
        <Hint>The school will review your note. You can see whether it was approved in the list below.</Hint>
        <PrimaryButton label={teacher ? `Send to ${teacher}` : 'Send to the school'} onPress={submit} loading={apply.isPending} />
      </Reveal>
    </>
  );
}

function History({ data }: { data: LeaveData }) {
  const notes = [...data.notes].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  return (
    <Section title="Earlier notes">
      <ListCard>
        {notes.map((n, i) => {
          const chip = leaveStatusChip(n.status);
          const lines = [n.reason, n.reviewNote ? `School's note: ${n.reviewNote}` : null].filter((l): l is string => !!l);
          return (
            <Reveal key={n.id} index={i}>
              <ListRow
                title={leaveRange(n.startDate, n.endDate)}
                subtitle={lines.join('\n') || undefined}
                icon="file-text"
                dot={chip.tone}
                last={i === notes.length - 1}
                right={<Chip label={chip.label} tone={chip.tone} />}
              />
            </Reveal>
          );
        })}
      </ListCard>
    </Section>
  );
}

export default function LeaveScreen() {
  const goBack = useGoBack();
  const page = useChildPage();
  const leave = useLeave(page.child?.id);
  const profile = useChildProfile(page.child?.id);
  const teacher = profile.data?.classTeacher?.name ?? null;
  const subtitle = page.child ? `${firstName(page.child.name)}${page.child.className ? `, ${page.child.className}` : ''}` : undefined;

  return (
    <FormScreen
      header={<BackHeader title="Leave note" subtitle={subtitle} onBack={goBack} />}
      refreshing={leave.isRefetching}
      onRefresh={() => {
        void page.refetch();
        void leave.refetch();
        void profile.refetch();
      }}
    >
      {page.child ? (
        <>
          <LeaveForm child={page.child} teacher={teacher} />
          <QueryBoundary query={leave} isEmpty={(d) => d.notes.length === 0} empty={{ title: 'No leave notes yet', message: 'Notes you send will be listed here with their status.' }}>
            {(data) => <History data={data} />}
          </QueryBoundary>
        </>
      ) : (
        page.gate
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  field: { height: 48, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, justifyContent: 'center' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { minHeight: 96, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.ink },
});
