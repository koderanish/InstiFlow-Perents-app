import { SCHOOL } from '@/config/school';

const channel = (hex: string, shift: number) => parseInt(hex.slice(shift, shift + 2), 16);

const mix = (from: string, to: string, k: number): string => {
  const f = from.replace('#', '');
  const t = to.replace('#', '');
  const ch = (shift: number) => Math.round(channel(f, shift) + (channel(t, shift) - channel(f, shift)) * k);
  return `#${[0, 2, 4].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
};

const base = /^#[0-9a-fA-F]{6}$/.test(SCHOOL.accent) ? SCHOOL.accent : '#FF4F2E';

/** Colours are the approved Parents design. The accent is the school's own. */
export const colors = {
  bg: '#FAF7F4',
  card: '#FFFFFF',
  ink: '#1F1B18',
  muted: '#6F665F',
  faint: '#8A8179',
  border: '#EFE8E2',
  divider: '#F3EDE8',
  accent: base,
  /** Text colour on the accent. Dark ink keeps 5.6:1 contrast on the brand orange. */
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
} as const;

export const fonts = {
  body: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semibold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
  display: 'DMSerifDisplay_400Regular',
} as const;

export const radius = { chip: 20, card: 24, hero: 28, button: 28 } as const;

export const shadow = {
  card: {
    shadowColor: '#1F1B18',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export { mix };
