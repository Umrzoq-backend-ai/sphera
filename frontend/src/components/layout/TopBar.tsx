import { useTranslation } from '../../hooks/useTranslation';

interface TopBarProps {
  points: number;
}

export function TopBar({ points }: TopBarProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between pt-2 pb-0 px-1.5">
      <div className="leading-none">
        <div className="text-[22px] font-extrabold tracking-[3px] text-[#eaf4ff] text-glow">
          IN<span className="text-[#38e1ff]">TR</span>
        </div>
        <div className="text-[9px] tracking-[4px] text-[#6b7c9e] mt-0.5">
          {t('brand_sub')}
        </div>
      </div>
      
      <div className="min-w-[64px] px-3 py-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--card)] text-center">
        <div className="text-base font-bold text-[#38e1ff] text-glow">
          {points}
        </div>
        <div className="text-[8px] tracking-[2px] text-[#6b7c9e]">
          {t('points_label')}
        </div>
      </div>
    </header>
  );
}
