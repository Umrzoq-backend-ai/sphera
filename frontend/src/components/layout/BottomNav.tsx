import { Megaphone, Radio, User } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { Screen } from '../../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const { t } = useTranslation();

  const navItems: { id: Screen; icon: typeof Radio; label: string; isCenter?: boolean }[] = [
    { id: 'anons', icon: Megaphone, label: t('nav_anons') },
    { id: 'efir', icon: Radio, label: t('nav_efir'), isCenter: true },
    { id: 'profile', icon: User, label: t('nav_profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div
        className="pointer-events-auto max-w-[460px] mx-auto px-4 pb-[calc(8px+env(safe-area-inset-bottom))] pt-4"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(6,10,20,0.85) 30%, rgba(6,10,20,0.98) 100%)',
        }}
      >
        {/* Glass bar */}
        <div
          className="glass rounded-2xl px-2 py-2 flex justify-around items-center"
          style={{
            boxShadow: '0 -4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="relative -mt-7 flex flex-col items-center"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'scale-105' : ''
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #2ea8ff, #38e1ff)',
                      boxShadow: isActive
                        ? '0 0 30px rgba(56,225,255,0.5), 0 0 60px rgba(46,168,255,0.2)'
                        : '0 0 20px rgba(56,225,255,0.3)',
                    }}
                  >
                    <Icon className="w-6 h-6 text-[#060a14]" strokeWidth={2.5} />
                  </div>
                  <span className="text-[8px] mt-1 text-[#38e1ff] font-bold tracking-wide">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all duration-200"
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-[#38e1ff]' : 'text-[#6b7c9e]'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(56,225,255,0.5))' } : {}}
                />
                <span
                  className={`text-[9px] font-medium tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-[#38e1ff]' : 'text-[#6b7c9e]'
                  }`}
                >
                  {item.label}
                </span>
                {/* Active dot */}
                {isActive && (
                  <div
                    className="w-1 h-1 rounded-full bg-[#38e1ff]"
                    style={{ boxShadow: '0 0 6px rgba(56,225,255,0.8)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
