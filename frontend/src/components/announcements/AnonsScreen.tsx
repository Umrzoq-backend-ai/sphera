import { useEffect, useState } from 'react';
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

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error('Failed to load announcements:', e);
    }
  }

  const handleLangChange = async (newLang: Language) => {
    setLang(newLang);
    
    try {
      // Update interface language
      await updateLanguage(newLang);
      // Update broadcast language
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
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-extrabold text-[#38e1ff] text-glow tracking-wide mt-1">
        {t('anons_title')}
      </h2>
      <p className="text-xs text-[#6b7c9e] -mt-2.5">
        {t('anons_sub')}
      </p>

      <LanguageSelector selectedLang={lang} onLangChange={handleLangChange} />

      {announcements.banner1 && (
        <AnnouncementBanner announcement={announcements.banner1} />
      )}
      
      {announcements.banner2 && (
        <AnnouncementBanner announcement={announcements.banner2} />
      )}
    </div>
  );
}
