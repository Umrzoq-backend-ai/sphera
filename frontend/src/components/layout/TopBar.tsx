import { Menu } from 'lucide-react';

interface TopBarProps {
  points: number;
}

export function TopBar({ points }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-4 py-4">
      {/* Left: Hamburger menu */}
      <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[rgba(0,217,255,0.1)] transition-colors">
        <Menu className="w-6 h-6 text-[#00d9ff]" />
      </button>

      {/* Center: Logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-[28px] font-extrabold tracking-[4px] text-white text-glow leading-none">
          INTR
        </div>
        <div className="text-[8px] tracking-[3px] text-[#6b7c9e] mt-1">
          raelio
        </div>
      </div>

      {/* Right: Points */}
      <div className="min-w-[70px] px-4 py-2 rounded-full border-2 border-[rgba(0,217,255,0.3)] bg-[rgba(10,20,40,0.6)] backdrop-blur-sm text-center">
        <div className="text-xl font-bold text-[#00d9ff] text-glow leading-none">
          {points}
        </div>
        <div className="text-[8px] tracking-[2px] text-[#6b7c9e] uppercase mt-0.5">
          POINT
        </div>
      </div>
    </header>
  );
}
