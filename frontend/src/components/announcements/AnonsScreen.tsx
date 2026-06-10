import { useEffect, useState, useCallback } from 'react';
import { Radio, Megaphone, Sparkles, Globe } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { AnnouncementBanner } from './AnnouncementBanner';
import { getAnnouncements, updateLanguage, updateBroadcastLang } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import type { User, Announcements, Language } from '../../types';

interface AnonsScreenProps {
  user: User | null;
  onUserUpdate: (user: User) => void;
}

export function AnonsScreen({ user, onUserUpdate }: AnonsScreenProps) {
  const { t, lang, setLang } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcements>({
    banner1: null,
    banner2: null,
  });

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error('Failed to load announcements:', e);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleLangChange = async (newLang: Language) => {
    setLang(newLang);
    
    try {
      await updateLanguage(newLang);
      await updateBroadcastLang(newLang);
      
      if (user) {
        onUserUpdate({
          ...user,
          language: newLang,
          broadcast_lang: newLang,
        });
      }
    } catch (e) {
      console.error('Failed to update language:', e);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#38e1ff]" strokeWidth={2} />
          <h2 className="text-base font-bold text-[#dbe9ff]">
            {t('anons_title')}
          </h2>
        </div>
      </div>

      {/* Welcome Info - Minimal */}
      <div className="glass p-3">
        <div className="flex items-start gap-2.5">
          <Radio className="w-4 h-4 text-[#38e1ff] mt-0.5 shrink-0" strokeWidth={2} />
          <div className="text-xs text-[#8b9bb3] leading-relaxed">
            {t('welcome_desc')}
          </div>
        </div>
      </div>

      {/* How it Works - Minimal */}
      <div className="glass p-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#4a6cf7] mt-0.5 shrink-0" strokeWidth={2} />
          <div className="text-xs text-[#8b9bb3] leading-relaxed">
            {t('how_it_works_desc')}
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <LanguageSelector selectedLang={lang} onLangChange={handleLangChange} />

      {/* Announcements */}
      {(announcements.banner1 || announcements.banner2) && (
        <div className="space-y-3 mt-1">
          {announcements.banner1 && (
            <AnnouncementBanner announcement={announcements.banner1} />
          )}
          
          {announcements.banner2 && (
            <AnnouncementBanner announcement={announcements.banner2} />
          )}
        </div>
      )}
    </div>
  );
}
