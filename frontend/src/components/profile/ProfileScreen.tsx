import { User as UserIcon, Globe, Zap } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { User } from '../../types';

interface ProfileScreenProps {
  user: User | null;
  onUserUpdate?: (user: User) => void;
}

export function ProfileScreen({ user }: ProfileScreenProps) {
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-[#6b7c9e] text-sm">Loading...</div>
      </div>
    );
  }

  const level = Math.floor((user.points || 0) / 100) + 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <UserIcon className="w-4.5 h-4.5 text-[#38e1ff]" strokeWidth={2} />
        <h2 className="text-base font-bold text-[#dbe9ff]">{t('profile_title')}</h2>
      </div>

      {/* Balance card */}
      <div
        className="glass rounded-2xl p-5 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(46,168,255,0.12), rgba(56,225,255,0.04))',
        }}
      >
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Zap className="w-4 h-4 text-[#38e1ff]" strokeWidth={2} />
          <span className="text-[10px] tracking-wide text-[#6b7c9e] uppercase">{t('points_balance')}</span>
        </div>
        <div className="text-4xl font-black text-[#38e1ff] text-glow">
          {user.points}
        </div>
        <div className="text-[11px] text-[#6b7c9e] tracking-[2px] mt-1 uppercase">
          {t('pf_level')} {level}
        </div>
      </div>

      {/* Info card */}
      <div className="glass rounded-2xl p-4 flex flex-col gap-2.5">
        <ProfileRow label="ID" value={String(user.telegram_id)} />
        <ProfileRow label={t('pf_name')} value={user.full_name || user.username || t('guest')} />
        <ProfileRow label={t('pf_role')} value={t(`role_${user.role}`)} highlight />
        <ProfileRow label={t('pf_lang')} value={t(`lang_${user.language || 'ru'}`)} />
      </div>

      {/* Psychotype */}
      {user.psychotype && (
        <div className="glass rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="text-[11px] font-bold text-[#38e1ff] uppercase tracking-wide mb-1">
            {t('psycho_title')}
          </div>
          <ProfileRow label={t('pf_tone')} value={t(`tone_${user.psychotype.emotional_tone}`)} />
          <ProfileRow label={t('pf_focus')} value={t(`focus_${user.psychotype.focus_of_attention}`)} />
          {user.psychotype.key_topic && (
            <ProfileRow label={t('pf_topic')} value={user.psychotype.key_topic} />
          )}
        </div>
      )}

      {!user.psychotype && (
        <div className="glass rounded-2xl p-4 text-center">
          <div className="text-[11px] font-bold text-[#38e1ff] uppercase tracking-wide mb-2">
            {t('psycho_title')}
          </div>
          <p className="text-xs text-[#6b7c9e]">{t('psycho_empty')}</p>
        </div>
      )}

      {/* Role hint */}
      <div className="glass rounded-2xl p-3.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[rgba(56,225,255,0.08)] flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-[#38e1ff]" strokeWidth={1.8} />
        </div>
        <p className="text-xs text-[#8b9bb3] leading-relaxed">
          {t(`role_hint_${user.role}`)}
        </p>
      </div>

      {/* Admin link */}
      {user.role === 'admin' && (
        <a
          href="/admin"
          className="glass rounded-2xl py-3 text-center text-sm font-bold text-[#38e1ff] hover:border-[rgba(56,225,255,0.3)] transition-all"
        >
          {t('admin_panel')}
        </a>
      )}
    </div>
  );
}

function ProfileRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[#6b7c9e]">{label}</span>
      {highlight ? (
        <span className="px-2.5 py-0.5 rounded-lg bg-[rgba(56,225,255,0.12)] text-[#38e1ff] text-xs font-bold">
          {value}
        </span>
      ) : (
        <span className="font-medium text-[#dbe9ff]">{value}</span>
      )}
    </div>
  );
}
