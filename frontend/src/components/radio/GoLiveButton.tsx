import { useState, useRef } from 'react';
import { WS_URL } from '../../lib/config';
import { getToken } from '../../lib/auth';
import { useTranslation } from '../../hooks/useTranslation';

interface GoLiveButtonProps {
  city: string;
  onToast: (message: string) => void;
}

export function GoLiveButton({ city, onToast }: GoLiveButtonProps) {
  const { t } = useTranslation();
  const [isLive, setIsLive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleLive = async () => {
    if (isLive) {
      stopBroadcast();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const token = getToken();
      const ws = new WebSocket(`${WS_URL}/radio/${city}/broadcast/ws?token=${encodeURIComponent(token || '')}`);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'broadcast_unavailable') {
            onToast('🔇 Прямой эфир доступен только на сервере (Icecast)');
            stopBroadcast();
          } else if (msg.type === 'broadcast_busy') {
            onToast('⚠️ Эфир уже занят другим ведущим');
            stopBroadcast();
          } else if (msg.type === 'broadcast_started') {
            setIsLive(true);
            onToast('🔴 Вы в прямом эфире!');
            startRecorder(stream, ws);
          } else if (msg.type === 'broadcast_error') {
            onToast('⚠️ Эфир прерван');
            stopBroadcast();
          }
        } catch (e) {
          // Binary data, ignore
        }
      };

      ws.onclose = () => {
        if (isLive) stopBroadcast();
      };

      ws.onerror = () => {
        onToast('Ошибка соединения с эфиром');
      };
    } catch (e) {
      console.error('Broadcast error:', e);
      onToast(t('toast_mic_denied'));
    }
  };

  const startRecorder = (stream: MediaStream, ws: WebSocket) => {
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          e.data.arrayBuffer().then((buf) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(buf);
            }
          });
        }
      };

      recorder.start(500);
    } catch (e) {
      console.error('Recorder error:', e);
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.start(500);
    }
  };

  const stopBroadcast = () => {
    setIsLive(false);
    
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    } catch (e) {
      console.error('Stop recorder error:', e);
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.error('Stop stream error:', e);
    }

    try {
      if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
        wsRef.current.close();
      }
    } catch (e) {
      console.error('Close WS error:', e);
    }

    recorderRef.current = null;
    streamRef.current = null;
    wsRef.current = null;
  };

  return (
    <button
      onClick={toggleLive}
      className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-sm tracking-wide flex-shrink-0 ${
        isLive
          ? 'bg-gradient-to-br from-[var(--red)] to-[#b91d36] text-white animate-pulse'
          : 'border-[rgba(255,77,109,0.5)] bg-gradient-to-br from-[rgba(255,77,109,0.18)] to-[rgba(255,77,109,0.06)] text-[#ff9fb0]'
      }`}
    >
      {isLive ? t('end_live') : t('go_live')}
    </button>
  );
}
