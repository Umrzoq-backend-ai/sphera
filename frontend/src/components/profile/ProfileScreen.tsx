import { useTranslation } from '../../hooks/useTranslation';
import { ROLE_NAMES, LANG_NAMES, TONE_NAMES, FOCUS_NAMES } from '../../lib/i18n';
import type { User } from '../../types';

interface ProfileScreenProps {
  user: User | null;
}

export function ProfileScreen({ user }: ProfileScreenProps) {
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-[#6b7c9e]">Загрузка...</div>
      </div>
    );
  }

  const level = Math.floor((user.points || 0) / 100) + 1;

  const roleHints: Record<string, string> = {
    slusatel: '🎧 Вы — Слушатель. Общайтесь в чате и копите баллы.',
    aktivniy: '✅ Вы — Активный! Ваши сообщения попадают в сводку эфира.',
    doverenniy: '🔴 Вы — Доверенный! Доступен прямой выход в эфир.',
    admin: '👑 Вы — Администратор. Полный доступ.',
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-extrabold text-[#38e1ff] text-glow tracking-wide mt-1">
        {t('profile_title')}
      </h2>

      {/* Balance Card */}
      <div className="glass p-5 text-center bg-gradient-to-br from-[rgba(46,168,255,0.18)] to-[rgba(56,225,255,0.06)]">
        <div className="text-xs tracking-wide text-[#6b7c9e] mb-2">
          {t('points_balance')}
        </div>
        <div className="text-[38px] font-extrabold text-[#38e1ff] text-glow">
          {user.points}
        </div>
        <div className="text-[13px] text-[#6b7c9e] tracking-[2px] mt-1">
          {t('points_label')}
        </div>
      </div>

      {/* Profile Info */}
      <div className="glass p-4 flex flex-col gap-2.5">
        <ProfileRow label="ID" value={String(user.telegram_id)} />
        <ProfileRow label={t('pf_role')} value={ROLE_NAMES[user.role] || user.role} />
        <ProfileRow label={t('pf_lang')} value={LANG_NAMES[user.language] || user.language} />
        <ProfileRow label={t('pf_level')} value={String(level)} />
      </div>

      {/* Psychotype */}
      <div className="glass p-4 flex flex-col gap-2.5">
        <div className="text-[13px] font-bold text-[#38e1ff] mb-1">
          {t('psycho_title')}
        </div>
        {user.psychotype ? (
          <>
            <ProfileRow
              label={t('pf_tone')}
              value={TONE_NAMES[user.psychotype.emotional_tone] || '—'}
            />
            <ProfileRow
              label={t('pf_focus')}
              value={FOCUS_NAMES[user.psychotype.focus_of_attention] || '—'}
            />
            <ProfileRow label={t('pf_topic')} value={user.psychotype.key_topic || '—'} />
          </>
        ) : (
          <div className="text-sm text-[#6b7c9e] text-center py-2">
            Отправьте сообщение для определения психотипа
          </div>
        )}
      </div>

      {/* Role Hint */}
      <div className="glass p-3.5 text-[13px] leading-relaxed text-[#dbe9ff]">
        {roleHints[user.role] || ''}
      </div>

      {/* Admin Link */}
      {user.role === 'admin' && (
        <a
          href="/admin"
          className="block text-center py-3.5 rounded-[14px] border border-[#2ea8ff] bg-gradient-to-br from-[rgba(46,168,255,0.2)] to-[rgba(56,225,255,0.08)] text-[#38e1ff] text-sm font-bold tracking-wide"
        >
          🛠 Админ-панель
        </a>
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[#6b7c9e]">{label}</span>
      <span className="font-medium text-[#dbe9ff]">{value}</span>
    </div>
  );
}
