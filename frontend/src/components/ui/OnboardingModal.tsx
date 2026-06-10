import { useTranslation } from '../../hooks/useTranslation';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(3,7,16,0.8)] backdrop-blur-sm flex items-center justify-center z-[3000] p-3.5">
      <div className="w-full max-w-[420px] bg-[var(--card-solid)] border border-[var(--glass-border)] rounded-3xl p-7 px-5.5">
        <div className="text-center">
          <div className="text-[46px] mb-2">🎙</div>
          <h2 className="text-xl font-extrabold text-[#38e1ff] mb-4.5">
            {t('onb_title')}
          </h2>
          
          <div className="flex flex-col gap-3.5 text-left mb-5.5">
            <div className="flex items-center gap-3 text-sm leading-relaxed">
              <span className="text-[22px] flex-shrink-0">▶️</span>
              <span>{t('onb_1')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm leading-relaxed">
              <span className="text-[22px] flex-shrink-0">💬</span>
              <span>{t('onb_2')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm leading-relaxed">
              <span className="text-[22px] flex-shrink-0">🎙</span>
              <span>{t('onb_3')}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-[14px] bg-gradient-to-br from-[#2ea8ff] to-[#38e1ff] text-[#02101f] text-[15px] font-bold"
            style={{ boxShadow: '0 0 24px var(--glow)' }}
          >
            {t('onb_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
