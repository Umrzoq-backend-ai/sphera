import { useTranslation } from '../../hooks/useTranslation';
import type { Screen } from '../../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const { t } = useTranslation();

  const navItems: { id: Screen; icon: string; label: string; isCenter?: boolean }[] = [
    { id: 'anons', icon: '📢', label: t('nav_anons') },
    { id: 'efir', icon: '◉', label: t('nav_efir'), isCenter: true },
    { id: 'profile', icon: '👤', label: t('nav_profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] flex justify-around items-center px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] z-[500]"
         style={{
           background: 'linear-gradient(180deg, transparent, rgba(6, 10, 20, 0.95) 40%)'
         }}>
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        
        if (item.isCenter) {
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[22px] text-[#02101f] -mt-[22px]"
              style={{
                background: 'radial-gradient(circle at 40% 35%, var(--accent2), var(--accent))',
                boxShadow: '0 0 22px var(--glow)'
              }}
              title={item.label}
            >
              {item.icon}
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 text-lg transition-all ${
              isActive ? 'text-[#38e1ff] opacity-100' : 'text-[#6b7c9e] opacity-70'
            }`}
          >
            {item.icon}
            <span className="text-[9px] tracking-[0.5px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
