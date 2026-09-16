interface SplashScreenProps {
  message?: string;
}

export function SplashScreen({ message }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b] text-white select-none animate-in fade-in duration-200">
      <div className="flex flex-col items-center">
        {/* Ambient Backlight Glow behind Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 sm:w-28 sm:h-28 bg-[#FF453A]/30 rounded-3xl blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#FF453A] rounded-[22px] sm:rounded-[26px] shadow-2xl flex items-center justify-center">
            <span className="text-white text-4xl sm:text-5xl font-black tracking-tighter select-none font-sans">
              P
            </span>
          </div>
        </div>

        {/* Brand Title */}
        <div className="mt-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center">
            <span>Pace</span>
            <span className="text-[#FF453A]">Wise</span>
          </h1>
          <p className="text-[11px] sm:text-xs font-black tracking-[0.25em] text-zinc-500 uppercase mt-1.5">
            Personal Budget
          </p>
        </div>

        {/* Subtle Sync / Loading Indicator */}
        {message && (
          <div className="mt-8 flex items-center gap-2 text-xs font-medium text-zinc-500 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF453A] animate-ping" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
