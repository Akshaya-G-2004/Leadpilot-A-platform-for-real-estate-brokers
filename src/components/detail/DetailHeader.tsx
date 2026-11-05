"use client";
// src/components/detail/DetailHeader.tsx
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Lead } from "@/lib/types";
import CallPrepTab from "./CallPrepTab";
import CallOutcomeTab from "./CallOutcomeTab";
import AudioBriefPlayer from "./AudioBriefPlayer";

const tagLabel: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  hot: "High",
  warm: "Medium",
  cold: "Low",
};

function getDisplayStatus(status: string) {
  if (!status || status === "new" || status === "New") return "New";
  if (status === "contacted") return "Connected – Interested";
  if (status === "visit_scheduled") return "Visit Scheduled";
  if (status === "closed") return "Closed";
  return status;
}

function getStatusPillStyle(status: string) {
  switch (status) {
    case "closed":
    case "Closed":
      return "bg-slate-100 text-slate-800 border-slate-300";
    case "Connected – Interested":
    case "contacted":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "Connected – Follow Up Later":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "Connected – Not Interested":
      return "bg-red-50 text-red-800 border-red-200";
    case "Ringing / No Answer":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "Invalid Number":
      return "bg-zinc-100 text-zinc-700 border-zinc-300";
    case "visit_scheduled":
    case "Visit Scheduled":
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case "new":
    case "New":
    default:
      return "bg-white text-gray-800 border-gray-200";
  }
}

const tagBg: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-sky-50 text-sky-700 border-sky-200",
  hot: "bg-red-50 text-red-700 border-red-200",
  warm: "bg-amber-50 text-amber-700 border-amber-200",
  cold: "bg-sky-50 text-sky-700 border-sky-200",
};

