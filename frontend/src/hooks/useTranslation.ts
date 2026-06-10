import { useState } from 'react';
import { t, getLang, setLang as setI18nLang } from '../lib/i18n';
import type { Language } from '../types';

export function useTranslation() {
  const [lang, setLangState] = useState<Language>(getLang());

  const setLang = (newLang: Language) => {
    setI18nLang(newLang);
    setLangState(newLang);
  };

  return { t, lang, setLang };
}
