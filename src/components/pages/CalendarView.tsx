"use client";
// src/components/pages/CalendarView.tsx
import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { Lead } from "@/lib/types";
import { buildGoogleCalendarUrl } from "@/lib/calendar";

type ScheduledItem = {
  lead: Lead;
  date: Date;
  dateKey: string; // YYYY-MM-DD
  timeString: string;
  label: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper: derive or extract visit date for each lead
function getLeadVisit(lead: Lead): ScheduledItem | null {
  // 1. Explicitly recorded scheduled visit
  if (lead.analysis_json?.scheduled_visit?.isoStart) {
    const d = new Date(lead.analysis_json.scheduled_visit.isoStart);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return {
        lead,
        date: d,
        dateKey: `${year}-${month}-${day}`,
        timeString: lead.analysis_json.scheduled_visit.timeString || "10:30 AM",
        label: lead.analysis_json.scheduled_visit.label || d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      };
    }
  }

  // 2. Lead has status "visit_scheduled" or "Visit Scheduled" (e.g. from seed data or quick status toggle)
  if (lead.status === "visit_scheduled" || lead.status === "Visit Scheduled") {
    const offset = lead.analysis_json?.site_visit?.preferred_day_offsets?.[0] || 2;
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(10, 30, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
      lead,
      date: d,
      dateKey: `${year}-${month}-${day}`,
      timeString: "10:30 AM",
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) + " · 10:30 AM",
    };
  }

  return null;
}

