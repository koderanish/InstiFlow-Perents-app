import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme, type Theme } from './provider';

/**
 * Themed StyleSheet. Declare the factory once at module level so it stays stable:
 *   const createStyles = (t: Theme) => ({ card: { backgroundColor: t.colors.card } });
 *   const styles = useStyles(createStyles);
 */
export function useStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [factory, theme]);
}

/** Any value derived from the theme (for example tone colour pairs). Keep the factory at module level. */
export function useThemed<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
