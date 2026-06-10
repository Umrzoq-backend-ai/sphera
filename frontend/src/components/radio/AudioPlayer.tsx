import { Play, Pause, Volume2 } from 'lucide-react';
import { Visualizer } from './Visualizer';

interface AudioPlayerProps {
  isPlaying: boolean;
  volume: number;
  broadcasterName: string;
  userId: number;
  listenersCount?: number;
  currentTime?: number;
  duration?: number;
  onTogglePlay: () => void;
  onVolumeChange: (volume: number) => void;
}

export function AudioPlayer({
  isPlaying,
  volume,
  broadcasterName,
  userId,
  listenersCount = 0,
  currentTime = 48,
  duration = 180,
  onTogglePlay,
  onVolumeChange,
}: AudioPlayerProps) {
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-6 my-6">
      {/* Main circular player */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#0088ff] opacity-20 blur-2xl animate-pulse" />
        
        {/* Main circle with glass effect */}
        <div className="relative w-[280px] h-[280px] rounded-full bg-gradient-to-br from-[rgba(0,217,255,0.1)] to-[rgba(0,136,255,0.05)] backdrop-blur-xl border-2 border-[rgba(0,217,255,0.3)] flex items-center justify-center">
          {/* Inner glow */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[rgba(0,217,255,0.15)] to-transparent" />
          
          {/* Visualizer */}
          {isPlaying && (
            <div className="absolute inset-0">
              <Visualizer isActive={isPlaying} />
            </div>
          )}
          
          {/* Play/Pause button */}
          <button
            onClick={onTogglePlay}
            className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#0088ff] flex items-center justify-center shadow-[0_0_30px_rgba(0,217,255,0.6)] hover:shadow-[0_0_40px_rgba(0,217,255,0.8)] transition-all active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-[#0a0e1a] fill-current" />
            ) : (
              <Play className="w-10 h-10 text-[#0a0e1a] fill-current ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Info section */}
      <div className="text-center space-y-2 w-full max-w-[320px]">
        {/* User ID */}
        <div className="text-xs text-[#6b7c9e] tracking-wider">
          ID: {userId}
        </div>
        
        {/* Broadcaster name */}
        <div className="text-lg font-bold text-[#00d9ff] tracking-wide text-glow">
          {broadcasterName}
        </div>
        
        {/* Track title */}
        <div className="text-sm text-[#8b9cbe] tracking-wide">
          ТЕМУЩИЙ ХИТ (НАЗВАНИЕ)
        </div>
        
        {/* Time and status */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="text-3xl font-bold text-white tracking-wider">
            {timeStr}
          </div>
        </div>
        <div className="text-[10px] text-[#6b7c9e] tracking-[3px] uppercase">
          ПОТОК АКТИВЕН
        </div>
      </div>

      {/* Volume control */}
      <div className="w-full max-w-[280px] flex items-center gap-3 px-4">
        <Volume2 className="w-5 h-5 text-[#00d9ff]" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="flex-1 h-1 rounded-full bg-[rgba(107,124,158,0.3)] appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
