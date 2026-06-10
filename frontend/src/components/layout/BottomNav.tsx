import { Shield, Activity, Radio, Star, User } from 'lucide-react';
import { AIOrb } from '../ui/AIOrb';
import type { Screen } from '../../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'anons' as Screen, icon: Shield, label: 'Анонсы' },
    { id: 'stats' as Screen, icon: Activity, label: 'Статистика' },
    { id: 'efir' as Screen, icon: Radio, label: 'Эфир', isCenter: true },
    { id: 'favorites' as Screen, icon: Star, label: 'Избранное' },
    { id: 'profile' as Screen, icon: User, label: 'Профиль' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(6, 10, 20, 0.4) 20%, rgba(6, 10, 20, 0.98) 50%)',
      }}
    >
      <div className="max-w-[520px] mx-auto px-4 py-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
        {/* Liquid Glass Container */}
        <div className="relative group">
          {/* Animated gradient background */}
          <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[rgba(0,217,255,0.08)] via-[rgba(10,136,255,0.05)] to-[rgba(0,217,255,0.08)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          
          {/* Main liquid glass bar */}
          <div 
            className="relative rounded-[28px] p-1.5 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 30, 60, 0.7) 0%, rgba(10, 20, 40, 0.85) 50%, rgba(15, 30, 60, 0.7) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.05),
                inset 0 -1px 0 rgba(0, 217, 255, 0.05)
              `,
            }}
          >
            {/* Liquid shine effect */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, transparent 100%)',
                animation: 'liquid-shine 8s ease-in-out infinite',
              }}
            />
            
            {/* Top highlight */}
            <div 
              className="absolute top-0 left-[10%] right-[10%] h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              }}
            />

            <div className="relative flex justify-around items-center px-1">
              {navItems.map((item) => {
                const isActive = currentScreen === item.id;
                const Icon = item.icon;

                if (item.isCenter) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className="relative -mt-8 flex flex-col items-center group/center"
                    >
                      {/* AI Orb - Siri Style */}
                      <div className="group-hover/center:scale-105 active:scale-95 transition-transform duration-300">
                        <AIOrb isActive={isActive} size={64} />
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'bg-[rgba(0,217,255,0.08)]'
                        : 'hover:bg-[rgba(0,217,255,0.04)]'
                    }`}
                    style={isActive ? {
                      boxShadow: 'inset 0 0 20px rgba(0,217,255,0.15), 0 0 10px rgba(0,217,255,0.1)',
                    } : {}}
                  >
                    {/* Active liquid glow */}
                    {isActive && (
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-50"
                        style={{
                          background: 'radial-gradient(ellipse at center, rgba(0,217,255,0.15) 0%, transparent 70%)',
                        }}
                      />
                    )}
                    
                    {/* Icon */}
                    <Icon 
                      className={`w-6 h-6 transition-all duration-300 ${
                        isActive ? 'text-[#00d9ff]' : 'text-[#6b7c9e]'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                      style={isActive ? {
                        filter: 'drop-shadow(0 0 8px rgba(0,217,255,0.6))',
                      } : {}}
                    />
                    
                    {/* Active indicator - small dot at bottom */}
                    {isActive && (
                      <div 
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(0,217,255,1) 0%, rgba(0,217,255,0.5) 100%)',
                          boxShadow: '0 0 6px rgba(0,217,255,0.8)',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes liquid-shine {
          0%, 100% { transform: translateX(-100%) skewX(-15deg); }
          50% { transform: translateX(200%) skewX(-15deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        @keyframes liquid-drop {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, 2px) scale(0.9, 1.1); }
        }
      `}</style>
    </nav>
  );
}
