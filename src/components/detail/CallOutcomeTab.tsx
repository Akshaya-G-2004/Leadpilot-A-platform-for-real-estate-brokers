"use client";
// src/components/detail/CallOutcomeTab.tsx
import { useState, useEffect } from "react";
import type { Lead } from "@/lib/types";
import { useApp } from "@/context/AppContext";

interface CallOutcome {
  id: string;
  lead_id: string;
  outcome: string;
  notes: string;
  created_at: string;
}

const OUTCOMES = [
  { label: "Connected – Interested", color: "hover:bg-emerald-50 border-emerald-200 text-emerald-800 bg-emerald-50/40" },
  { label: "Connected – Follow Up Later", color: "hover:bg-blue-50 border-blue-200 text-blue-800 bg-blue-50/40" },
  { label: "Connected – Not Interested", color: "hover:bg-red-50 border-red-200 text-red-800 bg-red-50/40" },
  { label: "Ringing / No Answer", color: "hover:bg-amber-50 border-amber-200 text-amber-800 bg-amber-50/40" },
  { label: "Invalid Number", color: "hover:bg-zinc-100 border-zinc-200 text-zinc-700 bg-zinc-50" },
  { label: "Visit Scheduled", color: "hover:bg-indigo-50 border-indigo-200 text-indigo-800 bg-indigo-50/40" },
  { label: "Closed", color: "hover:bg-slate-100 border-slate-200 text-slate-800 bg-slate-100" },
];

export default function CallOutcomeTab({ lead }: { lead: Lead }) {
  const { updateLeadStatus } = useApp();
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingOutcome, setSubmittingOutcome] = useState(false);
  const [outcomes, setOutcomes] = useState<CallOutcome[]>([]);
  const [loadingOutcomes, setLoadingOutcomes] = useState(true);

  // Load outcome history
  useEffect(() => {
    setLoadingOutcomes(true);
    fetch(`/api/leads/${lead.id}/outcomes`)
      .then((r) => r.json())
      .then((data) => {
        setOutcomes(data.outcomes || []);
        setLoadingOutcomes(false);
      })
      .catch(() => setLoadingOutcomes(false));
  }, [lead.id]);

  // Submit Call Outcome
  const handleLogOutcome = async (outcomeLabel: string) => {
    setSubmittingOutcome(true);
    setSelectedOutcome(outcomeLabel);

    // Optimistically update lead status immediately across top header and left side list
    updateLeadStatus(lead.id, outcomeLabel);

    // Immediately add to Call History with current time
    const newOutcome: CallOutcome = {
      id: "out-" + Date.now(),
      lead_id: lead.id,
      outcome: outcomeLabel,
      notes: notes || "",
      created_at: new Date().toISOString(),
    };
    setOutcomes((prev) => [newOutcome, ...prev]);

    const currentNotes = notes;
    setNotes("");

    try {
      const res = await fetch(`/api/leads/${lead.id}/outcomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: outcomeLabel, notes: currentNotes }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.outcome) {
          setOutcomes((prev) => [
            data.outcome,
            ...prev.filter((o) => o.id !== newOutcome.id),
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to log outcome:", err);
    } finally {
      setSubmittingOutcome(false);
      setSelectedOutcome("");
    }
  };

  return (
    /* ── SINGLE CONNECTED BOX FOR LOG CALL OUTCOME & CALL HISTORY ── */
    <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs space-y-5">
      {/* ── 1. LOG CALL OUTCOME ── */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
          Log Call Outcome
        </h4>
        <p className="text-xs text-gray-500 mb-3.5">
          Select deterministic outcome (auto-transitions lead status):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {OUTCOMES.map((o) => (
            <button
              key={o.label}
              disabled={submittingOutcome}
              onClick={() => handleLogOutcome(o.label)}
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-left transition ${o.color} ${
                lead.status === o.label || selectedOutcome === o.label
                  ? "ring-2 ring-indigo-500 font-bold shadow-xs"
                  : ""
              } disabled:opacity-50 active:scale-98`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional call notes (e.g. spouse to visit on weekend)..."
            className="flex-1 rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-400 focus:bg-white transition"
          />
        </div>
      </div>

      {/* ── 2. CALL HISTORY ── */}
      <div className="pt-4 border-t border-gray-100">
        <h5 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2.5">
          Call History ({outcomes.length})
        </h5>
        {loadingOutcomes ? (
          <p className="text-xs text-gray-400">Loading call history...</p>
        ) : outcomes.length === 0 ? (
          <p className="text-xs text-gray-400">No calls logged yet for this lead.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {outcomes.map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>{item.outcome}</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {item.notes && <p className="text-gray-600 mt-1">{item.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

