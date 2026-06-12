import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { AnonsScreen } from '../components/announcements/AnonsScreen';
import { EfirScreen } from '../components/radio/EfirScreen';
import { ProfileScreen } from '../components/profile/ProfileScreen';
import { StatsScreen } from '../components/stats/StatsScreen';
import { FavoritesScreen } from '../components/favorites/FavoritesScreen';
import { OnboardingModal } from '../components/ui/OnboardingModal';
import { getMe } from '../lib/api';
import { authenticate, isAuthenticated } from '../lib/auth';
import { DEFAULT_CITY, LS_CITY } from '../lib/config';
import type { Screen, User } from '../types';

const ONBOARDING_KEY = 'sfera5_onboarded';

// Screen order for navigation
const SCREEN_ORDER: Screen[] = ['anons', 'efir', 'profile'];

export function Radio() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState<Screen>('anons');
  const [nextScreen, setNextScreen] = useState<Screen | null>(null);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function init() {
      if (!isAuthenticated()) {
        try {
          await authenticate();
          if (!localStorage.getItem(LS_CITY)) {
            localStorage.setItem(LS_CITY, DEFAULT_CITY);
          }
        } catch (e) {
          console.error('[Radio] Auth error:', e);
          navigate('/');
          return;
        }
      }

      async function loadUser() {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (e) {
          console.error('[Radio] Failed to load user:', e);
          try {
            await authenticate();
            const userData = await getMe();
            setUser(userData);
          } catch (retryError) {
            console.error('[Radio] Re-auth failed:', retryError);
          }
        }
      }

      await loadUser();

      if (!localStorage.getItem(ONBOARDING_KEY)) {
        setShowOnboarding(true);
      }
    }

    init();
  }, [navigate]);

  const handlePointsUpdate = (newPoints: number) => {
    if (user) {
      setUser({ ...user, points: newPoints });
    }
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  const handleNavigate = (newScreen: Screen) => {
    if (newScreen === currentScreen || isTransitioning) return;

    const currentIndex = SCREEN_ORDER.indexOf(currentScreen);
    const newIndex = SCREEN_ORDER.indexOf(newScreen);
    const dir = newIndex > currentIndex ? 'left' : 'right';

    setDirection(dir);
    setNextScreen(newScreen);
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentScreen(newScreen);
      setNextScreen(null);
      setIsTransitioning(false);
    }, 500);
  };

  const renderScreen = (screen: Screen) => {
    switch (screen) {
      case 'anons':
        return <AnonsScreen user={user} onUserUpdate={setUser} />;
      case 'efir':
        return <EfirScreen user={user} onPointsUpdate={handlePointsUpdate} />;
      case 'stats':
        return <StatsScreen user={user} />;
      case 'favorites':
        return <FavoritesScreen user={user} />;
      case 'profile':
        return <ProfileScreen user={user} onUserUpdate={setUser} />;
      default:
        return <AnonsScreen user={user} onUserUpdate={setUser} />;
    }
  };

  return (
    <div className="min-h-[var(--app-vh)] bg-[#060a14] text-[#dbe9ff] flex flex-col relative overflow-hidden">
      {/* Static background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(56,225,255,0.06)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-[460px] mx-auto w-full px-4 pt-3 pb-[100px] flex flex-col gap-4 flex-1">
        <TopBar points={user?.points || 0} />
        
        {/* Smooth Slide Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Current screen */}
          <div 
            className="absolute inset-0 overflow-y-auto transition-all duration-500 ease-in-out"
            style={{
              transform: isTransitioning 
                ? `translateX(${direction === 'left' ? '-100%' : '100%'})`
                : 'translateX(0)',
              opacity: isTransitioning ? 0 : 1,
            }}
          >
            {renderScreen(currentScreen)}
          </div>
          
          {/* Next screen */}
          {nextScreen && (
            <div 
              className="absolute inset-0 overflow-y-auto transition-all duration-500 ease-in-out"
              style={{
                transform: isTransitioning
                  ? 'translateX(0)'
                  : `translateX(${direction === 'left' ? '100%' : '-100%'})`,
                opacity: isTransitioning ? 1 : 0,
              }}
            >
              {renderScreen(nextScreen)}
            </div>
          )}
        </div>
      </div>

      <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
      <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />
    </div>
  );
}
