"use client";
// src/components/layout/MobileTabs.tsx
import { useApp } from "@/context/AppContext";

const tabs = [
  { id: "list" as const, label: "Leads", icon: "👥" },
  { id: "detail" as const, label: "Detail", icon: "📋" },
  { id: "chat" as const, label: "Chat", icon: "💬" },
];

export default function MobileTabs() {
  const { activeTab, setActiveTab, selectedLead } = useApp();

  return (
    <nav className="flex border-b border-gray-200 bg-white md:hidden">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = (tab.id === "detail" || tab.id === "chat") && !selectedLead;
        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && setActiveTab(tab.id)}
            disabled={isDisabled}
            className={`flex flex-1 flex-col items-center py-2.5 text-xs font-medium transition-colors
              ${isActive ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"}
              ${isDisabled ? "opacity-30 cursor-not-allowed" : "hover:text-indigo-500"}
            `}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

