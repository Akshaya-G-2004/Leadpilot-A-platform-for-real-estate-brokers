"use client";
// src/context/AppContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Lead } from "@/lib/types";
import type { ChatMessage } from "@/lib/ai/chatSchema";

interface AppState {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  selectedLead: Lead | null;
  selectLead: (lead: Lead) => void;
  updateLeadStatus: (leadId: string, status: Lead["status"]) => void;
  updateLead: (updatedData: Partial<Lead> & { id: string; scheduled_visit?: any }) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  // main page navigation
  currentPage: "dashboard" | "copilot" | "directory" | "calendar";
  setCurrentPage: (page: "dashboard" | "copilot" | "directory" | "calendar") => void;
  openLeadInCopilot: (lead: Lead) => void;
  // panel collapse state
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatOpen: boolean;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // mobile tab state
  activeTab: "list" | "detail" | "chat";
  setActiveTab: (tab: "list" | "detail" | "chat") => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPageState] = useState<"dashboard" | "copilot" | "directory" | "calendar">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "chat">("list");

  // Synchronize selectedLead if leads array updates (e.g. recalculation, reload)
  useEffect(() => {
    if (selectedLead && leads.length > 0) {
      const match = leads.find((l) => l.id === selectedLead.id);
      if (
        match &&
        (match.score !== selectedLead.score ||
          match.tag !== selectedLead.tag ||
          match.readiness_pct !== selectedLead.readiness_pct ||
          match.status !== selectedLead.status ||
          match.timeline !== selectedLead.timeline ||
          JSON.stringify(match.analysis_json) !== JSON.stringify(selectedLead.analysis_json))
      ) {
        setSelectedLead(match);
      }
    }
  }, [leads, selectedLead]);

  // Sync initial page from URL on mount & listen to browser Back/Forward
  useEffect(() => {
    const syncPageFromUrl = () => {
      const path = window.location.pathname.replace(/^\/|\/$/g, "");
      if (path === "dashboard" || path === "copilot" || path === "directory" || path === "calendar") {
        setCurrentPageState(path);
      } else if (path === "") {
        window.history.replaceState(null, "", "/dashboard");
        setCurrentPageState("dashboard");
      }
    };

    syncPageFromUrl();
    window.addEventListener("popstate", syncPageFromUrl);
    return () => window.removeEventListener("popstate", syncPageFromUrl);
  }, []);

  const setCurrentPage = useCallback((page: "dashboard" | "copilot" | "directory" | "calendar") => {
    setCurrentPageState(page);
    if (typeof window !== "undefined" && window.location.pathname !== `/${page}`) {
      window.history.pushState(null, "", `/${page}`);
    }
  }, []);

  const selectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setMessages([]);
    setActiveTab("detail"); // auto-switch to detail on mobile
  }, []);

  const openLeadInCopilot = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setMessages([]);
    setCurrentPage("copilot");
    setActiveTab("detail");
  }, []);

  const updateLeadStatus = useCallback(
    (leadId: string, status: Lead["status"]) => {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status } : l))
      );
      setSelectedLead((prev) =>
        prev?.id === leadId ? { ...prev, status } : prev
      );

      // Persist to Turso DB
      fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status }),
      }).catch((err) => console.error("Failed to persist lead status:", err));
    },
    []
  );

  const updateLead = useCallback(
    (updatedData: Partial<Lead> & { id: string; scheduled_visit?: any }) => {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id === updatedData.id) {
            let updatedAnalysis = updatedData.analysis_json || l.analysis_json;
            if (updatedData.scheduled_visit) {
              updatedAnalysis = { ...updatedAnalysis, scheduled_visit: updatedData.scheduled_visit };
            }
            return { ...l, ...updatedData, analysis_json: updatedAnalysis as any };
          }
          return l;
        })
      );
      setSelectedLead((prev) => {
        if (prev?.id === updatedData.id) {
          let updatedAnalysis = updatedData.analysis_json || prev.analysis_json;
          if (updatedData.scheduled_visit) {
            updatedAnalysis = { ...updatedAnalysis, scheduled_visit: updatedData.scheduled_visit };
          }
          return { ...prev, ...updatedData, analysis_json: updatedAnalysis as any };
        }
        return prev;
      });

      // Persist to Turso DB & sync re-analyzed lead if returned
      fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.lead) {
            setLeads((prev) => prev.map((l) => (l.id === data.lead.id ? { ...l, ...data.lead } : l)));
            setSelectedLead((prev) => (prev?.id === data.lead.id ? { ...prev, ...data.lead } : prev));
          }
        })
        .catch((err) => console.error("Failed to persist lead update:", err));
    },
    []
  );

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        openLeadInCopilot,
        sidebarOpen,
        setSidebarOpen,
        chatOpen,
        setChatOpen,
        leads,
        setLeads,
        selectedLead,
        selectLead,
        updateLeadStatus,
        updateLead,
        messages,
        setMessages,
        addMessage,
        clearMessages,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
