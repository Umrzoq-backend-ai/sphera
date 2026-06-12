import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Mic, Send, X, Loader } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { ChatMessages } from './ChatMessages';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../ui/Toast';
import { getRadioStatus, getChatHistory, sendVoiceMessage } from '../../lib/api';
import { DEFAULT_CITY, LS_CITY } from '../../lib/config';
import { useTranslation } from '../../hooks/useTranslation';
import type { User, RadioStatus, ChatMessage } from '../../types';

interface EfirScreenProps {
  user: User | null;
  onPointsUpdate: (points: number) => void;
}

function ChatInputBox({ onSend }: { onSend: (message: string) => void }) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    
    setIsSending(true);
    try {
      onSend(inputValue.trim());
      setInputValue('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-[rgba(56,225,255,0.1)] bg-[#060a14]">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          disabled={isSending}
          className="flex-1 px-4 py-3 rounded-xl glass bg-[rgba(10,20,40,0.5)] text-[#dbe9ff] placeholder:text-[#6b7c9e] text-sm focus:outline-none focus:border-[rgba(56,225,255,0.5)] disabled:opacity-50 transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending}
          className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:border-[rgba(56,225,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-[#38e1ff]/30 border-t-[#38e1ff] rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-[#38e1ff]" strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  );
}

export function EfirScreen({ user, onPointsUpdate }: EfirScreenProps) {
  const { t, lang } = useTranslation();
  const { message, showToast } = useToast();
  const [city] = useState(localStorage.getItem(LS_CITY) || DEFAULT_CITY);
  const [radioStatus, setRadioStatus] = useState<RadioStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);

  const audioPlayer = useAudioPlayer({
    city,
    language: lang,
    useIcecast: radioStatus?.use_icecast || false,
  });

  const { send: wsSend } = useWebSocket({
    city,
    onMessage: handleWSMessage,
  });

  // Stream timer
  useEffect(() => {
    if (radioStatus?.is_live && audioPlayer.isPlaying) {
      const interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setStreamDuration(0);
    }
  }, [radioStatus?.is_live, audioPlayer.isPlaying]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        await Promise.all([
          loadRadioStatus(),
          loadChatHistory(),
        ]);
      } catch (e) {
        console.error('Failed to load data:', e);
        showToast('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
    
    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [city, showToast]);

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

  function handleWSMessage(wsMessage: { type: string; data?: any }) {
    if (!wsMessage.data) return;
    
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const handleVoiceMessage = async () => {
    // Yozilayotgan bo'lsa — to'xtatamiz
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 800) { showToast(t('toast_short')); return; }
        try {
          const res = await sendVoiceMessage(city, blob, 'chat', lang);
          if (res?.points !== undefined) onPointsUpdate(Number(res.points));
          showToast(t('toast_sent_chat'));
        } catch (err: any) {
          if (err.status === 402) showToast(t('toast_limit'));
          else showToast('⚠️');
        }
      };
      rec.start();
      setIsRecording(true);
      showToast(t('toast_recording'));
    } catch {
      showToast(t('toast_mic_denied'));
    }
  };

  const handleSendToStudio = () => {
    const msg = prompt('Введите сообщение для эфира:');
    if (msg && msg.trim()) {
      handleSendMessage(msg.trim(), 'studio');
    }
  };

  const level = user?.level || 1;
  const broadcasterName = radioStatus?.is_live
    ? radioStatus.broadcaster_type === 'doverenniy'
      ? radioStatus.broadcaster_name || '🔴 LIVE'
      : t('ai_host')
    : t('activation');

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader className="w-16 h-16 text-[#38e1ff] animate-spin" />
        <p className="text-sm text-[#6b7c9e]">Загрузка эфира...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Top section - Level indicator */}
      <div className="text-center mb-6">
        <div className="text-sm font-medium text-[#6b7c9e] mb-1">
          УРОВЕНЬ {level}
        </div>
        <div className="text-[11px] tracking-[2px] text-[#38e1ff] uppercase">
          ПОТОК <span className="text-[#00d9ff]">REAL TIME</span>
        </div>
      </div>

      {/* Center - Large Audio Orb */}
      <div className="flex-1 flex items-center justify-center">
        <AudioPlayer
          isPlaying={audioPlayer.isPlaying}
          volume={audioPlayer.volume}
          broadcasterName={broadcasterName}
          userId={user?.telegram_id || 0}
          listenersCount={radioStatus?.listeners_count}
          onTogglePlay={audioPlayer.togglePlay}
          onVolumeChange={audioPlayer.setVolume}
        />
      </div>

      {/* Bottom section - Status info */}
      <div className="mt-6 space-y-3">
        {/* ID and Status */}
        <div className="text-center">
          <div className="text-[11px] text-[#6b7c9e] mb-1">
            ID: {user?.telegram_id || '-----'}
          </div>
          <div className="text-base font-bold text-[#dbe9ff] mb-1">
            {radioStatus?.is_live ? 'АКТИВАЦИЯ ВРЕОСМИСЛА' : 'ОЖИДАНИЕ ПОТОКА'}
          </div>
          <div className="text-sm text-[#6b7c9e]">
            {broadcasterName}
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="text-2xl font-bold text-[#00d9ff] tabular-nums">
            {formatTime(streamDuration)}
          </div>
          <div className="text-[10px] text-[#6b7c9e] tracking-[2px] uppercase">
            {audioPlayer.isPlaying ? 'ПОТОК АКТИВЕН' : 'ПАУЗА'}
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center justify-around px-4 py-4">
          {/* Chat button */}
          <button 
            onClick={() => setShowChatModal(true)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center group-hover:border-[rgba(56,225,255,0.5)] transition-all relative">
              <MessageSquare className="w-6 h-6 text-[#6b7c9e] group-hover:text-[#38e1ff] transition-colors" strokeWidth={2} />
              {messages.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#38e1ff] flex items-center justify-center text-[10px] font-bold text-[#060a14]">
                  {messages.length > 9 ? '9+' : messages.length}
                </div>
              )}
            </div>
            <span className="text-[9px] text-[#6b7c9e] uppercase tracking-wide text-center leading-tight">
              ЧАЙ<br/>СВЕРХЗАДАЧНОСТЬ
            </span>
          </button>

          {/* Mic button - center, larger */}
          <button 
            onClick={handleVoiceMessage}
            className="flex flex-col items-center gap-2 -mt-4 group"
          >
            <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center group-hover:border-[rgba(56,225,255,0.8)] transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-[rgba(56,225,255,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Mic className="w-8 h-8 text-[#38e1ff] relative z-10" strokeWidth={2} />
            </div>
            <span className="text-[9px] text-[#38e1ff] uppercase tracking-wide font-medium text-center leading-tight">
              ГОЛОСОВОЕ<br/>СООБЩЕНИЕ
            </span>
          </button>

          {/* Send button */}
          <button 
            onClick={handleSendToStudio}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center group-hover:border-[rgba(56,225,255,0.5)] transition-all">
              <Send className="w-6 h-6 text-[#6b7c9e] group-hover:text-[#38e1ff] transition-colors" strokeWidth={2} />
            </div>
            <span className="text-[9px] text-[#6b7c9e] uppercase tracking-wide text-center">
              ОТПРАВИТЬ
            </span>
          </button>
        </div>
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 glass rounded-xl p-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]">
          <div className="flex items-center justify-center gap-2 text-xs text-[#ef4444]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
            <span className="font-medium">Нет соединения</span>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowChatModal(false);
          }}
        >
          <div className="w-full max-w-[460px] bg-[#060a14] rounded-t-3xl border-t border-[rgba(56,225,255,0.2)] max-h-[70vh] flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[rgba(56,225,255,0.1)]">
              <div>
                <h3 className="text-base font-bold text-[#dbe9ff]">ЧАЙ СВЕРХЗАДАЧНОСТЬ</h3>
                <p className="text-[10px] text-[#6b7c9e] mt-0.5">
                  {messages.length} {messages.length === 1 ? 'сообщение' : 'сообщений'}
                </p>
              </div>
              <button 
                onClick={() => setShowChatModal(false)}
                className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:border-[rgba(56,225,255,0.5)] transition-all"
              >
                <X className="w-5 h-5 text-[#6b7c9e]" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageSquare className="w-12 h-12 text-[#6b7c9e]/50 mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-[#6b7c9e]">Чат пуст</p>
                  <p className="text-xs text-[#6b7c9e]/70 mt-1">Начните диалог</p>
                </div>
              ) : (
                <ChatMessages 
                  messages={messages}
                  onPlayVoice={(url) => {
                    console.log('Play voice:', url);
                  }}
                />
              )}
            </div>

            {/* Chat Input */}
            <ChatInputBox onSend={(msg) => handleSendMessage(msg, 'chat')} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>

      <Toast message={message} />
    </div>
  );
}
