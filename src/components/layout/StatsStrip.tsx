"use client";
// src/components/layout/StatsStrip.tsx
import { useApp } from "@/context/AppContext";

export default function StatsStrip() {
  const { leads } = useApp();

  const stats = {
    "Total leads": leads.length || "—",
    "Hot leads": leads.filter((l) => l.tag === "high" || l.tag === "hot").length || "—",
    "Visits scheduled": leads.filter((l) => l.status === "visit_scheduled" || l.status === "Visit Scheduled").length || "—",
    "Avg readiness %":
      leads.length > 0
        ? Math.round(leads.reduce((s, l) => s + l.readiness_pct, 0) / leads.length) + "%"
        : "—",
  };

  return (
    <section className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
      {Object.entries(stats).map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm"
        >
          <span className="text-xl font-bold text-indigo-600">{value}</span>
          <span className="text-xs font-medium text-gray-500 mt-0.5">{label}</span>
        </div>
      ))}
    </section>
  );
}
