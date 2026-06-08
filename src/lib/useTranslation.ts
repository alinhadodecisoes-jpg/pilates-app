'use client';

import { useState, useEffect, useCallback } from 'react';
import { translations, Locale, TranslationKey, t } from './i18n';

const LOCALE_STORAGE_KEY = 'daimach-locale';
const LOCALE_CHANGE_EVENT = 'daimach-locale-change';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-br';
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  return saved && translations[saved] ? saved : 'pt-br';
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    // Listen for locale changes from other components
    const handler = (e: Event) => {
      const newLocale = (e as CustomEvent).detail as Locale;
      if (newLocale && translations[newLocale]) {
        setLocaleState(newLocale);
      }
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, handler);
  }, []);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // Notify other components
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: newLocale }));
  }, []);

  const translate = useCallback(
    (key: TranslationKey) => t(locale, key),
    [locale]
  );

  return {
    locale,
    changeLocale,
    t: translate,
  };
}
