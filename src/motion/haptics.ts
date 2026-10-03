import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Haptics are a native-only extra: never throw, never run on web. Use only for meaningful taps. */
const run = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  fn().catch(() => undefined);
};

/** Light tick for tabs, toggles and chip selection. */
export const tapHaptic = () => run(() => Haptics.selectionAsync());
/** Firmer thud for primary buttons. */
export const pressHaptic = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const successHaptic = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const errorHaptic = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
