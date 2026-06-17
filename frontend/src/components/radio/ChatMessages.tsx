import { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { API_URL } from '../../lib/config';
import type { ChatMessage } from '../../types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  onPlayVoice?: (url: string) => void;
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Yangi xabar kelganda avtomatik pastga scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('ru-RU', {
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-3xl mb-3 opacity-30">💬</div>
        <p className="text-xs text-[#6b7c9e]">Чат пока пуст</p>
        <p className="text-[10px] text-[#6b7c9e]/60 mt-1">Начните общение!</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      style={{
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        // скрыть полосу прокрутки — только свайп пальцем
        scrollbarWidth: 'none',         /* Firefox */
        msOverflowStyle: 'none',        /* IE/Edge */
      }}
      className="flex flex-col gap-2 py-1"
    >
      <style>{`
        div[data-chat-scroll]::-webkit-scrollbar { display: none; }
      `}</style>

      {messages.map((msg, idx) => {
        const isAI = msg.username?.includes('ИИ') || msg.username?.includes('AI');
        const isStudio = msg.message_type === 'studio' || msg.message_type === 'studio_voice';

        return (
          <div
            key={idx}
            className={`flex flex-col gap-1 px-3 py-2.5 rounded-2xl ${
              isAI
                ? 'bg-[rgba(124,92,255,0.12)] border border-[rgba(124,92,255,0.2)]'
                : isStudio
                ? 'bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)]'
                : 'bg-[rgba(16,28,52,0.7)] border border-[rgba(56,225,255,0.08)]'
            }`}
          >
            {/* Имя + время */}
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-bold truncate ${
                isAI ? 'text-[#a78bfa]' : isStudio ? 'text-[#f59e0b]' : 'text-[#38e1ff]'
              }`}>
                {isStudio && <span className="mr-1 text-[9px] opacity-70">[СТУДИЯ]</span>}
                {msg.username || 'Гость'}
              </span>
              <span className="text-[9px] text-[#6b7c9e] shrink-0">
                {formatTime(msg.created_at)}
              </span>
            </div>

            {/* Контент */}
            {msg.voice_url ? (
              <VoiceMiniPlayer url={msg.voice_url} duration={msg.duration_sec} />
            ) : msg.file_url ? (
              <FileCard url={msg.file_url} name={msg.file_name || 'Файл'} />
            ) : (
              <p className="text-[13px] text-[#dbe9ff] leading-relaxed break-words">
                {msg.message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Голосовой мини-плеер ─────────────────────────────── */
function VoiceMiniPlayer({ url, duration }: { url: string | null; duration?: number | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const fullUrl = url ? (url.startsWith('http') ? url : `${API_URL}${url}`) : '';

  const startProgress = () => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar) return;

    const tick = () => {
      if (!audio.paused && audio.duration) {
        bar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
        animRef.current = requestAnimationFrame(tick);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  };

  const togglePlay = () => {
    if (!fullUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(fullUrl);
      audioRef.current.onended = () => {
        if (progressRef.current) progressRef.current.style.width = '0%';
        cancelAnimationFrame(animRef.current);
        // Сброс иконки
        const btn = containerRef.current?.querySelector('[data-play-btn]');
        if (btn) btn.textContent = '▶';
      };
    }
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().catch(console.error);
      startProgress();
      const btn = containerRef.current?.querySelector('[data-play-btn]');
      if (btn) btn.textContent = '⏸';
    } else {
      audio.pause();
      cancelAnimationFrame(animRef.current);
      const btn = containerRef.current?.querySelector('[data-play-btn]');
      if (btn) btn.textContent = '▶';
    }
  };

  const fmt = (s?: number | null) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2"
      style={{ background: 'rgba(56,225,255,0.06)', border: '1px solid rgba(56,225,255,0.12)' }}
    >
      {/* Play/Pause кнопка */}
      <button
        data-play-btn
        onClick={togglePlay}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] transition-all active:scale-90"
        style={{ background: 'linear-gradient(135deg, #2ea8ff, #38e1ff)', color: '#02101f' }}
      >
        ▶
      </button>

      {/* Прогресс + длительность */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Полоска прогресса */}
        <div className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(56,225,255,0.15)' }}>
          <div
            ref={progressRef}
            className="h-full rounded-full transition-none"
            style={{
              width: '0%',
              background: 'linear-gradient(90deg, #2ea8ff, #38e1ff)',
              boxShadow: '0 0 6px rgba(56,225,255,0.5)',
            }}
          />
        </div>

        {/* Волна (статичная) */}
        <div className="flex items-center gap-[2px]" style={{ height: '12px' }}>
          {[3,5,8,6,10,7,12,8,9,6,10,7,5,8,4,6,3].map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}px`,
                background: 'rgba(56,225,255,0.35)',
                borderRadius: '1px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Длительность */}
      <span className="text-[10px] text-[#6b7c9e] shrink-0 tabular-nums">
        {fmt(duration)}
      </span>
    </div>
  );
}

/* ─── Файл ─────────────────────────────────────────────── */
function FileCard({ url, name }: { url: string; name: string }) {
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  const clean = name.replace(/^📎\s*/, '');

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 no-underline transition-all active:scale-[0.98]"
      style={{ background: 'rgba(56,225,255,0.06)', border: '1px solid rgba(56,225,255,0.12)' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(56,225,255,0.12)' }}>
        <FileText className="w-4 h-4 text-[#38e1ff]" />
      </div>
      <span className="text-[12px] text-[#38e1ff] truncate">{clean}</span>
    </a>
  );
}
