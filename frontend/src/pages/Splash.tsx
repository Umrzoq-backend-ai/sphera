import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticate } from '../lib/auth';
import { DEFAULT_CITY, LS_CITY } from '../lib/config';
import { useTranslation } from '../hooks/useTranslation';

export function Splash() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    async function init() {
      try {
        await authenticate();
      } catch (e) {
        console.error('Auth error:', e);
      }
      
      // Set default city
      localStorage.setItem(LS_CITY, DEFAULT_CITY);
      
      // Navigate to radio after auth
      setTimeout(() => {
        navigate('/radio');
      }, 1000);
    }

    init();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#060a14] text-[#dbe9ff] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold tracking-[3px] text-glow">
            IN<span className="text-[#38e1ff]">TR</span>
          </h1>
          <p className="text-xs tracking-[4px] text-[#6b7c9e] mt-2">
            {t('brand_sub')}
          </p>
        </div>
        
        <div className="animate-spin w-10 h-10 border-[3px] border-[rgba(46,168,255,0.2)] border-t-[#38e1ff] rounded-full mx-auto"></div>
      </div>
    </div>
  );
}
