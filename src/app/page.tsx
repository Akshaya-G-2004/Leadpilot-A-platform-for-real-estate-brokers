"use client";
// src/app/page.tsx
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import MobileTabs from "@/components/layout/MobileTabs";
import LeadList from "@/components/leads/LeadList";
import DetailHeader from "@/components/detail/DetailHeader";
import ChatPanel from "@/components/chat/ChatPanel";
import DashboardView from "@/components/pages/DashboardView";
import LeadsDirectoryView from "@/components/pages/LeadsDirectoryView";
import CalendarView from "@/components/pages/CalendarView";
import LandingPage from "@/components/pages/LandingPage";
import { AppProvider, useApp } from "@/context/AppContext";
import type { Lead } from "@/lib/types";

function MainApp({ onLogout }: { onLogout: () => void }) {
  const { setLeads, activeTab, currentPage, sidebarOpen, setSidebarOpen, chatOpen, setChatOpen } = useApp();
  const [leftWidth, setLeftWidth] = useState(330);
  const [rightWidth, setRightWidth] = useState(360);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data: { leads: Lead[] }) => setLeads(data.leads ?? []))
      .catch(() => {});
  }, [setLeads]);

  useEffect(() => {
    if (!isDraggingLeft && !isDraggingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = Math.min(Math.max(e.clientX, 220), 520);
        setLeftWidth(newWidth);
      } else if (isDraggingRight) {
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 260), 560);
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDraggingLeft, isDraggingRight]);

  return (
    <main className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <TopBar onLogout={onLogout} />

      {/* ── PAGE 1: DASHBOARD VIEW ── */}
      {currentPage === "dashboard" && <DashboardView />}

      {/* ── PAGE 3: LEADS DIRECTORY VIEW ── */}
      {currentPage === "directory" && <LeadsDirectoryView />}

      {/* ── PAGE 4: SITE VISITS CALENDAR VIEW ── */}
      {currentPage === "calendar" && <CalendarView />}

      {/* ── PAGE 2: LEAD COPILOT VIEW (3 COLUMNS) ── */}
      {currentPage === "copilot" && (
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <MobileTabs />

          {/* Responsive 3-column workspace */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* Column 1 – Lead list */}
            {sidebarOpen ? (
              <>
                <section
                  style={{ width: `${leftWidth}px` }}
                  className={`
                    overflow-y-auto overflow-x-hidden border-r border-gray-200 bg-white
                    max-md:!w-full md:shrink-0
                    ${activeTab === "list" ? "flex flex-col" : "hidden"}
                    md:flex md:flex-col
                  `}
                >
                  <LeadList />
                </section>

                {/* Left Resizer Divider */}
                <div
                  onMouseDown={() => setIsDraggingLeft(true)}
                  className="hidden md:flex items-center justify-center w-1.5 hover:w-2 bg-slate-100 hover:bg-indigo-400 active:bg-indigo-600 cursor-col-resize z-20 shrink-0 transition-colors select-none group border-r border-gray-200"
                  title="Drag to resize Leads panel"
                >
                  <div className="w-[2px] h-6 rounded bg-gray-300 group-hover:bg-white" />
                </div>
              </>
            ) : (
              /* Slim vertical strip to reopen sidebar */
              <div
                onClick={() => setSidebarOpen(true)}
                className="hidden md:flex flex-col items-center py-4 w-7 bg-white border-r border-gray-200 cursor-pointer hover:bg-indigo-50 transition shrink-0 select-none"
                title="Expand Leads (▶)"
              >
                <span className="text-sm font-black mb-3 text-indigo-600">▶</span>
                <span className="text-xs font-black uppercase [writing-mode:vertical-lr] tracking-widest text-indigo-600">
                  Leads
                </span>
              </div>
            )}

            {/* Column 2 – Detail view */}
            <section
              className={`
                overflow-y-auto border-r border-gray-200 bg-slate-50
                flex-1 min-w-0
                ${activeTab === "detail" ? "flex flex-col" : "hidden"}
                md:flex md:flex-col
              `}
            >
              <DetailHeader />
            </section>

            {/* Column 3 – Chat */}
            {chatOpen ? (
              <>
                {/* Right Resizer Divider */}
                <div
                  onMouseDown={() => setIsDraggingRight(true)}
                  className="hidden lg:flex items-center justify-center w-1.5 hover:w-2 bg-slate-100 hover:bg-indigo-400 active:bg-indigo-600 cursor-col-resize z-20 shrink-0 transition-colors select-none group border-l border-gray-200"
                  title="Drag to resize Chat panel"
                >
                  <div className="w-[2px] h-6 rounded bg-gray-300 group-hover:bg-white" />
                </div>

                <section
                  style={{ width: `${rightWidth}px` }}
                  className={`
                    overflow-hidden bg-white
                    max-lg:!w-full lg:shrink-0
                    ${activeTab === "chat" ? "flex flex-col" : "hidden"}
                    lg:flex lg:flex-col
                  `}
                >
                  <ChatPanel />
                </section>
              </>
            ) : (
              /* Slim vertical strip to reopen chat */
              <div
                onClick={() => setChatOpen(true)}
                className="hidden lg:flex flex-col items-center py-4 w-7 bg-indigo-500 border-l border-indigo-400 cursor-pointer hover:bg-indigo-600 transition text-white shadow-xs shrink-0 select-none"
                title="Open AI Chat (💬)"
              >
                <span className="text-sm mb-3 text-white">💬</span>
                <span className="text-xs font-black uppercase [writing-mode:vertical-lr] tracking-widest text-white">
                  Chat
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <AppProvider>
      {!hasStarted ? (
        <LandingPage onStart={() => setHasStarted(true)} />
      ) : (
        <MainApp onLogout={() => setHasStarted(false)} />
      )}
    </AppProvider>
  );
}
