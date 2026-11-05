// src/lib/slots.ts
// Slot generation for Asia/Kolkata timezone (UTC+5:30)

export interface TimeSlot {
  label: string; // e.g. "Thu, 6 Nov · 10:30 AM"
  dateString: string; // "2026-11-06"
  timeString: string; // "10:30 AM"
  startTime: Date;
  endTime: Date;
  offsetDays: number;
}

const TIME_OFFSETS: Record<"morning" | "afternoon" | "evening", { hour: number; minute: number; label: string }> = {
  morning: { hour: 10, minute: 30, label: "10:30 AM" },
  afternoon: { hour: 14, minute: 30, label: "2:30 PM" },
  evening: { hour: 17, minute: 30, label: "5:30 PM" },
};

/**
 * Generates slot recommendations based on lead's preferred_day_offsets and preferred_time_of_day.
 * Falls back to 3 sensible slots (offsets [1, 3, 5] at preferred time) if not specified.
 */
export function generateSlots(
  preferredDayOffsets: number[] = [1, 3, 5],
  preferredTimeOfDay: "morning" | "afternoon" | "evening" = "morning"
): TimeSlot[] {
  const timeConfig = TIME_OFFSETS[preferredTimeOfDay] || TIME_OFFSETS.morning;
  const offsets = preferredDayOffsets.length > 0 ? preferredDayOffsets : [1, 2, 3];

  const now = new Date();

  return offsets.map((offset) => {
    const slotDate = new Date(now);
    slotDate.setDate(slotDate.getDate() + offset);
    slotDate.setHours(timeConfig.hour, timeConfig.minute, 0, 0);

    const endDate = new Date(slotDate);
    endDate.setHours(slotDate.getHours() + 1); // 1-hour site visit duration

    const dateFormatted = slotDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    return {
      label: `${dateFormatted} · ${timeConfig.label}`,
      dateString: slotDate.toISOString().split("T")[0],
      timeString: timeConfig.label,
      startTime: slotDate,
      endTime: endDate,
      offsetDays: offset,
    };
  });
}