export default function CalendarView() {
  const { leads, openLeadInCopilot, setCurrentPage } = useApp();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Extract all scheduled visits from leads
  const scheduledVisits = useMemo(() => {
    return leads
      .map(getLeadVisit)
      .filter((item): item is ScheduledItem => item !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [leads]);

  // Group visits by YYYY-MM-DD
  const visitsByDateKey = useMemo(() => {
    const map = new Map<string, ScheduledItem[]>();
    for (const v of scheduledVisits) {
      const arr = map.get(v.dateKey) || [];
      arr.push(v);
      map.set(v.dateKey, arr);
    }
    return map;
  }, [scheduledVisits]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const { calendarDays } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    const daysInMonth = lastDay.getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      days.push({
        date: d,
        dateKey: `${y}-${m}-${day}`,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const m = String(month + 1).padStart(2, "0");
      const day = String(i).padStart(2, "0");
      const key = `${year}-${m}-${day}`;
      days.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: key === todayKey,
      });
    }

    // Next month padding to fill complete grid of 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(i).padStart(2, "0");
      days.push({
        date: d,
        dateKey: `${y}-${m}-${day}`,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return { calendarDays: days };
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered visits for selected day (if any)
  const selectedDayVisits = selectedDayKey ? visitsByDateKey.get(selectedDayKey) || [] : [];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-2">
      {/* ── 1. HERO BANNER (MATCHING DASHBOARD & DIRECTORY STYLE) ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-md">
        <h2 className="text-2xl font-bold tracking-tight">Site Visits Calendar</h2>
        <p className="text-xs text-indigo-100 mt-1">
          Track scheduled property tours, visits, and follow-ups synced with Google Calendar.
        </p>
      </div>

      {/* ── 2. CALENDAR CONTROLS & TOGGLES (COMPACT & PROPER SELECTORS) ── */}
      <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Previous Month */}
          <button
            onClick={handlePrevMonth}
            className="h-7 w-7 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-center transition cursor-pointer"
            title="Previous month"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Month Selector */}
          <select
            value={month}
            onChange={(e) => setCurrentDate(new Date(year, Number(e.target.value), 1))}
            className="rounded-lg border border-gray-200 bg-slate-50/70 hover:bg-white px-2 py-1 text-xs font-bold text-gray-800 outline-none hover:border-indigo-300 focus:border-indigo-500 cursor-pointer transition"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => setCurrentDate(new Date(Number(e.target.value), month, 1))}
            className="rounded-lg border border-gray-200 bg-slate-50/70 hover:bg-white px-2 py-1 text-xs font-bold text-gray-800 outline-none hover:border-indigo-300 focus:border-indigo-500 cursor-pointer transition"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Next Month */}
          <button
            onClick={handleNextMonth}
            className="h-7 w-7 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-center transition cursor-pointer"
            title="Next month"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Today Button */}
          <button
            onClick={handleToday}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition cursor-pointer ml-1"
          >
            Today
          </button>
        </div>

        {/* View Mode Switcher (Compact) */}
        <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-gray-200 text-[11px] font-bold self-start sm:self-auto">
          <button
            onClick={() => setViewMode("month")}
            className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
              viewMode === "month"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Month Grid
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
              viewMode === "agenda"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Agenda View ({scheduledVisits.length})
          </button>
        </div>
      </div>

      {/* ── 3. MONTH GRID VIEW ── */}
      {viewMode === "month" && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-slate-50 text-center text-[11px] font-bold text-indigo-600 uppercase tracking-wider py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {calendarDays.map((day, idx) => {
              const dayVisits = visitsByDateKey.get(day.dateKey) || [];
              const isSelected = selectedDayKey === day.dateKey;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayKey(day.dateKey === selectedDayKey ? null : day.dateKey)}
                  className={`min-h-[105px] p-2 flex flex-col justify-between transition cursor-pointer ${
                    !day.isCurrentMonth
                      ? "bg-slate-50/50 text-gray-300"
                      : "bg-white text-gray-800"
                  } ${day.isToday ? "bg-indigo-50/30 ring-1 ring-inset ring-indigo-200" : ""} ${
                    isSelected ? "ring-2 ring-indigo-500 bg-indigo-50/60" : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        day.isToday
                          ? "bg-indigo-600 text-white"
                          : day.isCurrentMonth
                          ? "text-gray-700"
                          : "text-gray-400"
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    {dayVisits.length > 0 && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 rounded-full px-1.5 py-0.2">
                        {dayVisits.length}
                      </span>
                    )}
                  </div>

                  {/* Visit Pills on Day */}
                  <div className="space-y-1 mt-1.5 flex-1">
                    {dayVisits.map((item) => (
                      <div
                        key={item.lead.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openLeadInCopilot(item.lead);
                        }}
                        className="group rounded-md bg-indigo-100/80 hover:bg-indigo-600 hover:text-white border border-indigo-200 p-1 text-[10px] font-semibold text-indigo-900 transition flex items-center justify-between gap-1 shadow-2xs"
                        title={`Click to open ${item.lead.name} in Copilot`}
                      >
                        <span className="truncate">
                          {item.timeString} · {item.lead.name}
                        </span>
                        <span className="shrink-0 text-[9px] group-hover:text-white text-indigo-600 font-bold">
                          →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. SELECTED DAY DETAIL POPUP / STRIP ── */}
      {selectedDayKey && selectedDayVisits.length > 0 && viewMode === "month" && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
              Visits Scheduled for {new Date(selectedDayKey).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </h4>
            <button
              onClick={() => setSelectedDayKey(null)}
              className="text-xs text-gray-400 hover:text-gray-700 font-bold"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedDayVisits.map((v, idx) => (
              <div
                key={`${v.lead.id}-${idx}`}
                className="bg-white rounded-xl p-3 border border-indigo-100 shadow-2xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{v.lead.name}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {v.timeString}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {v.lead.location} • {v.lead.property_requirement}
                  </p>
                </div>
                <button
                  onClick={() => openLeadInCopilot(v.lead)}
                  className="rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-indigo-700 transition shrink-0"
                >
                  Open in Copilot →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. AGENDA / ALL SCHEDULED VISITS LIST ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-slate-50/70 flex justify-between items-center text-xs text-gray-500 font-semibold">
          <span className="font-bold text-indigo-700">Upcoming Site Visits Agenda</span>
          <span className="text-[11px] text-gray-400">Synced with Google Calendar</span>
        </div>

        {scheduledVisits.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-3xl block">📅</span>
            <p className="text-sm font-semibold text-gray-700">No Site Visits Scheduled Yet</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              When you schedule a site visit in Lead Copilot using the Smart Visit Scheduler or click "Add to Google Calendar", it will automatically appear here.
            </p>
            <button
              onClick={() => setCurrentPage("copilot")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
            >
              Go to Lead Copilot →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {scheduledVisits.map((item, idx) => {
              const defaultSlot = {
                startTime: item.date,
                endTime: new Date(item.date.getTime() + 60 * 60 * 1000),
                label: item.label,
                dateString: item.dateKey,
                timeString: item.timeString,
                offsetDays: 0,
              };
              const gcalUrl = buildGoogleCalendarUrl(item.lead, defaultSlot);

              return (
                <div
                  key={`${item.lead.id}-${idx}`}
                  onClick={() => openLeadInCopilot(item.lead)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/40 cursor-pointer transition group"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Date Badge */}
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black uppercase">
                        {item.date.toLocaleDateString("en-IN", { month: "short" })}
                      </span>
                      <span className="text-base font-black leading-tight">
                        {item.date.getDate()}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition">
                          {item.lead.name}
                        </span>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                          {item.timeString}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.lead.tag === "high" || item.lead.tag === "hot"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {item.lead.tag === "high" || item.lead.tag === "hot" ? "HIGH" : "MEDIUM"}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600">
                        {item.lead.location} • {item.lead.property_requirement} • {item.lead.budget}
                      </p>
                      {item.lead.phone && (
                        <p className="text-[11px] text-gray-400">{item.lead.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition"
                      title="Open Google Calendar Event"
                    >
                      Google Cal ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => openLeadInCopilot(item.lead)}
                      className="rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-1.5 text-xs font-bold hover:bg-indigo-600 hover:text-white transition"
                    >
                      Open in Copilot →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

