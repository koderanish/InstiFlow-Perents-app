import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemeMode } from '@/lib/prefs';
import { usePrefsStore } from '@/stores/prefs-store';

import { darkPalette, lightPalette, makeShadows, type Palette, type Shadows } from './palette';

export type Theme = {
  scheme: 'light' | 'dark';
  isDark: boolean;
  /** The parent's choice: follow the phone, or force light or dark. */
  mode: ThemeMode;
  colors: Palette;
  shadow: Shadows;
};

export const resolveScheme = (mode: ThemeMode, system: string | null | undefined): 'light' | 'dark' =>
  mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

export const buildTheme = (mode: ThemeMode, system: string | null | undefined): Theme => {
  const scheme = resolveScheme(mode, system);
  const isDark = scheme === 'dark';
  return { scheme, isDark, mode, colors: isDark ? darkPalette : lightPalette, shadow: makeShadows(isDark) };
};

const ThemeContext = createContext<Theme>(buildTheme('light', 'light'));

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const mode = usePrefsStore((s) => s.themeMode);
  const theme = useMemo(() => buildTheme(mode, system), [mode, system]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): Theme => useContext(ThemeContext);
