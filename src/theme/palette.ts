import { SCHOOL } from '@/config/school';

const channel = (hex: string, shift: number) => parseInt(hex.slice(shift, shift + 2), 16);

export const mix = (from: string, to: string, k: number): string => {
  const f = from.replace('#', '');
  const t = to.replace('#', '');
  const ch = (shift: number) => Math.round(channel(f, shift) + (channel(t, shift) - channel(f, shift)) * k);
  return `#${[0, 2, 4].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
};

const base = /^#[0-9a-fA-F]{6}$/.test(SCHOOL.accent) ? SCHOOL.accent : '#FF4F2E';

export type Palette = {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  faint: string;
  border: string;
  divider: string;
  accent: string;
  /** Text colour on the accent. Dark ink keeps good contrast on the brand colour in both themes. */
  onAccent: string;
  accentInk: string;
  accentTint: string;
  goodBg: string;
  goodFg: string;
  goodDot: string;
  warnBg: string;
  warnFg: string;
  badBg: string;
  badFg: string;
  /** Dim layer behind sheets and dialogs. */
  scrim: string;
};

/** Colours are the approved Parents design. The accent is the school's own. */
export const lightPalette: Palette = {
  bg: '#FAF7F4',
  card: '#FFFFFF',
  ink: '#1F1B18',
  muted: '#6F665F',
  faint: '#8A8179',
  border: '#EFE8E2',
  divider: '#F3EDE8',
  accent: base,
  onAccent: '#1F1B18',
  accentInk: mix(base, '#000000', 0.32),
  accentTint: mix(base, '#ffffff', 0.88),
  goodBg: '#E7F4EC',
  goodFg: '#1E7A4C',
  goodDot: '#1F9D63',
  warnBg: '#FFF1DB',
  warnFg: '#8F5300',
  badBg: '#FDE8EB',
  badFg: '#B4233A',
  scrim: 'rgba(31, 27, 24, 0.45)',
};

/** Warm near-black, never pure #000: same family as the light theme. */
export const darkPalette: Palette = {
  bg: '#14110F',
  card: '#201B18',
  ink: '#F6F0EA',
  muted: '#B8AEA5',
  faint: '#8E847B',
  border: '#332D29',
  divider: '#2A2420',
  accent: base,
  onAccent: '#1F1B18',
  accentInk: mix(base, '#ffffff', 0.42),
  accentTint: mix(base, '#14110F', 0.8),
  goodBg: '#16301F',
  goodFg: '#6FD3A0',
  goodDot: '#3DBE80',
  warnBg: '#3A2A10',
  warnFg: '#F2B766',
  badBg: '#3B1A20',
  badFg: '#F28B9B',
  scrim: 'rgba(0, 0, 0, 0.62)',
};

export type Shadows = {
  card: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
};

/** In dark mode shadows barely show, so the lift comes from the lighter card surface instead. */
export const makeShadows = (isDark: boolean): Shadows => ({
  card: {
    shadowColor: isDark ? '#000000' : '#1F1B18',
    shadowOpacity: isDark ? 0.4 : 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: isDark ? 0 : 2,
  },
});
