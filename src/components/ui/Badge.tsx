// src/components/ui/Badge.tsx
export default function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
      {children}
    </span>
  );
}

