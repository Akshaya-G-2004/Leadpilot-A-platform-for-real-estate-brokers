// src/components/leads/LeadCard.tsx
import type { Lead } from "@/lib/types";

export default function LeadCard({
  lead,
  onSelect,
  isSelected,
}: {
  lead: Lead;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}) {
  const tagColor = (
    {
      high: "border-red-500",
      medium: "border-amber-500",
      low: "border-sky-500",
      hot: "border-red-500",
      warm: "border-amber-500",
      cold: "border-sky-500",
    } as Record<string, string>
  )[lead.tag] || "border-gray-300";

  const tagBadge = (
    {
      high: "bg-red-100 text-red-700",
      medium: "bg-amber-100 text-amber-700",
      low: "bg-sky-100 text-sky-700",
      hot: "bg-red-100 text-red-700",
      warm: "bg-amber-100 text-amber-700",
      cold: "bg-sky-100 text-sky-700",
    } as Record<string, string>
  )[lead.tag] || "bg-gray-100 text-gray-700";

  const tagLabel = (
    {
      high: "HIGH",
      medium: "MEDIUM",
      low: "LOW",
      hot: "HIGH",
      warm: "MEDIUM",
      cold: "LOW",
    } as Record<string, string>
  )[lead.tag] || "MEDIUM";

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "new":
      case "New":
        return { label: "New", color: "bg-slate-100 text-slate-700 border-slate-200" };
      case "contacted":
      case "Connected – Interested":
        return { label: "Interested", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "Connected – Follow Up Later":
        return { label: "Follow Up", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "Connected – Not Interested":
        return { label: "Not Interested", color: "bg-red-50 text-red-700 border-red-200" };
      case "Ringing / No Answer":
        return { label: "No Answer", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "Invalid Number":
        return { label: "Invalid", color: "bg-zinc-100 text-zinc-600 border-zinc-200" };
      case "visit_scheduled":
      case "Visit Scheduled":
        return { label: "Visit Sched.", color: "bg-indigo-100 text-indigo-700 border-indigo-200" };
      case "closed":
      case "Closed":
        return { label: "Closed", color: "bg-zinc-100 text-zinc-700 border-zinc-200" };
      default:
        return { label: status, color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    }
  };

  const statusInfo = getStatusInfo(lead.status);

  return (
    <div
      onClick={() => onSelect(lead.id)}
      className={`w-full text-left cursor-pointer border-l-4 ${tagColor} rounded-xl bg-white p-2.5 shadow-xs transition-all ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-50/20 shadow-sm" : "hover:shadow-md hover:border-l-indigo-500"
        }`}
    >
      {/* Top line: Name and Priority Tag */}
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <h4 className="text-xs font-bold text-gray-900 truncate">{lead.name}</h4>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${tagBadge}`}>
          {tagLabel}
        </span>
      </div>

      {/* Second line: Location, Budget and Status Pill */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500">
        <span className="truncate">
          {lead.location} • {lead.budget}
        </span>
        <span className={`shrink-0 px-1.5 py-0.2 text-[9px] font-semibold rounded-md border ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Priority Reason (if available) */}
      {lead.analysis_json?.priority_reason && (
        <p className="text-[10px] text-gray-500 line-clamp-1 italic mt-1 pt-1 border-t border-gray-100">
          "{lead.analysis_json.priority_reason}"
        </p>
      )}
    </div>
  );
}
