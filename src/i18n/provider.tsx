import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { usePrefsStore } from '@/stores/prefs-store';

import { detectLocale, makeT, type TFunction } from './translate';
import type { Locale } from './types';

type I18n = { locale: Locale; t: TFunction };

const I18nContext = createContext<I18n>({ locale: 'en', t: makeT('en') });

export function I18nProvider({ children }: PropsWithChildren) {
  const chosen = usePrefsStore((s) => s.language);
  const locale = chosen ?? detectLocale();
  const value = useMemo<I18n>(() => ({ locale, t: makeT(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** `const t = useT(); t('common.back')`. Re-renders when the language changes. */
export const useT = (): TFunction => useContext(I18nContext).t;
export const useLocale = (): Locale => useContext(I18nContext).locale;
