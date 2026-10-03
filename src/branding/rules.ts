import { SCHOOL } from '@/config/school';

/** What the school admin chose in the admin panel. */
export type Branding = {
  name: string;
  shortName: string;
  /** A small PNG/JPEG/WEBP data URL or an https URL. Null means "show the initials". */
  logoUrl: string | null;
  accent: string;
};

export const DEFAULT_BRANDING: Branding = { name: SCHOOL.name, shortName: SCHOOL.shortName, logoUrl: null, accent: SCHOOL.accent };

const HEX = /^#[0-9a-fA-F]{6}$/;
const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
/** SecureStore warns above about 2 KB, so bigger logos are fetched again each launch instead of saved. */
export const MAX_SAVED_LOGO_LENGTH = 1500;

export const isHexColour = (value: unknown): value is string => typeof value === 'string' && HEX.test(value);

export const isUsableLogo = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && (value.startsWith('https://') || IMAGE_DATA_URL.test(value));

const text = (value: unknown, fallback: string): string => (typeof value === 'string' && value.trim() ? value.trim() : fallback);

/** Turns whatever the server sent into a safe Branding. Anything odd falls back to the compiled-in school. */
export function parseBranding(input: unknown, fallback: Branding = DEFAULT_BRANDING): Branding {
  if (typeof input !== 'object' || input === null) return fallback;
  const r = input as Record<string, unknown>;
  return {
    name: text(r.name, fallback.name),
    shortName: text(r.shortName, fallback.shortName).slice(0, 3).toUpperCase(),
    logoUrl: isUsableLogo(r.logoUrl) ? r.logoUrl : null,
    accent: isHexColour(r.accent) ? r.accent.toUpperCase() : fallback.accent,
  };
}

/** The part worth saving on the phone, so the next launch starts with the right colour and name. */
export const toSaved = (b: Branding): string =>
  JSON.stringify({ ...b, logoUrl: b.logoUrl && b.logoUrl.length <= MAX_SAVED_LOGO_LENGTH ? b.logoUrl : null });

export function parseSaved(raw: string | null): Branding | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parseBranding(parsed) : null;
  } catch {
    return null;
  }
}

/** Relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const channel = (shift: number) => {
    const v = parseInt(hex.slice(shift, shift + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Dark ink or white, whichever reads better on the school colour. */
export function onColour(hex: string, ink = '#1F1B18'): string {
  const l = luminance(hex);
  return contrast(l, luminance(ink)) >= contrast(l, 1) ? ink : '#FFFFFF';
}
