"use client";
// src/components/pages/LandingPage.tsx

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-400 via-indigo-700 to-slate-950 text-white px-6 py-12 selection:bg-indigo-300 selection:text-indigo-950">
      {/* Decorative gradient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-xs font-bold uppercase tracking-wider text-indigo-100">
          <span></span>
          <span></span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-sm">
          LeadPilot
        </h1>

        {/* User-requested Tagline */}
        <p className="text-xl sm:text-2xl font-bold text-indigo-100 max-w-xl leading-relaxed">
          &ldquo;A real buddy for any real estate broker&rdquo;
        </p>

        {/* Brief Description */}
        <p className="text-sm sm:text-base text-indigo-200/90 max-w-lg leading-relaxed font-normal">
          Your smart co-pilot to instantly filter serious property buyers, check budgets, and close deals faster on WhatsApp
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs font-semibold text-indigo-100">
          <span className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-xs">
            Smart Lead Scoring
          </span>
          <span className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-xs">
            1-Click WhatsApp
          </span>
          <span className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-xs">
            Site Visit Scheduler
          </span>
        </div>

        {/* Start Exploring Button */}
        <div className="pt-4">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-indigo-900 font-extrabold text-base shadow-2xl hover:bg-indigo-50 hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Start Exploring</span>
            <span className="transition-transform group-hover:translate-x-1 font-black">→</span>
          </button>
        </div>
      </div>

      {/* Subtle Footer */}
      <footer className="absolute bottom-6 text-center text-xs text-indigo-200/60 font-medium">
        Empowering real estate agents with instant deal intelligence
      </footer>
    </div>
  );
}

