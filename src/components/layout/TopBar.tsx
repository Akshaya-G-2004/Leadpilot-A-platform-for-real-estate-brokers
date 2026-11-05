"use client";
// src/components/layout/TopBar.tsx
import { useApp } from "@/context/AppContext";

export default function TopBar({ onLogout }: { onLogout?: () => void }) {
  const { currentPage, setCurrentPage } = useApp();

  const NAV_ITEMS = [
    { id: "dashboard" as const, label: "Dashboard" },
    { id: "copilot" as const, label: "Lead Copilot" },
    { id: "directory" as const, label: "Leads Directory" },
    { id: "calendar" as const, label: "Calendar" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-indigo-600 px-6 shadow-md border-b border-indigo-700 text-white">
        {/* Brand */}
        <div
          onClick={() => setCurrentPage("dashboard")}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition shrink-0"
        >
          <span className="text-2xl">🚀</span>
          <h1 className="text-lg font-black text-white tracking-tight">LeadPilot</h1>
        </div>

        {/* Center-aligned Navigation Links with proper spacing */}
        <nav className="hidden md:flex items-center justify-center gap-2 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  active
                    ? "bg-white/20 text-white shadow-xs backdrop-blur-xs"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right corner: Logout icon button */}
        <div className="flex items-center justify-end shrink-0 sm:w-[110px]">
          <button
            onClick={onLogout}
            title="Back to frontpage"
            aria-label="Back to frontpage"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition border border-white/20 cursor-pointer shadow-2xs"
          >
            <svg
              className="w-4 h-4 stroke-current fill-none"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Page Switcher */}
      <div className="flex md:hidden bg-indigo-700 px-2 py-1.5 justify-around text-xs font-bold text-white border-b border-indigo-800">
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`py-1 px-3 rounded-lg transition ${
                active ? "bg-white/20 text-white" : "text-white/70"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
