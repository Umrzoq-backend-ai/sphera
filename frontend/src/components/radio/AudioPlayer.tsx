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
  listenersCount,
  onTogglePlay,
  onVolumeChange,
}: AudioPlayerProps) {

  return (
    <div className="flex-shrink-0 flex flex-col gap-2">
      <Visualizer isPlaying={isPlaying} />

      <div className="text-center">
        <div className="text-[11px] text-[#6b7c9e] tracking-wide">
          ID: <span>{userId || '—'}</span>
        </div>
        <div className="text-[15px] font-extrabold mt-0.5" style={{ textShadow: '0 0 14px rgba(46,168,255,0.25)' }}>
          {broadcasterName}
        </div>
      </div>

      <div className="glass flex items-center gap-3 px-3.5 py-2">
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-full border border-[var(--glass-border)] flex items-center justify-center text-[#02101f] text-base flex-shrink-0"
          style={{
            background: 'radial-gradient(circle at 40% 35%, var(--accent2), var(--accent))',
            boxShadow: '0 0 20px var(--glow)'
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <span className="text-[15px] text-[#6b7c9e]">🔊</span>

        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="flex-1 h-1 rounded-full appearance-none outline-none"
          style={{
            background: `linear-gradient(90deg, var(--accent) 0%, var(--accent) ${volume}%, rgba(46,168,255,0.15) ${volume}%, rgba(46,168,255,0.15) 100%)`
          }}
        />

        {listenersCount !== undefined && (
          <span className="text-[11px] text-[#6b7c9e] flex-shrink-0">
            🎧 {listenersCount}
          </span>
        )}
      </div>
    </div>
  );
}
