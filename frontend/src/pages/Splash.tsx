import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, MessageSquare, Sparkles, Globe, Loader2 } from 'lucide-react';
import { authenticate } from '../lib/auth';
import { DEFAULT_CITY, LS_CITY } from '../lib/config';
import { useTranslation } from '../hooks/useTranslation';
import type { Language } from '../lib/i18n';

export function Splash() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useTranslation('splash');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function init() {
      setLoading(true);
      
      // Simulate progress animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      try {
        await authenticate();
        setProgress(100);
      } catch (e) {
        console.error('Auth error:', e);
        setProgress(100);
      }
      
      // Set default city
      localStorage.setItem(LS_CITY, DEFAULT_CITY);
      
      // Navigate to radio after auth
      setTimeout(() => {
        navigate('/radio');
      }, 1500);

      return () => clearInterval(progressInterval);
    }

    init();
  }, [navigate]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const languages: Array<{ code: Language; label: string }> = [
    { code: 'ru', label: 'RU' },
    { code: 'lt', label: 'LT' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060a14] via-[#0a0f1e] to-[#060a14] text-[#dbe9ff] flex items-center justify-center relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-[#38e1ff] opacity-[0.03] rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-[#4a6cf7] opacity-[0.03] rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Compact Language Selector */}
      <div className="absolute top-4 right-4 flex gap-1.5">
        {languages.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={`
              px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md
              transition-all duration-200
              ${
                lang === code
                  ? 'bg-[#38e1ff]/20 text-[#38e1ff] border border-[#38e1ff]/40'
                  : 'bg-white/5 text-[#6b7c9e] border border-white/10 hover:bg-white/10'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Content - Minimal */}
      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo - Simple */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-[#dbe9ff] via-[#38e1ff] to-[#dbe9ff] bg-clip-text text-transparent animate-gradient">
            {t('brand_title')}
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-6 bg-gradient-to-r from-transparent to-[#38e1ff]/40" />
            <p className="text-[10px] tracking-[3px] text-[#6b7c9e] font-semibold uppercase">
              {t('brand_sub')}
            </p>
            <div className="h-px w-6 bg-gradient-to-l from-transparent to-[#38e1ff]/40" />
          </div>
          
          <p className="text-xs text-[#8b9bb3]">
            {t('tagline')}
          </p>
        </div>

        {/* Features - Compact Grid */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { icon: Radio, label: t('features_realtime') },
            { icon: Sparkles, label: t('features_ai') },
            { icon: MessageSquare, label: t('features_chat') },
            { icon: Globe, label: t('features_multilang') },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="glass p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              <feature.icon className="w-4 h-4 text-[#38e1ff] mb-1.5 mx-auto" strokeWidth={2} />
              <p className="text-[9px] text-center text-[#8b9bb3] font-medium leading-tight">
                {feature.label}
              </p>
            </div>
          ))}
        </div>

        {/* Loading - Minimal */}
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Loader2 className="w-4 h-4 text-[#38e1ff] animate-spin" strokeWidth={2.5} />
            <p className="text-xs font-medium text-[#dbe9ff]">
              {loading ? t('connecting') : t('welcome')}
            </p>
          </div>

          {/* Progress Bar - Thin */}
          <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#38e1ff] to-[#4a6cf7] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-center text-[10px] text-[#6b7c9e] mt-2 font-mono">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
