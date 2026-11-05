"use client";
// src/components/leads/LeadList.tsx
import { useEffect, useState } from "react";
import type { Lead } from "@/lib/types";
import LeadCard from "./LeadCard";
import LeadIntakeModal from "./LeadIntakeModal";
import { useApp } from "@/context/AppContext";

export default function LeadList() {
  const { selectLead, selectedLead, leads, setLeads, setSidebarOpen } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<"all" | "hot" | "warm" | "cold">("all");

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setLeads(data.leads ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [setLeads]);

  const filteredLeads = leads.filter((lead) => {
    // 1. Exclude closed leads from Lead Copilot left panel
    if (lead.status === "closed" || lead.status === "Closed") return false;

    // 2. Tag filter
    if (selectedTag !== "all") {
      const isHigh = lead.tag === "high" || lead.tag === "hot";
      const isMed = lead.tag === "medium" || lead.tag === "warm";
      const isLow = lead.tag === "low" || lead.tag === "cold";

      if (selectedTag === "hot" && !isHigh) return false;
      if (selectedTag === "warm" && !isMed) return false;
      if (selectedTag === "cold" && !isLow) return false;
    }

    // 3. Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesName = lead.name.toLowerCase().includes(q);
      const matchesLoc = lead.location.toLowerCase().includes(q);
      const matchesBudget = lead.budget.toLowerCase().includes(q);
      const matchesReq = lead.property_requirement?.toLowerCase().includes(q);
      if (!matchesName && !matchesLoc && !matchesBudget && !matchesReq) return false;
    }
    return true;
  });

  if (loading)
    return (
      <div className="flex flex-col gap-2.5 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-xs border-l-4 border-gray-200 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-4 w-12 rounded-full bg-gray-200" />
            </div>
            <div className="h-3 w-44 rounded bg-gray-100 mt-1" />
            <div className="h-3 w-56 rounded bg-gray-100" />
            <div className="flex items-center gap-2 mt-2">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1 h-2 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-4 text-sm text-red-500">Error: {error}</div>
    );

  return (
    <>
      <div className="flex flex-col gap-2 p-3 w-full overflow-x-hidden">
        {/* Header with intake action & collapse toggle */}
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Leads ({filteredLeads.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              + Add Lead
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="hidden md:flex h-6 w-6 rounded-md hover:bg-gray-100 items-center justify-center text-gray-400 hover:text-gray-700 transition"
              title="Collapse Leads Panel"
            >
              ◀
            </button>
          </div>
        </div>

        {/* Small Search Bar */}
        <div className="relative">
          <span className="absolute left-2.5 top-2 text-indigo-600 flex items-center pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads..."
            className="w-full rounded-lg border border-gray-200 bg-slate-50 pl-7 pr-6 py-1 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1 text-gray-400 hover:text-gray-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Small High / Medium / Low Filter */}
        <div className="flex items-center gap-1">
          {[
            { id: "all" as const, label: "All" },
            { id: "hot" as const, label: "High" },
            { id: "warm" as const, label: "Medium" },
            { id: "cold" as const, label: "Low" },
          ].map(({ id, label }) => {
            const active = selectedTag === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedTag(id)}
                className={`flex-1 rounded-md py-1 text-[10px] font-bold transition text-center ${
                  active
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">No matching leads.</div>
        ) : (
          filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isSelected={selectedLead?.id === lead.id}
              onSelect={() => selectLead(lead)}
            />
          ))
        )}
      </div>

      <LeadIntakeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
