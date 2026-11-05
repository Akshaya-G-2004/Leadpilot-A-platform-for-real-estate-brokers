"use client";
// src/components/pages/DashboardView.tsx
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import LeadIntakeModal from "../leads/LeadIntakeModal";

export default function DashboardView() {
  const { leads, openLeadInCopilot, setCurrentPage } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.tag === "high" || l.tag === "hot");
  const visitsScheduled = leads.filter(
    (l) => l.status === "visit_scheduled" || l.status === "Visit Scheduled"
  ).length;
  const closedDeals = leads.filter(
    (l) => l.status === "closed" || l.status === "Closed"
  ).length;
  const avgReadiness =
    totalLeads > 0
      ? Math.round(leads.reduce((s, l) => s + l.readiness_pct, 0) / totalLeads)
      : 0;

  // Top 5 urgent / hot leads sorted by score descending
  const urgentLeads = [...leads]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Upcoming next 5 visits sorted chronologically
  const upcomingVisits = leads
    .filter((l) => l.status === "visit_scheduled" || l.status === "Visit Scheduled")
    .map((lead) => {
      let date: Date;
      let timeString = "10:30 AM";

      if (lead.analysis_json?.scheduled_visit?.isoStart) {
        date = new Date(lead.analysis_json.scheduled_visit.isoStart);
        timeString = lead.analysis_json.scheduled_visit.timeString || "10:30 AM";
      } else {
        const offset = lead.analysis_json?.site_visit?.preferred_day_offsets?.[0] || 2;
        date = new Date();
        date.setDate(date.getDate() + offset);
        date.setHours(10, 30, 0, 0);
      }

      return { lead, date, timeString };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-2">
      {/* ── 1. WELCOME & QUICK ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Pilot Overview</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Real-time pipeline analytics, high-intent prospects, and scheduled site visits.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow hover:bg-indigo-50 transition active:scale-95 cursor-pointer"
          >
            <span>+</span> Add New Lead
          </button>
        </div>
      </div>

      {/* ── 2. KEY METRICS STRIP (5 CARDS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          {
            label: "Total Leads",
            value: totalLeads,
            icon: (
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
          {
            label: "High Priority",
            value: hotLeads.length,
            icon: (
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            ),
          },
          {
            label: "Visits Scheduled",
            value: visitsScheduled,
            icon: (
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            label: "Avg Readiness",
            value: `${avgReadiness}%`,
            icon: (
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: "Closed Deals",
            value: closedDeals,
            icon: (
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            ),
          },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-gray-100 bg-white p-3 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500">{m.label}</p>
              <p className="text-xl font-black mt-0.5 text-indigo-950">{m.value}</p>
            </div>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-indigo-50 border border-indigo-100 shrink-0">
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. TWO SIDE-BY-SIDE BOXES (TOP 5 PROSPECTS & UPCOMING FIELD VISITS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* ── 3A. TOP 5 HIGH-PRIORITY PROSPECTS ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 px-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
                <span>Top 5 High-Priority Prospects</span>
              </h3>
              <button
                onClick={() => setCurrentPage("directory")}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                View All ({leads.length}) →
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {urgentLeads.map((lead, idx) => (
                <div key={lead.id} className="py-2 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-gray-600">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-900 truncate">{lead.name}</p>
                        <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                          lead.tag === "high" || lead.tag === "hot"
                            ? "bg-red-100 text-red-700"
                            : lead.tag === "low" || lead.tag === "cold"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {lead.tag === "high" || lead.tag === "hot" ? "HIGH" : lead.tag === "low" || lead.tag === "cold" ? "LOW" : "MEDIUM"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {lead.location} • {lead.property_requirement}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-indigo-700">Score {lead.score}</p>
                      <p className="text-[10px] text-gray-400">{lead.readiness_pct}% Ready</p>
                    </div>
                    <button
                      onClick={() => openLeadInCopilot(lead)}
                      className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                      title="Open in Copilot"
                      aria-label="Open in Copilot"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3B. UPCOMING FIELD VISITS (NEXT 5) ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 px-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Upcoming Field Visits</span>
              </h3>
              <button
                onClick={() => setCurrentPage("calendar")}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                Calendar →
              </button>
            </div>

            {upcomingVisits.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 space-y-1">
                <p>No field visits scheduled yet.</p>
                <p className="text-[11px] text-gray-400">Use Copilot to schedule visits with buyers.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcomingVisits.map((item, idx) => (
                  <div key={`${item.lead.id}-${idx}`} className="py-2 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Date Badge */}
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[8px] font-black uppercase leading-none">
                          {item.date.toLocaleDateString("en-IN", { month: "short" })}
                        </span>
                        <span className="text-xs font-black leading-tight">
                          {item.date.getDate()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.lead.name}</p>
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-bold">
                            {item.timeString}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {item.lead.location} • {item.lead.property_requirement}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openLeadInCopilot(item.lead)}
                      className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs shrink-0"
                      title="Open in Copilot"
                      aria-label="Open in Copilot"
                    >
                      →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <LeadIntakeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

