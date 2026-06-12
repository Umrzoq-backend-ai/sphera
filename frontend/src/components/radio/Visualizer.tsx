interface VisualizerProps {
  isPlaying: boolean;
}

export function Visualizer({ isPlaying }: VisualizerProps) {
  // Markaziy audio to'lqin chiziqlari
  const bars = Array.from({ length: 28 });

  return (
    <div className="relative w-[280px] h-[280px] flex items-center justify-center">
      {/* Tashqi nafas oluvchi yorug'lik */}
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(56,225,255,0.45), rgba(46,168,255,0.12), transparent 70%)',
          animation: 'orbGlow 3s ease-in-out infinite',
        }}
      />

      {/* Aylanuvchi tashqi halqa (Jarvis) */}
      <div
        className="absolute inset-2 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent, rgba(56,225,255,0.55), transparent 30%, transparent 60%, rgba(46,168,255,0.45), transparent)',
          animation: 'spinCW 6s linear infinite',
          maskImage: 'radial-gradient(transparent 60%, #000 62%, #000 70%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(transparent 60%, #000 62%, #000 70%, transparent 72%)',
        }}
      />

      {/* Aylanuvchi ichki halqa (teskari) */}
      <div
        className="absolute inset-6 rounded-full"
        style={{
          background: 'conic-gradient(from 180deg, transparent, rgba(124,92,255,0.5), transparent 40%, rgba(0,217,255,0.5), transparent)',
          animation: 'spinCCW 9s linear infinite',
          maskImage: 'radial-gradient(transparent 66%, #000 68%, #000 78%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(transparent 66%, #000 68%, #000 78%, transparent 80%)',
        }}
      />

      {/* Markaziy yadro */}
      <div
        className="absolute inset-[60px] rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 38% 32%, #18406a, #0a1730 60%, #060a14 100%)',
          boxShadow: '0 0 50px rgba(46,168,255,0.4), inset 0 0 35px rgba(56,225,255,0.25)',
          animation: 'corePulse 2.5s ease-in-out infinite',
        }}
      >
        {/* Audio to'lqin (waveform) */}
        <div className="flex items-end justify-center gap-[3px] h-[46px]">
          {bars.map((_, i) => {
            const center = Math.abs(i - bars.length / 2);
            const base = 8 + (bars.length / 2 - center) * 2.2;
            return (
              <span
                key={i}
                className="w-[2.5px] rounded-full"
                style={{
                  background: 'linear-gradient(180deg, #7c5cff, #38e1ff)',
                  height: `${base}px`,
                  animation: isPlaying
                    ? `wave 0.9s ease-in-out ${i * 0.05}s infinite`
                    : 'none',
                  opacity: isPlaying ? 1 : 0.4,
                  boxShadow: '0 0 6px rgba(56,225,255,0.6)',
                }}
              />
            );
          })}
        </div>

        {/* Yuqori yaltiroq nuqta */}
        <div
          className="absolute top-[12%] left-[22%] w-[35%] h-[22%] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.18), transparent 70%)', filter: 'blur(4px)' }}
        />
      </div>

      {/* Statik chegara halqa */}
      <div
        className="absolute inset-[52px] rounded-full border border-[rgba(56,225,255,0.3)]"
        style={{ boxShadow: '0 0 24px rgba(46,168,255,0.2)' }}
      />

      <style>{`
        @keyframes spinCW { to { transform: rotate(360deg); } }
        @keyframes spinCCW { to { transform: rotate(-360deg); } }
        @keyframes orbGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.6); }
        }
      `}</style>
    </div>
  );
}
