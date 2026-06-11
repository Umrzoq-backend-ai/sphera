interface VisualizerProps {
  isPlaying: boolean;
}

export function Visualizer({ isPlaying }: VisualizerProps) {
  const speed = isPlaying ? '1' : '0.3';

  return (
    <div className="relative w-[280px] h-[280px] flex items-center justify-center">
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full opacity-40 blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(56,225,255,0.4), rgba(46,168,255,0.1), transparent 70%)',
          animation: `orbPulse ${3 / Number(speed)}s ease-in-out infinite`,
        }}
      />

      {/* Main orb body */}
      <div
        className="absolute inset-6 rounded-full overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #1a3a5c, #060a14 70%)',
          boxShadow: `
            0 0 60px rgba(46,168,255,0.3),
            inset 0 0 40px rgba(46,168,255,0.15),
            inset 0 -20px 40px rgba(56,225,255,0.1)
          `,
        }}
      >
        {/* Blob A - large rotating gradient */}
        <div
          className="absolute w-[140%] h-[140%] -top-[20%] -left-[20%] rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(46,168,255,0.4), transparent, rgba(56,225,255,0.3), transparent)',
            animation: `orbSpin ${8 / Number(speed)}s linear infinite`,
            opacity: isPlaying ? 0.8 : 0.3,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Blob B - counter-rotating */}
        <div
          className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%] rounded-full"
          style={{
            background: 'conic-gradient(from 180deg, transparent, rgba(0,217,255,0.5), transparent, rgba(46,168,255,0.2), transparent)',
            animation: `orbSpin ${12 / Number(speed)}s linear infinite reverse`,
            opacity: isPlaying ? 0.7 : 0.2,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Blob C - morphing shape */}
        <div
          className="absolute top-[15%] left-[15%] w-[70%] h-[70%]"
          style={{
            background: 'radial-gradient(ellipse at 40% 40%, rgba(56,225,255,0.5), rgba(46,168,255,0.2), transparent 70%)',
            borderRadius: '40% 60% 55% 45% / 55% 40% 60% 45%',
            animation: `orbMorph ${6 / Number(speed)}s ease-in-out infinite`,
            opacity: isPlaying ? 0.9 : 0.3,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Blob D - floating accent */}
        <div
          className="absolute top-[30%] left-[25%] w-[50%] h-[50%]"
          style={{
            background: 'radial-gradient(circle, rgba(56,225,255,0.6), transparent 60%)',
            borderRadius: '50% 40% 55% 45% / 45% 55% 40% 60%',
            animation: `orbFloat ${4 / Number(speed)}s ease-in-out infinite`,
            opacity: isPlaying ? 0.8 : 0.25,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Highlight / specular */}
        <div
          className="absolute top-[8%] left-[20%] w-[35%] h-[25%] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.15), transparent 70%)',
            filter: 'blur(4px)',
          }}
        />
      </div>

      {/* Ring border */}
      <div
        className="absolute inset-5 rounded-full border border-[rgba(56,225,255,0.25)]"
        style={{
          boxShadow: '0 0 20px rgba(46,168,255,0.15)',
        }}
      />

      <style>{`
        @keyframes orbSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.6; }
        }
        @keyframes orbMorph {
          0%, 100% { border-radius: 40% 60% 55% 45% / 55% 40% 60% 45%; transform: rotate(0deg) scale(1); }
          33% { border-radius: 55% 45% 40% 60% / 45% 60% 40% 55%; transform: rotate(120deg) scale(1.05); }
          66% { border-radius: 45% 55% 60% 40% / 60% 45% 55% 40%; transform: rotate(240deg) scale(0.95); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10%, -10%) scale(1.1); }
          50% { transform: translate(-5%, 10%) scale(0.9); }
          75% { transform: translate(-10%, -5%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
