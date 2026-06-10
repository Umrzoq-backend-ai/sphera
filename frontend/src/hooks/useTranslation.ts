import { useState, useCallback } from 'react';
import { t as translate, getLang, setLang as setI18nLang } from '../lib/i18n';
import type { Language, Namespace } from '../lib/i18n';

export function useTranslation(ns?: Namespace) {
  const [lang, setLangState] = useState<Language>(getLang());

  const setLang = useCallback((newLang: Language) => {
    setI18nLang(newLang);
    setLangState(newLang);
  }, []);

  const t = useCallback((key: string) => {
    return translate(key, ns);
  }, [lang, ns]);

  return { t, lang, setLang };
}
