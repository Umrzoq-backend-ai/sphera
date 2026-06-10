import type { Announcement } from '../../types';

interface AnnouncementBannerProps {
  announcement: Announcement;
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  return (
    <div className="glass flex gap-3.5 p-3.5 items-center">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-[28px] ${
          announcement.image_url ? 'bg-cover bg-center' : 'bg-[rgba(46,168,255,0.12)]'
        }`}
        style={
          announcement.image_url
            ? { backgroundImage: `url('${announcement.image_url}')` }
            : {}
        }
      >
        {!announcement.image_url && announcement.emoji}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-[#dbe9ff] mb-1">
          {announcement.title}
        </div>
        <div className="text-xs text-[#6b7c9e] leading-relaxed">
          {announcement.text}
        </div>
      </div>
    </div>
  );
}
