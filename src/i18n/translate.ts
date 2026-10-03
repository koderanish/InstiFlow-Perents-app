import { en } from './en';
import { hi } from './hi';
import type { Locale } from './types';

type PluralBase<K> = K extends `${infer B}_one` ? B : K extends `${infer B}_other` ? B : K;

/** Keys as used in code: plural variants (`x_one` / `x_other`) are addressed as plain `x` with `{ count }`. */
export type TKey = PluralBase<keyof typeof en>;
export type TParams = Record<string, string | number>;
export type TFunction = (key: TKey, params?: TParams) => string;

const tables: Record<Locale, Record<string, string>> = { en, hi };

/** English and Hindi both use "one" for 1; Hindi also uses it for 0 ("0 कक्षा"). */
export const pluralForm = (locale: Locale, count: number): 'one' | 'other' => (count === 1 || (locale === 'hi' && count === 0) ? 'one' : 'other');

export const translate = (locale: Locale, key: TKey, params?: TParams): string => {
  const table = tables[locale];
  let id: string = key;
  if (params && typeof params.count === 'number') {
    const plural = `${key}_${pluralForm(locale, params.count)}`;
    if (plural in en) id = plural;
  }
  const raw = table[id] ?? tables.en[id] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_match, name: string) => String(params?.[name] ?? ''));
};

export const makeT = (locale: Locale): TFunction => (key, params) => translate(locale, key, params);

/** English fallback for pure helpers called without a translator (tests, background code). */
export const defaultT: TFunction = makeT('en');

/** Hindi when the phone is set to Hindi, otherwise English. */
export const detectLocale = (): Locale => {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale;
    return tag.toLowerCase().startsWith('hi') ? 'hi' : 'en';
  } catch {
    return 'en';
  }
};
