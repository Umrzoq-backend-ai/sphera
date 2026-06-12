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
        <div className="text-[22px] font-black tracking-[3px]">
          <span className="text-[#eaf4ff]">IN</span>
          <span className="text-[#38e1ff]">TR</span>
        </div>
      </div>

      {/* Points badge */}
      <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-[#38e1ff]" strokeWidth={2.5} />
        <div className="text-sm font-bold text-[#38e1ff] tabular-nums">
          {points}
        </div>
      </div>
    </header>
  );
}
