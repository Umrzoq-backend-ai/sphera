import { useRef, useEffect } from 'react';
import { Play, FileText } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  onPlayVoice?: (url: string) => void;
}

export function ChatMessages({ messages, onPlayVoice }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (messages.length === 0) {
    return (
      <div className="glass rounded-[20px] p-6 text-center">
        <div className="text-xs text-[#6b7c9e]">
          💬 Чат пока пуст. Начните общение!
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="glass rounded-[20px] p-4 max-h-[300px] overflow-y-auto space-y-3 scroll-smooth"
    >
      {messages.map((msg, idx) => {
        const isAI = msg.username?.includes('ИИ') || msg.username?.includes('AI');
        const isStudio = msg.message_type === 'studio' || msg.message_type === 'studio_voice';
        
        return (
          <div 
            key={idx}
            className={`flex flex-col gap-1 p-3 rounded-xl transition-all ${
              isAI 
                ? 'bg-gradient-to-r from-[rgba(168,85,247,0.1)] to-[rgba(236,72,153,0.05)] border border-[rgba(168,85,247,0.2)]'
                : isStudio
                ? 'bg-gradient-to-r from-[rgba(245,158,11,0.1)] to-[rgba(251,146,60,0.05)] border border-[rgba(245,158,11,0.2)]'
                : 'bg-[rgba(10,20,40,0.4)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${
                  isAI 
                    ? 'text-[#a855f7]' 
                    : isStudio 
                    ? 'text-[#f59e0b]' 
                    : 'text-[#00d9ff]'
                }`}>
                  {msg.username}
                </span>
                {isStudio && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-[rgba(245,158,11,0.2)] text-[#f59e0b] font-bold">
                    СТУДИЯ
                  </span>
                )}
              </div>
              <span className="text-[9px] text-[#6b7c9e]">
                {formatTime(msg.created_at)}
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              {/* Voice message */}
              {msg.voice_url && (
                <button
                  onClick={() => onPlayVoice?.(msg.voice_url!)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(0,217,255,0.1)] hover:bg-[rgba(0,217,255,0.15)] transition-colors group"
                >
                  <Play className="w-3.5 h-3.5 text-[#00d9ff] group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-[#00d9ff] font-medium">
                    Голосовое сообщение
                  </span>
                </button>
              )}

              {/* File */}
              {msg.file_url && (
                <a
                  href={msg.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(0,217,255,0.1)] hover:bg-[rgba(0,217,255,0.15)] transition-colors group"
                >
                  <FileText className="w-3.5 h-3.5 text-[#00d9ff]" />
                  <span className="text-xs text-[#00d9ff] font-medium truncate">
                    {msg.file_name || 'Файл'}
                  </span>
                </a>
              )}

              {/* Text message */}
              {msg.message && !msg.voice_url && (
                <p className="text-xs text-[#dbe9ff] leading-relaxed">
                  {msg.message}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
