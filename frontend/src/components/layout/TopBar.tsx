import { Zap } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface TopBarProps {
  points: number;
}

export function TopBar({ points }: TopBarProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between py-2">
      {/* Logo */}
      <div className="leading-none">
        <div className="text-[24px] font-black tracking-[3px] text-[#eaf4ff] text-glow">
          IN<span className="text-[#38e1ff]">TR</span>
        </div>
        <div className="text-[8px] tracking-[3px] text-[#6b7c9e] mt-0.5 uppercase">
          {t('brand_sub')}
        </div>
      </div>

      {/* Points badge */}
      <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-[#38e1ff]" strokeWidth={2.5} />
        <div className="text-center">
          <div className="text-base font-bold text-[#38e1ff] text-glow leading-none">
            {points}
          </div>
          <div className="text-[7px] tracking-[1.5px] text-[#6b7c9e] uppercase mt-0.5">
            {t('points_label')}
          </div>
        </div>
      </div>
    </header>
  );
}
