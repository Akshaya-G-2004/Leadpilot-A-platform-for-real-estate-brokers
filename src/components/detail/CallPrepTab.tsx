"use client";
// src/components/detail/CallPrepTab.tsx
import { useState, useEffect } from "react";
import type { Lead, ReadinessField } from "@/lib/types";
import { buildWhatsAppLink } from "@/lib/phone";
import SiteVisitScheduler from "./SiteVisitScheduler";

export default function CallPrepTab({ lead }: { lead: Lead }) {
  const a = lead.analysis_json;
  const readiness = a?.readiness;

  // Editable WhatsApp Message & Dropdown Questions state
  const [editableWaMsg, setEditableWaMsg] = useState(a?.whatsapp_message || "");
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questions, setQuestions] = useState<string[]>(readiness?.questions_to_ask || []);

  useEffect(() => {
    if (lead.analysis_json?.readiness?.questions_to_ask) {
      setQuestions(lead.analysis_json.readiness.questions_to_ask);
    }
  }, [lead.id, lead.analysis_json?.readiness?.questions_to_ask]);

  useEffect(() => {
    setEditableWaMsg(lead.analysis_json?.whatsapp_message || "");
  }, [lead.id, lead.analysis_json?.whatsapp_message]);

  // WhatsApp Dispatcher (uses editable text)
  const whatsappUrl = editableWaMsg
    ? buildWhatsAppLink(lead.phone, editableWaMsg)
    : null;

  const getStatusBadge = (field?: ReadinessField) => {
    if (!field) return null;
    switch (field.status) {
      case "clear":
        return <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">CLEAR</span>;
      case "vague":
        return <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">VAGUE</span>;
      case "missing":
        return <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-800">MISSING</span>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. WHATSAPP DISPATCHER ── */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
              <span>💬</span> WhatsApp Dispatcher
            </h4>
          </div>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#20ba59] transition active:scale-95"
              title="Open in WhatsApp"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.667-.699c.974.532 1.848.816 2.793.816 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.802-5.768-5.802zm3.385 8.163c-.145.409-.844.755-1.157.777-.314.022-.69.04-1.921-.469-1.286-.532-2.128-1.843-2.193-1.93-.065-.088-.518-.69-.518-1.317 0-.627.327-.935.443-1.062.116-.127.254-.159.34-.159.085 0 .17.002.245.006.079.004.186-.03.29.221.107.258.368.899.4 0.965.033.065.054.143.011.231-.044.088-.066.143-.131.22-.065.077-.137.172-.196.231-.065.066-.134.138-.058.269.076.131.338.557.726.902.499.444.919.581 1.05.646.131.066.208.055.285-.033.077-.088.329-.384.417-.516.088-.132.176-.11.297-.066.121.044.769.363.901.429.132.066.22.099.253.154.033.055.033.32-.112.729z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.81.488 3.507 1.338 4.978L2 22l5.187-1.318A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.063c-1.63 0-3.14-.492-4.407-1.336l-.316-.211-3.085.783.824-3.007-.23-.332A8.043 8.043 0 014 12c0-4.411 3.589-8.063 8-8.063s8 3.652 8 8.063-3.589 8.063-8 8.063z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          ) : (
            <button
              onClick={() => {
                if (editableWaMsg) {
                  navigator.clipboard.writeText(editableWaMsg);
                  alert("Phone missing. Message copied to clipboard!");
                }
              }}
              className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
            >
              Copy Msg (No Phone)
            </button>
          )}
        </div>
        {/* Directly editable WhatsApp message */}
        <textarea
          value={editableWaMsg}
          onChange={(e) => setEditableWaMsg(e.target.value)}
          rows={3}
          placeholder="Type or edit message..."
          className="mt-3 w-full rounded-xl bg-white/95 p-3 text-xs text-emerald-950 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-400 leading-relaxed shadow-2xs resize-none"
        />
      </div>

      {/* ── 2. READINESS DETECTOR ── */}
      {readiness && (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Readiness Detector
              </h4>
            </div>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5">
              {lead.readiness_pct}% Overall
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { name: "Budget", field: readiness.budget },
              { name: "Location", field: readiness.location },
              { name: "Property Type", field: readiness.property_type },
              { name: "Timeline", field: readiness.timeline },
              { name: "Decision Maker", field: readiness.decision_maker },
            ].map(({ name, field }) => (
              <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-gray-900">{name}</span>
                  <p className="text-[11px] text-gray-500 truncate">{field.note || "No note"}</p>
                </div>
                {getStatusBadge(field)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. MISSING INFO DISCOVERY QUESTIONS (COLLAPSIBLE DROPDOWN) ── */}
      {questions.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white p-4 shadow-xs">
          <button
            type="button"
            onClick={() => setQuestionsOpen(!questionsOpen)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Discovery Questions ({questions.length})
            </h4>
            <span className="text-xs font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100/80 transition">
              {questionsOpen ? "▲ Hide" : "▼ Show"}
            </span>
          </button>

          {questionsOpen && (
            <div className="mt-3 pt-2 border-t border-indigo-100/70">
              <p className="text-xs text-indigo-700 mb-2.5 font-normal">
                Ask these to clarify vague requirements:
              </p>
              <ul className="space-y-2">
                {questions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 rounded-xl bg-white p-2.5 text-xs text-gray-800 border border-indigo-100/70 shadow-2xs font-normal">
                    <span className="font-black text-indigo-600 shrink-0">Q{idx + 1}.</span>
                    <span className="leading-relaxed">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── 4. SMART SITE VISIT SCHEDULER ── */}
      <SiteVisitScheduler lead={lead} />
    </div>
  );
}
