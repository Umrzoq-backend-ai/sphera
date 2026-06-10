import { Globe } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { Language } from '../../types';

interface LanguageSelectorProps {
  selectedLang: Language;
  onLangChange: (lang: Language) => void;
}

export function LanguageSelector({ selectedLang, onLangChange }: LanguageSelectorProps) {
  const { t } = useTranslation();

  const languages: { code: Language; label: string }[] = [
    { code: 'ru', label: 'RU' },
    { code: 'lt', label: 'LT' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div className="glass p-3">
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <Globe className="w-3.5 h-3.5 text-[#6b7c9e]" strokeWidth={2} />
        <p className="text-[10px] font-medium text-[#6b7c9e] uppercase tracking-wide">
          {t('anons_lang_hint')}
        </p>
      </div>

      {/* Compact Language Buttons */}
      <div className="flex gap-2">
        {languages.map((lang) => {
          const isActive = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => onLangChange(lang.code)}
              className={`
                flex-1 py-2 px-2 rounded-lg font-bold text-xs
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-linear-to-br from-[#38e1ff] to-[#4a6cf7] text-[#02101f] shadow-[0_0_12px_rgba(56,225,255,0.3)]'
                    : 'bg-white/5 text-[#8b9bb3] border border-white/10 hover:bg-white/10 hover:text-[#dbe9ff]'
                }
              `}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
