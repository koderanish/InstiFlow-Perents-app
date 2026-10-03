import { useEffect } from 'react';
import { Alert, AppState, Linking, StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/icon-badge';
import { AppText, Card, Chip, PrimaryButton } from '@/components/ui';
import { useT, type TKey } from '@/i18n';
import { errorHaptic, successHaptic } from '@/motion/haptics';
import { usePushStore } from '@/notifications/push-store';
import { checkPushPermission, registerForPush } from '@/notifications/service';
import { useStyles, type Theme } from '@/theme';

/** Tells the parent whether alerts reach this phone, and lets them turn them on. Asks for permission only when tapped. */
export function PushCard() {
  const t = useT();
  const styles = useStyles(createStyles);
  const permission = usePushStore((s) => s.permission);
  const busy = usePushStore((s) => s.busy);
  const error = usePushStore((s) => s.error);

  // Coming back from the phone's settings shows the new state straight away.
  useEffect(() => {
    void checkPushPermission();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void checkPushPermission();
    });
    return () => subscription.remove();
  }, []);

  const turnOn = async () => {
    const result = await registerForPush();
    if (result === 'ok') successHaptic();
    else if (result !== 'unavailable') errorHaptic();
  };

  const openSettings = () => {
    Linking.openSettings().catch(() => Alert.alert(t('account.link.failedTitle'), t('account.push.settingsFailed')));
  };

  if (permission === 'unavailable') {
    return (
      <Card>
        <View style={styles.row}>
          <IconBadge name="smartphone" />
          <AppText variant="caption" style={styles.flex}>
            {t('account.push.unavailableBody')}
          </AppText>
        </View>
      </Card>
    );
  }

  if (permission === 'granted' && !error) {
    return (
      <Card>
        <View style={styles.row}>
          <IconBadge name="bell" tone="good" />
          <View style={styles.flex}>
            <AppText variant="heading" accessibilityRole="header">
              {t('account.push.onTitle')}
            </AppText>
            <AppText variant="caption" style={styles.body}>
              {t('account.push.onBody')}
            </AppText>
          </View>
          <Chip label={t('account.push.onChip')} tone="good" />
        </View>
      </Card>
    );
  }

  const denied = permission === 'denied';
  const errorKey: TKey | null = error === 'setup' ? 'account.push.errorSetup' : error === 'failed' ? 'account.push.errorFailed' : null;
  return (
    <Card>
      <View style={styles.row}>
        <IconBadge name={denied ? 'bell-off' : 'bell'} tone={denied ? 'warn' : 'neutral'} />
        <View style={styles.flex}>
          <AppText variant="heading" accessibilityRole="header">
            {t(denied ? 'account.push.deniedTitle' : 'account.push.offTitle')}
          </AppText>
          <AppText variant="caption" style={styles.body}>
            {t(denied ? 'account.push.deniedBody' : 'account.push.offBody')}
          </AppText>
        </View>
      </View>
      {errorKey ? (
        <AppText variant="caption" accessibilityLiveRegion="polite" style={styles.error}>
          {t(errorKey)}
        </AppText>
      ) : null}
      <View style={styles.action}>
        {denied ? (
          <PrimaryButton label={t('account.push.openSettings')} onPress={openSettings} />
        ) : (
          <PrimaryButton label={t('account.push.turnOn')} onPress={() => void turnOn()} loading={busy} />
        )}
      </View>
    </Card>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    flex: { flex: 1 },
    body: { marginTop: 2, lineHeight: 20 },
    error: { marginTop: 12, color: colors.badFg },
    action: { marginTop: 16 },
  });
