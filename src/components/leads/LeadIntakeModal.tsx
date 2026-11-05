"use client";
// src/components/leads/LeadIntakeModal.tsx
import { useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import type { Lead } from "@/lib/types";

export default function LeadIntakeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { setLeads, selectLead } = useApp();

  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [propertyReq, setPropertyReq] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");

  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  if (!isOpen) return null;

  // Auto-extract entities from the pasted message
  const handleAutoExtract = async () => {
    if (!message.trim()) {
      setError("Please paste or type a customer message first.");
      return;
    }

    setError(null);
    setExtracting(true);

    try {
      const res = await fetch("/api/leads/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!res.ok) throw new Error("Could not auto-extract fields");

      const data = await res.json();
      const f = data.fields;
      if (f) {
        if (f.name) setName(f.name);
        if (f.phone) setPhone(f.phone);
        if (f.location) setLocation(f.location);
        if (f.property_requirement) setPropertyReq(f.property_requirement);
        if (f.budget) setBudget(f.budget);
        if (f.timeline) setTimeline(f.timeline);
        if (f.notes) setNotes(f.notes);
        setAutoFilled(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  // Fill sample raw message to test 1-click
  const handlePrefillMessage = () => {
    const sample = "Hi, my name is Arvind Mehra (phone: 9845012345). Looking for a 3 BHK apartment in Whitefield within 1.1 Crore. We want to move in 2 months. Can we arrange a site visit this Saturday?";
    setMessage(sample);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim() || "Bangalore",
          property_requirement: propertyReq.trim() || "Not Specified",
          budget: budget.trim() || "Flexible",
          timeline: timeline.trim() || "Not Specified",
          message: message.trim() || `Inquiry from ${name.trim()}`,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.lead) {
        setLeads((prev: Lead[]) => [data.lead, ...prev]);
        selectLead(data.lead);
        onClose();
        // Reset form
        setName("");
        setPhone("");
        setLocation("");
        setPropertyReq("");
        setBudget("");
        setTimeline("");
        setMessage("");
        setNotes("");
        setAutoFilled(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>✨</span> Lead Intake
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Paste customer message to auto-extract, or fill manually
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-600">
              ⚠ {error}
            </div>
          )}

          {/* 1. CUSTOMER RAW MESSAGE BOX (AT THE TOP) */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-indigo-950 flex items-center gap-1">
                <span>💬</span> Customer Message / Inquiry
              </label>
              <button
                type="button"
                onClick={handlePrefillMessage}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                Sample Message
              </button>
            </div>

            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste WhatsApp inquiry, email text, or chat transcript here..."
              className="w-full rounded-xl border border-indigo-200/80 bg-white p-2.5 outline-none focus:border-indigo-500 text-xs text-gray-800 leading-relaxed"
            />

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Paste message then click to extract:
              </span>
              <button
                type="button"
                onClick={handleAutoExtract}
                disabled={extracting || !message.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 transition"
              >
                {extracting ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Extracting...
                  </>
                ) : (
                  "✨ Auto-Fill Fields with AI"
                )}
              </button>
            </div>

            {autoFilled && (
              <p className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg p-1.5 border border-emerald-200 text-center">
                ✓ Fields extracted! You can review or edit below.
              </p>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Lead Details (Editable)
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* 2. EXTRACTED / MANUAL FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arvind Mehra"
                className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9845012345"
                className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Property Requirement</label>
              <input
                type="text"
                value={propertyReq}
                onChange={(e) => setPropertyReq(e.target.value)}
                placeholder="e.g. 2 BHK, 3 BHK Villa"
                className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Budget</label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 85 Lakh or 1.2 Crore"
                className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Target Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Whitefield, Indiranagar"
                className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Buying Timeline</label>
              <input
                type="text"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g. Within 2 months, Immediate"
                className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Important Requirements / Extra Notes */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Important Requirements / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Vaastu compliant, east facing, high floor, spouse decision maker..."
              className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-slate-50 text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !phone.trim()}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Analyzing with AI & Saving...
                </>
              ) : (
                "⚡ Analyze & Save Lead"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
