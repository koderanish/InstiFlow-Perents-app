import { lightPalette, makeShadows, mix } from './palette';

export { darkPalette, lightPalette, makeShadows, mix } from './palette';
export type { Palette, Shadows } from './palette';
export { buildTheme, resolveScheme, ThemeProvider, useTheme } from './provider';
export type { Theme } from './provider';
export { useStyles } from './use-styles';

/**
 * @deprecated Light colours only. Use `useTheme().colors` (or `useStyles`) so the screen follows dark mode.
 */
export const colors = lightPalette;

export const fonts = {
  body: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semibold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
  display: 'DMSerifDisplay_400Regular',
} as const;

export const radius = { chip: 20, card: 24, hero: 28, button: 28 } as const;

/** @deprecated Light shadow only. Use `useTheme().shadow`. */
export const shadow = makeShadows(false);
