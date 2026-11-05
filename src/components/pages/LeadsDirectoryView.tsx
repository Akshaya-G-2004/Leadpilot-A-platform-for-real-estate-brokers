"use client";
// src/components/pages/LeadsDirectoryView.tsx
import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { Lead } from "@/lib/types";
import LeadIntakeModal from "../leads/LeadIntakeModal";

export default function LeadsDirectoryView() {
  const { leads, openLeadInCopilot } = useApp();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // 1. Tag filter
      if (selectedTag !== "all") {
        const isHigh = l.tag === "high" || l.tag === "hot";
        const isMed = l.tag === "medium" || l.tag === "warm";
        const isLow = l.tag === "low" || l.tag === "cold";

        if (selectedTag === "high" && !isHigh) return false;
        if (selectedTag === "medium" && !isMed) return false;
        if (selectedTag === "low" && !isLow) return false;
      }
      // 2. Status filter
      if (selectedStatus !== "all") {
        if (selectedStatus === "New" && (l.status === "new" || l.status === "New")) {
          // match
        } else if (
          selectedStatus === "Visit Scheduled" &&
          (l.status === "visit_scheduled" || l.status === "Visit Scheduled")
        ) {
          // match
        } else if (
          selectedStatus === "Closed" &&
          (l.status === "closed" || l.status === "Closed")
        ) {
          // match
        } else if (l.status !== selectedStatus) {
          return false;
        }
      }
      // 3. Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = l.name.toLowerCase().includes(query);
        const matchesLoc = l.location.toLowerCase().includes(query);
        const matchesProp = l.property_requirement.toLowerCase().includes(query);
        const matchesBudget = l.budget.toLowerCase().includes(query);
        const matchesPhone = l.phone?.toLowerCase().includes(query);
        if (!matchesName && !matchesLoc && !matchesProp && !matchesBudget && !matchesPhone) {
          return false;
        }
      }
      return true;
    });
  }, [leads, search, selectedTag, selectedStatus]);

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-2">
      {/* ── HEADER (HERO BANNER MATCHING DASHBOARD) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads Directory</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Filter and explore all prospects. Click any row to open full Copilot detail & chat.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow hover:bg-indigo-50 transition active:scale-95"
          >
            <span>+</span> Add New Lead
          </button>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR (COMPACT) ── */}
      <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2 shadow-xs">
        <div className="flex flex-col md:flex-row gap-2.5 items-center">
          {/* Search box */}
          <div className="flex-1 w-full relative">
            <span className="absolute left-2.5 top-2 text-indigo-600 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, locality, property, budget, or phone..."
              className="w-full rounded-lg border border-gray-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Tag filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 shrink-0">
            {[
              { id: "all", label: "All" },
              { id: "high", label: "High" },
              { id: "medium", label: "Medium" },
              { id: "low", label: "Low" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSelectedTag(id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  selectedTag === id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium outline-none focus:border-indigo-500 cursor-pointer shrink-0"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Connected – Interested">Connected – Interested</option>
            <option value="Connected – Follow Up Later">Connected – Follow Up Later</option>
            <option value="Connected – Not Interested">Connected – Not Interested</option>
            <option value="Ringing / No Answer">Ringing / No Answer</option>
            <option value="Invalid Number">Invalid Number</option>
            <option value="Visit Scheduled">Visit Scheduled</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* ── RESULTS TABLE / LIST ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No matching leads found. Try clearing your filters or search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-gray-100">
              <thead className="bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-indigo-600">Lead</th>
                  <th className="px-5 py-3 text-indigo-600">Requirement</th>
                  <th className="px-5 py-3 text-indigo-600">Location</th>
                  <th className="px-5 py-3 text-indigo-600">Budget & Timeline</th>
                  <th className="px-5 py-3 text-indigo-600">Priority</th>
                  <th className="px-5 py-3 text-indigo-600">Status</th>
                  <th className="px-5 py-3 text-indigo-600">Readiness</th>
                  <th className="px-5 py-3 text-right text-indigo-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => openLeadInCopilot(lead)}
                    className="hover:bg-indigo-50/50 cursor-pointer transition group"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{lead.name}</div>
                      {lead.phone && <div className="text-[11px] text-gray-400">{lead.phone}</div>}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-medium text-gray-800">{lead.property_requirement || "—"}</span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-gray-600">{lead.location || "—"}</span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-gray-800">{lead.budget || "—"}</div>
                      <div className="text-[11px] text-gray-400">{lead.timeline || "—"}</div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        lead.tag === "high" || lead.tag === "hot"
                          ? "bg-red-100 text-red-700"
                          : lead.tag === "low" || lead.tag === "cold"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {lead.tag === "high" || lead.tag === "hot" ? "HIGH" : lead.tag === "low" || lead.tag === "cold" ? "LOW" : "MEDIUM"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {lead.status === "contacted"
                          ? "Connected – Interested"
                          : lead.status === "visit_scheduled"
                          ? "Visit Scheduled"
                          : lead.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-indigo-700">Score {lead.score}</div>
                      <div className="text-[11px] text-gray-400">{lead.readiness_pct}% Readiness</div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── FOOTER / PAGING INFO ── */}
        <div className="px-5 py-3 border-t border-gray-100 bg-slate-50/70 flex justify-between items-center text-xs text-gray-500 font-semibold">
          <span>Showing {filteredLeads.length} of {leads.length} leads</span>
          <span className="text-[11px] text-gray-400">Click any lead to open Copilot</span>
        </div>
      </div>

      <LeadIntakeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

