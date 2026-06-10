import { useTranslation } from '../../hooks/useTranslation';
import type { Language } from '../../types';

interface LanguageSelectorProps {
  selectedLang: Language;
  onLangChange: (lang: Language) => void;
}

export function LanguageSelector({ selectedLang, onLangChange }: LanguageSelectorProps) {
  const { t } = useTranslation();

  const languages: { code: Language; flag: string; label: string }[] = [
    { code: 'ru', flag: '🇷🇺', label: 'RU' },
    { code: 'lt', flag: '🇱🇹', label: 'LT' },
    { code: 'en', flag: '🇬🇧', label: 'EN' },
  ];

  return (
    <div className="glass p-3.5 px-4">
      <div className="text-[11px] tracking-wide text-[#6b7c9e] mb-2.5">
        {t('anons_lang_hint')}
      </div>
      <div className="flex gap-2.5">
        {languages.map((lang) => {
          const isActive = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => onLangChange(lang.code)}
              className={`flex-1 py-2.5 px-2 rounded-[14px] border font-semibold text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-[#2ea8ff] to-[#38e1ff] text-[#02101f] border-transparent'
                  : 'bg-[rgba(6,10,20,0.5)] text-[#dbe9ff] border-[var(--glass-border)]'
              }`}
              style={isActive ? { boxShadow: '0 0 16px var(--glow)' } : {}}
            >
              {lang.flag} {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
