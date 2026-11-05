"use client";
// src/components/detail/SiteVisitScheduler.tsx
import { useState, useMemo, useEffect } from "react";
import type { Lead } from "@/lib/types";
import { generateSlots, type TimeSlot } from "@/lib/slots";
import {
  buildGoogleCalendarUrl,
  buildVisitConfirmationMessage,
} from "@/lib/calendar";
import { buildWhatsAppLink } from "@/lib/phone";
import { useApp } from "@/context/AppContext";

export default function SiteVisitScheduler({ lead }: { lead: Lead }) {
  const { updateLeadStatus, updateLead } = useApp();
  const siteVisit = lead.analysis_json?.site_visit;

  const slots = useMemo(() => {
    return generateSlots(
      siteVisit?.preferred_day_offsets || [2, 4, 7],
      siteVisit?.preferred_time_of_day || "morning"
    );
  }, [siteVisit]);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>(slots[0]);
  const [scheduled, setScheduled] = useState(lead.status === "visit_scheduled" || lead.status === "Visit Scheduled");
  const [copiedConfirmMsg, setCopiedConfirmMsg] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    setScheduled(lead.status === "visit_scheduled" || lead.status === "Visit Scheduled");
  }, [lead.status]);

  // Default custom date to tomorrow, 11:00 AM
  const defaultCustomDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);
  const [customDate, setCustomDate] = useState(defaultCustomDate);
  const [customTime, setCustomTime] = useState("11:00");

  // Editable confirmation message state
  const [editableConfirmMsg, setEditableConfirmMsg] = useState("");

  useEffect(() => {
    setEditableConfirmMsg(buildVisitConfirmationMessage(lead, selectedSlot));
  }, [lead, selectedSlot]);

  const handleCustomChange = (date: string, time: string) => {
    setCustomDate(date);
    setCustomTime(time);
    setIsCustom(true);

    if (!date || !time) return;
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(`${date}T00:00:00`);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    const dateFormatted = start.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const timeFormatted = start.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const now = new Date();
    const diffDays = Math.max(0, Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    setSelectedSlot({
      label: `${dateFormatted} · ${timeFormatted}`,
      dateString: date,
      timeString: timeFormatted,
      startTime: start,
      endTime: end,
      offsetDays: diffDays,
    });
  };

  const whatsappConfirmUrl = useMemo(() => {
    return buildWhatsAppLink(lead.phone, editableConfirmMsg);
  }, [lead.phone, editableConfirmMsg]);

  const handleConfirmSchedule = () => {
    const visitData = {
      dateString: selectedSlot.dateString,
      timeString: selectedSlot.timeString,
      isoStart: selectedSlot.startTime.toISOString(),
      label: selectedSlot.label,
    };
    updateLead({
      id: lead.id,
      status: "Visit Scheduled",
      scheduled_visit: visitData,
    });
    setScheduled(true);
  };

  const handleCopyConfirmMsg = () => {
    navigator.clipboard.writeText(editableConfirmMsg).then(() => {
      setCopiedConfirmMsg(true);
      setTimeout(() => setCopiedConfirmMsg(false), 2000);
    });
  };

  return (
    <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50/60 via-white to-white p-5 shadow-md ring-4 ring-indigo-100/60 transition-all">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-black tracking-tight text-indigo-950 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs">
            📅
          </span>
          <span>Smart Site Visit Scheduler</span>
        </h4>
        {scheduled && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
            ✓ Visit Scheduled
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {siteVisit?.reason
          ? `Recommendation: ${siteVisit.reason}`
          : "Select a visit time slot based on customer readiness and location:"}
      </p>

      {/* Suggested Slot selector pills */}
      <div className="flex flex-col gap-1.5 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Suggested Slots
        </span>
        {slots.map((slot) => {
          const isSelected = !isCustom && selectedSlot.label === slot.label;
          return (
            <button
              key={slot.label}
              onClick={() => {
                setIsCustom(false);
                setSelectedSlot(slot);
              }}
              className={`flex items-center justify-between rounded-xl border p-2 text-xs text-left transition ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-500"
                  : "border-gray-200 bg-slate-50/60 text-gray-700 hover:bg-slate-100"
              }`}
            >
              <span>{slot.label}</span>
              {isSelected ? (
                <span className="text-indigo-600 font-bold">Selected</span>
              ) : (
                <span className="text-[11px] text-gray-400">In {slot.offsetDays} days</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Customize Date and Time Option */}
      <div className={`rounded-xl border p-3 mb-3 transition ${
        isCustom
          ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500"
          : "border-gray-200 bg-slate-50/70"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <span>⚙️</span> Customize Date & Time
          </span>
          {isCustom && (
            <span className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 rounded px-1.5 py-0.5">
              Custom Selected
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1 font-medium">Date</label>
            <input
              type="date"
              value={customDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => handleCustomChange(e.target.value, customTime)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-800 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1 font-medium">Time</label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => handleCustomChange(customDate, e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-800 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Action button: Google Calendar */}
      <div className="mb-3">
        <a
          href={buildGoogleCalendarUrl(lead, selectedSlot)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleConfirmSchedule}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition"
        >
          <span>🗓</span> Add to Google Calendar ↗
        </a>
      </div>

      {/* WhatsApp Visit Confirmation Message */}
      <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
            Confirmation Message
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyConfirmMsg}
              className="rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition"
            >
              {copiedConfirmMsg ? "Copied!" : "Copy"}
            </button>
            {whatsappConfirmUrl && (
              <a
                href={whatsappConfirmUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleConfirmSchedule}
                className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#20ba59] transition shadow-2xs"
                title="Send WhatsApp confirmation"
              >
                <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.81.488 3.507 1.338 4.978L2 22l5.187-1.318A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.063c-1.63 0-3.14-.492-4.407-1.336l-.316-.211-3.085.783.824-3.007-.23-.332A8.043 8.043 0 014 12c0-4.411 3.589-8.063 8-8.063s8 3.652 8 8.063-3.589 8.063-8 8.063z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
        {/* Directly editable Confirmation message */}
        <textarea
          value={editableConfirmMsg}
          onChange={(e) => setEditableConfirmMsg(e.target.value)}
          rows={3}
          placeholder="Edit confirmation message..."
          className="mt-1 w-full text-xs text-emerald-950 bg-white/95 rounded-lg p-2.5 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-400 resize-none shadow-2xs leading-relaxed"
        />
      </div>
    </div>
  );
}

