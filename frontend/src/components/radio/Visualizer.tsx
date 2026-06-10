interface VisualizerProps {
  isPlaying: boolean;
}

export function Visualizer({ isPlaying }: VisualizerProps) {
  return (
    <div className="relative w-[110px] h-[110px] mx-auto flex items-center justify-center">
      {/* Rings */}
      <div className="absolute inset-0 rounded-full border border-[rgba(46,168,255,0.25)] animate-[spin_8s_linear_infinite]"
           style={{ 
             boxShadow: '0 0 40px rgba(46,168,255,0.25) inset, 0 0 30px var(--glow)',
             borderStyle: 'dashed'
           }} />
      <div className="absolute inset-4 rounded-full border border-[rgba(46,168,255,0.4)] animate-[spin_14s_linear_infinite_reverse]"
           style={{ borderStyle: 'dashed' }} />
      <div className="absolute inset-8 rounded-full border border-[rgba(56,225,255,0.5)]" />

      {/* Core with bars */}
      <div className="absolute inset-[34px] rounded-full flex items-end justify-center gap-0.5 px-1.5 pb-3 overflow-hidden"
           style={{
             background: 'radial-gradient(circle at 50% 40%, rgba(56,225,255,0.35), rgba(10,16,32,0.9) 70%)',
             boxShadow: '0 0 40px var(--glow)'
           }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={`w-0.5 rounded-sm bg-gradient-to-t from-[var(--accent)] to-[var(--accent2)] ${
              isPlaying ? 'animate-[vbar_1s_ease-in-out_infinite]' : 'h-1.5'
            }`}
            style={{
              animationDelay: `${i * 0.06}s`,
              boxShadow: '0 0 6px var(--accent)'
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes vbar {
          0%, 100% { height: 6px; }
          50% { height: 24px; }
        }
      `}</style>
    </div>
  );
}
