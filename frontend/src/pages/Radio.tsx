import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { AnonsScreen } from '../components/announcements/AnonsScreen';
import { EfirScreen } from '../components/radio/EfirScreen';
import { ProfileScreen } from '../components/profile/ProfileScreen';
import { OnboardingModal } from '../components/ui/OnboardingModal';
import { getMe } from '../lib/api';
import { authenticate, isAuthenticated } from '../lib/auth';
import { DEFAULT_CITY, LS_CITY } from '../lib/config';
import type { Screen, User } from '../types';

const ONBOARDING_KEY = 'sfera5_onboarded';

export function Radio() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState<Screen>('anons');
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    // Check if authenticated, if not - authenticate first
    if (!isAuthenticated()) {
      console.log('[Radio] Not authenticated, authenticating...');
      try {
        await authenticate();
        // Set default city
        if (!localStorage.getItem(LS_CITY)) {
          localStorage.setItem(LS_CITY, DEFAULT_CITY);
        }
      } catch (e) {
        console.error('[Radio] Auth error:', e);
        // If auth fails, redirect to splash
        navigate('/');
        return;
      }
    }

    // Load user data
    await loadUser();
    
    // Check if onboarding was shown
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }

  async function loadUser() {
    try {
      const userData = await getMe();
      setUser(userData);
      console.log('[Radio] User loaded:', userData);
    } catch (e) {
      console.error('[Radio] Failed to load user:', e);
      // If loading user fails, try to re-authenticate
      try {
        await authenticate();
        const userData = await getMe();
        setUser(userData);
      } catch (retryError) {
        console.error('[Radio] Re-auth failed:', retryError);
      }
    }
  }

  const handlePointsUpdate = (newPoints: number) => {
    if (user) {
      setUser({ ...user, points: newPoints });
    }
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-[var(--app-vh)] bg-[#060a14] text-[#dbe9ff]">
      <div className="max-w-[460px] mx-auto px-3.5 pt-3.5 pb-[calc(86px+env(safe-area-inset-bottom))] flex flex-col gap-4">
        <TopBar points={user?.points || 0} />

        {/* Screens */}
        <div className="flex-1">
          {currentScreen === 'anons' && <AnonsScreen user={user} onUserUpdate={setUser} />}
          {currentScreen === 'efir' && (
            <EfirScreen
              user={user}
              onPointsUpdate={handlePointsUpdate}
            />
          )}
          {currentScreen === 'profile' && <ProfileScreen user={user} />}
        </div>
      </div>

      <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />
    </div>
  );
}
