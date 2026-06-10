import { useState, useEffect, useCallback } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { Chat } from './Chat';
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const audioPlayer = useAudioPlayer({
    city,
    language: lang,
    useIcecast: radioStatus?.use_icecast || false,
  });

  // WebSocket connection
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
      case 'role_up':
        if (user && wsMessage.data.telegram_id === user.telegram_id) {
          showToast(`${t('role_up_prefix')} ${t(`role_${wsMessage.data.role}`)}`);
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

  const handleSendMessage = useCallback((message: string, destination: 'chat' | 'studio') => {
    wsSend({ type: destination, message, lang });
  }, [wsSend, lang]);

  const level = Math.floor((user?.points || 0) / 100) + 1;
  const broadcasterName = radioStatus?.is_live
    ? radioStatus.broadcaster_type === 'doverenniy'
      ? `🔴 ${radioStatus.broadcaster_name || 'В ЭФИРЕ'}`
      : t('ai_host')
    : t('activation');

  const isDoverenniy = user?.role === 'doverenniy' || user?.role === 'admin';

  return (
    <div className="flex flex-col gap-2 h-[calc(var(--app-vh)-150px)] min-h-[360px]">
      <div className="text-center mt-0.5 flex-shrink-0">
        <div className="text-[15px] font-extrabold tracking-wide">
          <span>{t('level')}</span> <span>{level}</span>
        </div>
        <div className="text-[10px] tracking-[3px] text-[#6b7c9e] mt-0.5">
          {t('stream_realtime')}
        </div>
      </div>

      <AudioPlayer
        isPlaying={audioPlayer.isPlaying}
        volume={audioPlayer.volume}
        broadcasterName={broadcasterName}
        userId={user?.telegram_id || 0}
        listenersCount={radioStatus?.listeners_count}
        onTogglePlay={audioPlayer.togglePlay}
        onVolumeChange={audioPlayer.setVolume}
      />

      <Chat
        messages={messages}
        currentUser={user}
        onSendMessage={handleSendMessage}
        onToast={showToast}
        city={city}
        language={lang}
        onPointsUpdate={onPointsUpdate}
      />

      {isDoverenniy && (
        <GoLiveButton city={city} onToast={showToast} />
      )}

      <Toast message={message} />
    </div>
  );
}