export default function DetailHeader() {
  const { selectedLead, updateLeadStatus, updateLead, setActiveTab } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "call_prep" | "call_outcome">("overview");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: "",
    location: "",
    property_requirement: "",
    budget: "",
    timeline: "",
    notes: "",
  });

  if (!selectedLead) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl text-indigo-400">
          🎯
        </div>
        <p className="text-sm font-semibold text-gray-700">No Lead Selected</p>
        <p className="text-xs text-gray-400 text-center max-w-xs">
          Select any prospect from the left pipeline to view AI analysis, signals, and call prep tools.
        </p>
      </div>
    );
  }

  const lead = selectedLead;
  const a = lead.analysis_json;

  return (
    <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full max-w-4xl mx-auto w-full">
      {/* ── TOP HERO CARD (LIGHT LIGHT INDIGO WITH BLACK TEXT & CONNECTED TABS) ── */}
      <div className="rounded-2xl border border-indigo-100/90 bg-indigo-50/40 p-5 shadow-xs">
        {/* Line 1: Name, High/Medium/Low Tag, and Status dropdown on the same line */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-xl font-black text-black tracking-tight truncate">
              {lead.name}
            </h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${tagBg[lead.tag]}`}>
              {tagLabel[lead.tag]}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Status Pill: Updated via Log Call Outcome */}
            <span
              className={`rounded-full border px-3 py-0.5 text-[11px] font-bold shadow-2xs transition-all ${getStatusPillStyle(lead.status)}`}
              title="Current Lead Status"
            >
              {getDisplayStatus(lead.status)}
            </span>

            {/* Small Edit Icon Button near Status Button */}
            <button
              onClick={() => {
                setEditForm({
                  phone: lead.phone || "",
                  location: lead.location || "",
                  property_requirement: lead.property_requirement || "",
                  budget: lead.budget || "",
                  timeline: lead.timeline || "",
                  notes: lead.notes || lead.analysis_json?.notes || "",
                });
                setIsEditing(true);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Edit Lead Information"
              aria-label="Edit Lead Information"
            >
              <svg
                className="w-3.5 h-3.5 stroke-current fill-none"
                viewBox="0 0 24 24"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>

            {/* Mobile: open chat tab */}
            <button
              onClick={() => setActiveTab("chat")}
              className="flex items-center gap-1 rounded-xl border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-black hover:bg-indigo-50 lg:hidden"
            >
              💬 Chat
            </button>
          </div>
        </div>

        {/* Line 2: Phone with Indigo SVG Icon */}
        <p className="text-xs text-black mt-1 flex items-center gap-1.5 flex-wrap font-medium">
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 text-indigo-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>{lead.phone ?? "No phone"}</span>
          </span>
        </p>

        {/* Line 3: Connected Sub-Tabs directly below the details in the top box */}
        <div className="mt-3.5 pt-3 border-t border-indigo-100/80 flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition shadow-2xs ${
              activeSubTab === "overview"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white/80 text-black border border-indigo-100 hover:bg-white hover:text-indigo-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab("call_prep")}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition shadow-2xs ${
              activeSubTab === "call_prep"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white/80 text-black border border-indigo-100 hover:bg-white hover:text-indigo-700"
            }`}
          >
            Call Prep
          </button>
          <button
            onClick={() => setActiveSubTab("call_outcome")}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition shadow-2xs ${
              activeSubTab === "call_outcome"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white/80 text-black border border-indigo-100 hover:bg-white hover:text-indigo-700"
            }`}
          >
            Call Outcome
          </button>
        </div>
      </div>

      {/* ── CONTENT: Switch between Overview, Call Prep, and Call Outcome ── */}
      {activeSubTab === "call_prep" ? (
        <>
          {/* Quick reference metrics for Call Prep: 1 line (Budget, Property Type, Location, Timeline) */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-3.5 shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center items-start">
              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Budget</p>
                <p className="text-xs sm:text-sm font-black text-black mt-0.5 leading-snug break-words">{lead.budget}</p>
              </div>
              <div className="border-l border-gray-100 px-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Property Type</p>
                <p className="text-xs sm:text-sm font-black text-black mt-0.5 leading-snug break-words">{lead.property_requirement}</p>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l border-gray-100 px-1 pt-2 sm:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</p>
                <p className="text-xs sm:text-sm font-black text-black mt-0.5 leading-snug break-words">{lead.location}</p>
              </div>
              <div className="border-t sm:border-t-0 border-l border-gray-100 px-1 pt-2 sm:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Timeline</p>
                <p className="text-xs sm:text-sm font-black text-black mt-0.5 leading-snug break-words">{lead.timeline}</p>
              </div>
            </div>
          </div>
          <CallPrepTab lead={lead} />
        </>
      ) : activeSubTab === "call_outcome" ? (
        <CallOutcomeTab lead={lead} />
      ) : (
        /* ── SINGLE MERGED OVERVIEW BOX ── */
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs space-y-4">
          {/* Line 1: Budget, Property Type, Location, Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center items-start">
            <div className="px-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Budget</p>
              <p className="text-xs sm:text-sm font-black text-black mt-0.5 leading-snug break-words">{lead.budget}</p>
            </div>
            <div className="border-l border-gray-100 px-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Property Type</p>
              <p className="text-xs sm:text-sm font-black text-black mt-0.5 leading-snug break-words">{lead.property_requirement}</p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-gray-100 px-1 pt-2 sm:pt-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</p>
              <p className="text-xs sm:text-sm font-black text-black mt-0.5 leading-snug break-words">{lead.location}</p>
            </div>
            <div className="border-t sm:border-t-0 border-l border-gray-100 px-1 pt-2 sm:pt-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Timeline</p>
              <p className="text-xs sm:text-sm font-black text-black mt-0.5 leading-snug break-words">{lead.timeline}</p>
            </div>
          </div>

          {/* Line 2: Score & Readiness */}
          <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Score</span>
              <span className="text-base font-black text-indigo-700">{lead.score}</span>
            </div>
            <div className="flex items-center justify-center gap-2 border-l border-gray-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Readiness</span>
              <span className="text-base font-black text-indigo-700">{lead.readiness_pct}%</span>
            </div>
          </div>

          {/* Line 3: Customer Inquiry with Audio Brief */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Customer Inquiry
              </p>
              {a?.spoken_brief && (
                <AudioBriefPlayer spokenBrief={a.spoken_brief} />
              )}
            </div>
            <p className="text-xs text-indigo-950 leading-relaxed bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 font-medium">
              "{lead.message}"
            </p>
          </div>

          {a && (
            <>
              {/* Line 4: AI Analysis Summary */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1.5">
                  AI Analysis Summary
                </p>
                <p className="text-xs text-gray-700 leading-relaxed">{a.summary}</p>
              </div>

              {/* Line 5: Engagement Signals */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2.5">
                  Engagement Signals
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(a.signals).map(([key, val]) => (
                    <div key={key} className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100">
                      <div className="flex justify-between text-[11px] text-gray-600 mb-1 font-medium">
                        <span className="capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-bold text-indigo-700">{val} / 10</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-200/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            val >= 7 ? "bg-indigo-600" : val >= 4 ? "bg-amber-500" : "bg-slate-400"
                          }`}
                          style={{ width: `${(val / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Requirements / Notes (shown only if present) */}
              {(lead.notes || a.notes) && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1.5">
                    Important Requirements / Notes
                  </p>
                  <p className="text-xs text-gray-800 bg-slate-50 rounded-xl p-2.5 border border-slate-100 font-medium leading-relaxed">
                    {lead.notes || a.notes}
                  </p>
                </div>
              )}

              {/* Line 6: Recommended Next Action */}
              {a.recommended_next_action && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                    Recommended Next Action
                  </p>
                  <p className="text-xs font-medium text-indigo-950 bg-indigo-50/40 rounded-xl p-2.5 border border-indigo-100">
                    {a.recommended_next_action}
                  </p>
                </div>
              )}

              {/* Potential Objections */}
              {a.objections.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5">
                    Potential Objections
                  </p>
                  <ul className="space-y-1">
                    {a.objections.map((o, i) => (
                      <li key={i} className="text-xs text-amber-900 flex items-start gap-1.5 bg-amber-50/50 rounded-lg p-2 border border-amber-200/40">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── EDIT LEAD INFO MODAL ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 bg-slate-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span>✏️</span> Edit Lead Info — {lead.name}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="h-7 w-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newProperty = editForm.property_requirement.trim() || lead.property_requirement;
                const newTimeline = editForm.timeline.trim() || lead.timeline;
                const newBudget = editForm.budget.trim() || lead.budget;
                const newLocation = editForm.location.trim() || lead.location;
                const newPhone = editForm.phone.trim() || null;
                const newNotes = editForm.notes.trim() || null;

                updateLead?.({
                  id: lead.id,
                  phone: newPhone,
                  location: newLocation,
                  property_requirement: newProperty,
                  budget: newBudget,
                  timeline: newTimeline,
                  notes: newNotes,
                });
                setIsEditing(false);
              }}
              className="p-5 space-y-3.5 text-xs overflow-y-auto max-h-[80vh]"
            >
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2 outline-none focus:border-indigo-500 bg-slate-50 text-xs"
                  placeholder="e.g. 9845012345"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Property Requirement</label>
                  <input
                    type="text"
                    value={editForm.property_requirement}
                    onChange={(e) => setEditForm({ ...editForm, property_requirement: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none focus:border-indigo-500 bg-slate-50 text-xs"
                    placeholder="e.g. 3 BHK"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Budget</label>
                  <input
                    type="text"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none focus:border-indigo-500 bg-slate-50 text-xs"
                    placeholder="e.g. 1.2 Crore"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none focus:border-indigo-500 bg-slate-50 text-xs"
                    placeholder="e.g. Whitefield"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Buying Timeline</label>
                  <input
                    type="text"
                    value={editForm.timeline}
                    onChange={(e) => setEditForm({ ...editForm, timeline: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none focus:border-indigo-500 bg-slate-50 text-xs"
                    placeholder="e.g. Within 2 months"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Important Requirements / Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2 outline-none focus:border-indigo-500 bg-slate-50 text-xs"
                  placeholder="e.g. Vaastu compliant, east facing, high floor, spouse decision maker..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl px-3.5 py-1.5 font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-indigo-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
