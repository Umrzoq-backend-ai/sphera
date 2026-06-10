import { useState } from 'react';
import { User, Edit2, Save, X, Trash2, Globe, MapPin } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { updateProfile, deleteProfile } from '../../lib/api';
import type { User as UserType } from '../../types';

interface ProfileScreenProps {
  user: UserType | null;
  onUserUpdate: (user: UserType) => void;
}

export function ProfileScreen({ user, onUserUpdate }: ProfileScreenProps) {
  const { t } = useTranslation('radio');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    full_name: user?.full_name || '',
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-[#6b7c9e]">Loading...</div>
      </div>
    );
  }

  const level = Math.floor((user.points || 0) / 100) + 1;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        username: editForm.username || undefined,
        full_name: editForm.full_name || undefined,
      });
      
      onUserUpdate({
        ...user,
        username: editForm.username || user.username,
        full_name: editForm.full_name || user.full_name,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(t('send_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('profile_delete_confirm'))) return;
    
    try {
      await deleteProfile();
      alert(t('profile_deleted'));
      // Redirect to home or refresh
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert(t('send_error'));
    }
  };

  const roleName = t(`role_${user.role}`);
  const roleHint = t(`role_hint_${user.role}`);
  const langName = t(`lang_${user.language || 'ru'}`);

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-[#38e1ff]" strokeWidth={2} />
          <h2 className="text-base font-bold text-[#dbe9ff]">
            {t('profile_title')}
          </h2>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-[#38e1ff]" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Balance Card - Compact */}
      <div className="glass p-4 text-center">
        <div className="text-[10px] tracking-wide text-[#6b7c9e] mb-1 uppercase">
          {t('points_balance')}
        </div>
        <div className="text-3xl font-black text-[#38e1ff]">
          {user.points}
        </div>
        <div className="text-[10px] text-[#6b7c9e] tracking-[2px] mt-0.5 uppercase">
          {t('pf_level')} {level}
        </div>
      </div>

      {/* Profile Info - Editable */}
      <div className="glass p-3">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-[#6b7c9e] uppercase tracking-wide mb-1 block">
                Username
              </label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-[#dbe9ff] focus:outline-none focus:border-[#38e1ff]/50"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6b7c9e] uppercase tracking-wide mb-1 block">
                {t('pf_name')}
              </label>
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-[#dbe9ff] focus:outline-none focus:border-[#38e1ff]/50"
                placeholder="Full Name"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-linear-to-br from-[#38e1ff] to-[#4a6cf7] text-[#02101f] text-sm font-bold disabled:opacity-50"
              >
                <Save className="w-4 h-4" strokeWidth={2} />
                {isSaving ? t('toast_processing') : t('profile_save')}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    username: user?.username || '',
                    full_name: user?.full_name || '',
                  });
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-[#6b7c9e]" strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <ProfileRow icon={User} label="Username" value={user.username || t('guest')} />
            <ProfileRow icon={User} label={t('pf_name')} value={user.full_name || '—'} />
            <ProfileRow icon={Globe} label={t('pf_lang')} value={langName} />
            <ProfileRow label={t('pf_role')} value={roleName} badge />
            {user.city && (
              <ProfileRow icon={MapPin} label={t('pf_city')} value={user.city} />
            )}
          </div>
        )}
      </div>

      {/* Psychotype - Minimal */}
      {user.psychotype && (
        <div className="glass p-3">
          <div className="text-[11px] font-bold text-[#38e1ff] mb-2 uppercase tracking-wide">
            {t('psycho_title')}
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6b7c9e]">{t('pf_tone')}</span>
              <span className="text-[#dbe9ff]">{t(`tone_${user.psychotype.emotional_tone}`)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7c9e]">{t('pf_focus')}</span>
              <span className="text-[#dbe9ff]">{t(`focus_${user.psychotype.focus_of_attention}`)}</span>
            </div>
            {user.psychotype.key_topic && (
              <div className="flex justify-between">
                <span className="text-[#6b7c9e]">{t('pf_topic')}</span>
                <span className="text-[#dbe9ff]">{user.psychotype.key_topic}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Hint - Compact */}
      <div className="glass p-3 text-xs leading-relaxed text-[#8b9bb3]">
        {roleHint}
      </div>

      {/* Admin Link */}
      {user.role === 'admin' && (
        <a
          href="/admin"
          className="block text-center py-2.5 rounded-lg border border-[#38e1ff]/30 bg-[#38e1ff]/10 text-[#38e1ff] text-sm font-bold hover:bg-[#38e1ff]/20 transition-colors"
        >
          {t('admin_panel')}
        </a>
      )}

      {/* Danger Zone */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2} />
          {t('profile_delete')}
        </button>
      </div>
    </div>
  );
}

interface ProfileRowProps {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  badge?: boolean;
}

function ProfileRow({ icon: Icon, label, value, badge }: ProfileRowProps) {
  return (
    <div className="flex justify-between items-center text-sm">
      <div className="flex items-center gap-2 text-[#6b7c9e]">
        {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2} />}
        <span>{label}</span>
      </div>
      {badge ? (
        <span className="px-2 py-0.5 rounded-md bg-[#38e1ff]/20 text-[#38e1ff] text-xs font-bold">
          {value}
        </span>
      ) : (
        <span className="font-medium text-[#dbe9ff]">{value}</span>
      )}
    </div>
  );
}
