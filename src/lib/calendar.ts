// src/lib/calendar.ts
import type { TimeSlot } from "./slots";
import type { Lead } from "./types";

/**
 * Format a Date object to RFC 5545 iCalendar UTC string format: YYYYMMDDTHHMMSSZ
 */
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generates an RFC 5545 compliant .ics file content as a string.
 */
export function generateIcsContent(lead: Lead, slot: TimeSlot): string {
  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(slot.startTime);
  const dtEnd = formatIcsDate(slot.endTime);
  const uid = `site-visit-${lead.id}-${slot.startTime.getTime()}@leadpilot.com`;

  const summary = `Site Visit: ${lead.name} (${lead.property_requirement})`;
  const description = [
    `Lead: ${lead.name}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Location: ${lead.location}`,
    `Requirement: ${lead.property_requirement}`,
    `Budget: ${lead.budget}`,
    `Lead Readiness: ${lead.readiness_pct}%`,
    lead.analysis_json?.summary ? `Summary: ${lead.analysis_json.summary}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LeadPilot//Site Visit Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${lead.location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Triggers a browser download of the .ics file.
 */
export function downloadIcsFile(lead: Lead, slot: TimeSlot): void {
  const content = generateIcsContent(lead, slot);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `Site-Visit-${lead.name.replace(/\s+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Builds a direct Google Calendar Web Link with pre-filled title, dates, and description.
 */
export function buildGoogleCalendarUrl(lead: Lead, slot: TimeSlot): string {
  const title = encodeURIComponent(`Site Visit: ${lead.name} (${lead.property_requirement})`);
  const start = formatIcsDate(slot.startTime);
  const end = formatIcsDate(slot.endTime);
  const dates = `${start}/${end}`;
  const location = encodeURIComponent(lead.location);
  const details = encodeURIComponent(
    `Lead: ${lead.name}\nPhone: ${lead.phone || "None"}\nProperty: ${lead.property_requirement}\nBudget: ${lead.budget}\nNotes: Scheduled via LeadPilot`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${details}`;
}

/**
 * Generates an updated confirmation WhatsApp message incorporating the scheduled slot.
 */
export function buildVisitConfirmationMessage(lead: Lead, slot: TimeSlot): string {
  return `Hi ${lead.name}, confirming our site visit for the ${lead.property_requirement} in ${lead.location} on ${slot.label}. Looking forward to showing you the property!`;
}

