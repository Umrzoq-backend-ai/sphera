import { LS_LANG } from './config';
import { locales } from '../locales';
import type { Language, Namespace } from '../locales';

export type { Language, Namespace };

export function getLang(): Language {
  const stored = localStorage.getItem(LS_LANG) as Language | null;
  if (stored && locales[stored]) return stored;
  return 'ru';
}

export function setLang(lang: Language) {
  if (locales[lang]) {
    localStorage.setItem(LS_LANG, lang);
  }
}

/**
 * Translate a key. Searches across all namespaces for current language.
 * Optionally pass a namespace to narrow the search.
 */
export function t(key: string, ns?: Namespace): string {
  const lang = getLang();
  const langData = locales[lang];

  if (ns) {
    const value = (langData[ns] as Record<string, string>)[key];
    if (value) return value;
  }

  // Search all namespaces
  for (const namespace of Object.keys(langData) as Namespace[]) {
    const value = (langData[namespace] as Record<string, string>)[key];
    if (value) return value;
  }

  // Fallback to Russian
  if (lang !== 'ru') {
    const ruData = locales.ru;
    for (const namespace of Object.keys(ruData) as Namespace[]) {
      const value = (ruData[namespace] as Record<string, string>)[key];
      if (value) return value;
    }
  }

  return key;
}
