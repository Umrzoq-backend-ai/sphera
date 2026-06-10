import { useState, useRef } from 'react';
import { Coffee, Mic, Send } from 'lucide-react';
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

  return (
    <div className="shrink-0 mt-4">
      {/* 3 main buttons like in the image */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Chat button (Tea/Coffee) */}
        <button
          onClick={() => handleSend('chat')}
          className="flex flex-col items-center justify-center gap-2 h-[100px] rounded-[20px] bg-[rgba(10,20,40,0.6)] border border-[rgba(0,217,255,0.2)] backdrop-blur-sm hover:border-[rgba(0,217,255,0.4)] transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgba(0,217,255,0.2)] to-[rgba(0,136,255,0.1)] flex items-center justify-center">
            <Coffee className="w-6 h-6 text-[#00d9ff]" />
          </div>
          <span className="text-[10px] text-[#8b9cbe] tracking-wider uppercase">
            {t('send_to_chat') || 'ЧАЙ СМЕРЕННОСТЬ'}
          </span>
        </button>

        {/* Voice button (Microphone) */}
        <button
          onClick={toggleRecording}
          className={`flex flex-col items-center justify-center gap-2 h-[100px] rounded-[20px] backdrop-blur-sm transition-all active:scale-95 ${
            isRecording
              ? 'bg-gradient-to-br from-[#ff4d6d] to-[#c9184a] border-2 border-[#ff4d6d] animate-pulse'
              : 'bg-[rgba(10,20,40,0.6)] border border-[rgba(0,217,255,0.2)] hover:border-[rgba(0,217,255,0.4)]'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isRecording 
              ? 'bg-white/20' 
              : 'bg-gradient-to-br from-[rgba(0,217,255,0.2)] to-[rgba(0,136,255,0.1)]'
          }`}>
            <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-[#00d9ff]'}`} />
          </div>
          <span className={`text-[10px] tracking-wider uppercase ${
            isRecording ? 'text-white font-bold' : 'text-[#8b9cbe]'
          }`}>
            {isRecording ? 'ЗАПИСЬ...' : (t('voice_msg') || 'ГОЛОСОВОЕ СООБЩЕНИЕ')}
          </span>
        </button>

        {/* Studio/Send button (Paper plane) */}
        <button
          onClick={() => handleSend('studio')}
          className="flex flex-col items-center justify-center gap-2 h-[100px] rounded-[20px] bg-[rgba(10,20,40,0.6)] border border-[rgba(0,217,255,0.2)] backdrop-blur-sm hover:border-[rgba(0,217,255,0.4)] transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgba(0,217,255,0.2)] to-[rgba(0,136,255,0.1)] flex items-center justify-center">
            <Send className="w-6 h-6 text-[#00d9ff]" />
          </div>
          <span className="text-[10px] text-[#8b9cbe] tracking-wider uppercase">
            {t('send_to_studio') || 'ОТПРАВИТЬ'}
          </span>
        </button>
      </div>

      {/* Voice preview */}
      {pendingVoice && (
        <div className="flex items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-[rgba(0,217,255,0.12)] border border-dashed border-[#00d9ff] text-xs text-[#00d9ff] mb-4">
          <span>{t('voice_ready')}</span>
          <button onClick={() => setPendingVoice(null)} className="text-[#6b7c9e] text-base hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Text input (optional, for those who want to type) */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend('chat')}
        placeholder={t('chat_placeholder') || 'Напишите сообщение...'}
        className="w-full bg-[rgba(10,20,40,0.6)] border border-[rgba(0,217,255,0.2)] rounded-[20px] px-5 py-3 text-sm outline-none focus:border-[rgba(0,217,255,0.4)] backdrop-blur-sm"
      />
    </div>
  );
}
