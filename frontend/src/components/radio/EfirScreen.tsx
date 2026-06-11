import { useState, useEffect, useCallback } from 'react';
import { Signal } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { ChatInput } from './ChatInput';
import { GoLiveButton } from './GoLiveButton';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../ui/Toast';
import { getRadioStatus, getChatHistory } from '../../lib/api';
import { DEFAULT_CITY, LS_CITY } from '../../lib/config';
import { useTranslation } from '../../hooks/useTranslation';
import type { User, RadioStatus, ChatMessage } from '../../types';

interface EfirScreenProps {
  user: User | null;
  onPointsUpdate: (points: number) => void;
}

export function EfirScreen({ user, onPointsUpdate }: EfirScreenProps) {
  const { t, lang } = useTranslation();
  const { message, showToast } = useToast();
  const [city] = useState(localStorage.getItem(LS_CITY) || DEFAULT_CITY);
  const [radioStatus, setRadioStatus] = useState<RadioStatus | null>(null);
  const [, setMessages] = useState<ChatMessage[]>([]);

  const audioPlayer = useAudioPlayer({
    city,
    language: lang,
    useIcecast: radioStatus?.use_icecast || false,
  });

  const { send: wsSend } = useWebSocket({
    city,
    onMessage: handleWSMessage,
  });

  useEffect(() => {
    loadRadioStatus();
    loadChatHistory();
  }, [city]);

  async function loadRadioStatus() {
    try {
      const status = await getRadioStatus(city);
      setRadioStatus(status);
    } catch (e) {
      console.error('Failed to load radio status:', e);
    }
  }

  async function loadChatHistory() {
    try {
      const history = await getChatHistory(city);
      setMessages(history);
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  }

  function handleWSMessage(wsMessage: any) {
    switch (wsMessage.type) {
      case 'chat':
        setMessages((prev) => [...prev, wsMessage.data]);
        break;
      case 'radio_status':
      case 'presence':
        setRadioStatus(wsMessage.data.radio || wsMessage.data);
        break;
      case 'new_segment':
        if (wsMessage.data.url) {
          audioPlayer.addSegment(wsMessage.data);
        }
        if (wsMessage.data.is_live !== undefined) {
          setRadioStatus((prev) => prev ? { ...prev, ...wsMessage.data } : null);
        }
        break;
      case 'studio_ack':
        onPointsUpdate(wsMessage.data.points);
        showToast(t('toast_sent_studio'));
        break;
      case 'limit_exceeded':
        onPointsUpdate(wsMessage.data.points);
        showToast(t('toast_limit'));
        break;
      case 'studio_denied':
        showToast(t('studio_denied_role'));
        break;
      case 'balance':
        onPointsUpdate(wsMessage.data.points);
        break;
    }
  }

  const handleSendMessage = useCallback((msg: string, destination: 'chat' | 'studio') => {
    wsSend({ type: destination, message: msg, lang });
  }, [wsSend, lang]);

  const level = Math.floor((user?.points || 0) / 100) + 1;
  const broadcasterName = radioStatus?.is_live
    ? radioStatus.broadcaster_type === 'doverenniy'
      ? radioStatus.broadcaster_name || '🔴 LIVE'
      : t('ai_host')
    : t('activation');

  const isDoverenniy = user?.role === 'doverenniy' || user?.role === 'admin';

  return (
    <div className="flex flex-col gap-4">
      {/* Status badge */}
      <div className="flex items-center justify-center gap-2">
        <Signal className="w-3.5 h-3.5 text-[#38e1ff]" strokeWidth={2} />
        <span className="text-[10px] tracking-[3px] text-[#6b7c9e] uppercase font-medium">
          {t('stream_realtime')}
        </span>
      </div>

      {/* Level indicator */}
      <div className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#38e1ff] animate-pulse" style={{ boxShadow: '0 0 8px rgba(56,225,255,0.6)' }} />
          <span className="text-xs font-bold text-[#dbe9ff]">{t('level')} {level}</span>
        </div>
        <span className="text-[10px] text-[#6b7c9e]">
          {radioStatus?.listeners_count ? `🎧 ${radioStatus.listeners_count}` : ''}
        </span>
      </div>

      {/* Audio Player with Orb */}
      <AudioPlayer
        isPlaying={audioPlayer.isPlaying}
        volume={audioPlayer.volume}
        broadcasterName={broadcasterName}
        userId={user?.telegram_id || 0}
        listenersCount={radioStatus?.listeners_count}
        onTogglePlay={audioPlayer.togglePlay}
        onVolumeChange={audioPlayer.setVolume}
      />

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onToast={showToast}
        city={city}
        language={lang}
        onPointsUpdate={onPointsUpdate}
      />

      {/* Go Live */}
      {isDoverenniy && (
        <GoLiveButton city={city} onToast={showToast} />
      )}

      <Toast message={message} />
    </div>
  );
}
