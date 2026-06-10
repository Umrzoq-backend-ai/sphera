import { useState, useRef } from 'react';
import { sendVoiceMessage, uploadFile } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import type { Language } from '../../types';

interface ChatInputProps {
  onSendMessage: (message: string, destination: 'chat' | 'studio') => void;
  onToast: (message: string) => void;
  city: string;
  language: Language;
  onPointsUpdate: (points: number) => void;
}

export function ChatInput({ onSendMessage, onToast, city, language, onPointsUpdate }: ChatInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pendingVoice, setPendingVoice] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = (destination: 'chat' | 'studio') => {
    if (pendingVoice) {
      sendVoice(destination);
      return;
    }

    const message = text.trim();
    if (!message) {
      onToast(t('toast_short'));
      return;
    }

    onSendMessage(message, destination);
    setText('');
    onToast(destination === 'studio' ? t('toast_sent_studio') : t('toast_sent_chat'));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) {
          onToast(t('toast_short'));
          return;
        }
        setPendingVoice(blob);
        onToast(t('voice_ready'));
      };

      mediaRecorder.start();
      setIsRecording(true);
      onToast(t('toast_recording'));
    } catch (e) {
      console.error('Mic error:', e);
      onToast(t('toast_mic_denied'));
    }
  };

  const sendVoice = async (destination: 'chat' | 'studio') => {
    if (!pendingVoice) return;

    onToast(t('toast_processing'));
    
    try {
      const result = await sendVoiceMessage(city, pendingVoice, destination, language);
      if (result.points !== undefined) {
        onPointsUpdate(result.points);
      }
      onToast(destination === 'studio' ? t('toast_sent_studio') : t('toast_sent_chat'));
    } catch (error: any) {
      if (error.status === 403) {
        onToast(t('studio_denied_role'));
      } else if (error.status === 402) {
        const data = await error.response?.json().catch(() => ({}));
        if (data?.detail?.points !== undefined) {
          onPointsUpdate(data.detail.points);
        }
        onToast(t('toast_limit'));
      } else {
        onToast(t('send_error'));
      }
    } finally {
      setPendingVoice(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      onToast(t('file_too_big'));
      return;
    }

    onToast(t('toast_processing'));

    try {
      const result = await uploadFile(city, file);
      if (result.points !== undefined) {
        onPointsUpdate(result.points);
      }
      onToast(t('toast_sent_chat'));
    } catch (error: any) {
      if (error.status === 402) {
        const data = await error.response?.json().catch(() => ({}));
        if (data?.detail?.points !== undefined) {
          onPointsUpdate(data.detail.points);
        }
        onToast(t('toast_limit'));
      } else if (error.status === 400) {
        onToast(t('file_unsupported'));
      } else {
        onToast(t('file_error'));
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex-shrink-0 mt-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-[42px] h-[42px] rounded-full border border-[var(--glass-border)] bg-[rgba(6,10,20,0.7)] text-[17px] flex items-center justify-center"
          title="Файл"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={toggleRecording}
          className={`w-[42px] h-[42px] rounded-full border flex items-center justify-center text-[17px] ${
            isRecording
              ? 'bg-[var(--red)] border-[var(--red)] text-white animate-pulse'
              : 'border-[var(--glass-border)] bg-[rgba(6,10,20,0.7)]'
          }`}
          title="Голосовое"
        >
          🎤
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend('chat')}
          placeholder={t('chat_placeholder')}
          className="flex-1 min-w-0 bg-[rgba(6,10,20,0.7)] border border-[var(--glass-border)] rounded-[22px] px-4 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]"
        />
      </div>

      {pendingVoice && (
        <div className="flex items-center justify-between gap-2.5 mt-2.5 px-3.5 py-2.5 rounded-xl bg-[rgba(56,225,255,0.12)] border border-dashed border-[#38e1ff] text-xs text-[#38e1ff]">
          <span>{t('voice_ready')}</span>
          <button onClick={() => setPendingVoice(null)} className="text-[#6b7c9e] text-base">
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2.5 mt-2.5">
        <button
          onClick={() => handleSend('chat')}
          className="flex-1 py-3 px-3 rounded-[14px] border border-[var(--glass-border)] bg-[rgba(6,10,20,0.6)] text-[13px] font-bold tracking-wide"
        >
          {t('send_to_chat')}
        </button>
        <button
          onClick={() => handleSend('studio')}
          className="flex-1 py-3 px-3 rounded-[14px] bg-gradient-to-br from-[#2ea8ff] to-[#38e1ff] text-[#02101f] text-[13px] font-bold tracking-wide"
          style={{ boxShadow: '0 0 16px var(--glow)' }}
        >
          {t('send_to_studio')}
        </button>
      </div>
    </div>
  );
}
