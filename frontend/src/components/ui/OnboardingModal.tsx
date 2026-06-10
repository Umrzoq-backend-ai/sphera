import { Radio, MessageSquare, Mic } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const features = [
    { icon: Radio, text: t('onb_1') },
    { icon: MessageSquare, text: t('onb_2') },
    { icon: Mic, text: t('onb_3') },
  ];

  return (
    <div className="fixed inset-0 bg-[rgba(3,7,16,0.8)] backdrop-blur-sm flex items-center justify-center z-[3000] p-3.5">
      <div className="w-full max-w-[420px] glass p-6">
        <div className="text-center">
          {/* Icon Badge */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-[#38e1ff]/20 to-[#4a6cf7]/20 border border-[#38e1ff]/30 flex items-center justify-center">
            <Mic className="w-8 h-8 text-[#38e1ff]" strokeWidth={2} />
          </div>

          <h2 className="text-xl font-extrabold text-[#38e1ff] mb-5">
            {t('onb_title')}
          </h2>
          
          <div className="flex flex-col gap-3 text-left mb-6">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm leading-relaxed">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-[#38e1ff]" strokeWidth={2} />
                </div>
                <span className="text-[#dbe9ff]">{feature.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-linear-to-br from-[#2ea8ff] to-[#38e1ff] text-[#02101f] text-sm font-bold hover:scale-105 transition-transform duration-200"
            style={{ boxShadow: '0 0 20px rgba(56,225,255,0.3)' }}
          >
            {t('onb_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
