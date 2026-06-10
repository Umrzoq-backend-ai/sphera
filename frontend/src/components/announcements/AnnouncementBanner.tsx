import { FileText } from 'lucide-react';
import type { Announcement } from '../../types';

interface AnnouncementBannerProps {
  announcement: Announcement;
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const hasImage = announcement.image_url;
  const hasEmoji = announcement.emoji && !hasImage;

  return (
    <div className="glass p-3 hover:bg-white/10 transition-all duration-200">
      <div className="flex gap-3 items-start">
        {/* Compact Icon/Image */}
        <div className="shrink-0">
          {hasImage ? (
            <div
              className="w-12 h-12 rounded-lg bg-cover bg-center border border-white/10"
              style={{ backgroundImage: `url('${announcement.image_url}')` }}
            />
          ) : hasEmoji ? (
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-[#38e1ff]/10 to-[#4a6cf7]/10 border border-[#38e1ff]/20 flex items-center justify-center text-xl">
              {announcement.emoji}
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-[#38e1ff]/10 to-[#4a6cf7]/10 border border-[#38e1ff]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#38e1ff]" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Compact Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#dbe9ff] mb-1 leading-tight">
            {announcement.title}
          </h3>
          <p className="text-xs text-[#8b9bb3] leading-relaxed">
            {announcement.text}
          </p>
        </div>
      </div>
    </div>
  );
}
