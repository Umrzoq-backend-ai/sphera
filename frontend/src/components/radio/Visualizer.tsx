interface VisualizerProps {
  isPlaying: boolean;
}

export function Visualizer({ isPlaying }: VisualizerProps) {
  return (
    <div className="relative w-[280px] h-[280px] flex items-center justify-center">
      {/* Static outer glow */}
      <div
        className="absolute inset-0 rounded-full opacity-40 blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(56,225,255,0.4), rgba(46,168,255,0.1), transparent 70%)',
        }}
      />

      {/* Main orb body - static */}
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
        {/* Static gradient layer A */}
        <div
          className="absolute w-[140%] h-[140%] -top-[20%] -left-[20%] rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(46,168,255,0.4), transparent, rgba(56,225,255,0.3), transparent)',
            opacity: isPlaying ? 0.8 : 0.3,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Static gradient layer B */}
        <div
          className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%] rounded-full"
          style={{
            background: 'conic-gradient(from 180deg, transparent, rgba(0,217,255,0.5), transparent, rgba(46,168,255,0.2), transparent)',
            opacity: isPlaying ? 0.7 : 0.2,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Static shape C */}
        <div
          className="absolute top-[15%] left-[15%] w-[70%] h-[70%]"
          style={{
            background: 'radial-gradient(ellipse at 40% 40%, rgba(56,225,255,0.5), rgba(46,168,255,0.2), transparent 70%)',
            borderRadius: '40% 60% 55% 45% / 55% 40% 60% 45%',
            opacity: isPlaying ? 0.9 : 0.3,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Static accent D */}
        <div
          className="absolute top-[30%] left-[25%] w-[50%] h-[50%]"
          style={{
            background: 'radial-gradient(circle, rgba(56,225,255,0.6), transparent 60%)',
            borderRadius: '50% 40% 55% 45% / 45% 55% 40% 60%',
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
    </div>
  );
}
