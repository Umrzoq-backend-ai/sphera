import { Play, Pause, Volume2 } from 'lucide-react';
import { Visualizer } from './Visualizer';

interface AudioPlayerProps {
  isPlaying: boolean;
  volume: number;
  broadcasterName: string;
  userId: number;
  listenersCount?: number;
  onTogglePlay: () => void;
  onVolumeChange: (volume: number) => void;
}

export function AudioPlayer({
  isPlaying,
  volume,
  broadcasterName,
  userId,
  onTogglePlay,
  onVolumeChange,
}: AudioPlayerProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Orb + play button */}
      <div className="relative flex items-center justify-center">
        <Visualizer isPlaying={isPlaying} />

        {/* Play/Pause floating over orb */}
        <button
          onClick={onTogglePlay}
          className="absolute z-10 w-14 h-14 rounded-full glass flex items-center justify-center transition-all active:scale-90 hover:border-[rgba(56,225,255,0.4)]"
          style={{
            boxShadow: isPlaying
              ? '0 0 30px rgba(56,225,255,0.4), inset 0 0 15px rgba(56,225,255,0.1)'
              : '0 0 20px rgba(46,168,255,0.2)',
          }}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-[#38e1ff]" strokeWidth={2.5} />
          ) : (
            <Play className="w-6 h-6 text-[#38e1ff] ml-0.5" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Broadcaster info */}
      <div className="text-center">
        <div className="text-[10px] text-[#6b7c9e] tracking-wider">
          ID: {userId}
        </div>
        <div className="text-sm font-bold text-[#38e1ff] text-glow mt-0.5">
          {broadcasterName}
        </div>
      </div>

      {/* Volume control */}
      <div className="w-full max-w-[260px] glass px-4 py-2.5 rounded-2xl flex items-center gap-3">
        <Volume2 className="w-4 h-4 text-[#38e1ff] shrink-0" strokeWidth={1.8} />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="flex-1 h-1 rounded-full appearance-none outline-none cursor-pointer"
          style={{
            background: `linear-gradient(90deg, #38e1ff 0%, #38e1ff ${volume}%, rgba(46,168,255,0.15) ${volume}%, rgba(46,168,255,0.15) 100%)`,
          }}
        />
        <span className="text-[10px] text-[#6b7c9e] w-7 text-right">{volume}%</span>
      </div>
    </div>
  );
}
