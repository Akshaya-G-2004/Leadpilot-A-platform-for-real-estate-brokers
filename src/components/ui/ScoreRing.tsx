// src/components/ui/ScoreRing.tsx
export default function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 70 ? "text-red-500" : pct >= 45 ? "text-amber-500" : "text-sky-500";

  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
          className={color}
        />
      </svg>
      <span className={`text-[10px] font-bold ${color}`}>{pct}</span>
    </div>
  );
}

