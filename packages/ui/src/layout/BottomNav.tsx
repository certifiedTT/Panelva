import React from "react";
import { Home, BookOpen, Sparkles, Bell, MoreHorizontal } from "lucide-react";

export type BottomNavTabId = "home" | "series" | "creator_hub" | "alerts" | "more";

export interface BottomNavProps {
  activeTab: BottomNavTabId;
  onTabChange: (tab: BottomNavTabId) => void;
  unreadAlertsCount?: number;
  className?: string;
}

export function BottomNav({
  activeTab,
  onTabChange,
  unreadAlertsCount = 0,
  className = "",
}: BottomNavProps) {
  const tabs = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "series" as const, label: "Series", icon: BookOpen },
    { id: "creator_hub" as const, label: "Hub", icon: Sparkles },
    { id: "alerts" as const, label: "Alerts", icon: Bell },
    { id: "more" as const, label: "More", icon: MoreHorizontal },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-800 bg-slate-900/95 px-2 backdrop-blur-md md:hidden ${className}`}
      aria-label="Mobile Navigation"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
              isActive ? "text-blue-500 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
            aria-selected={isActive}
            role="tab"
          >
            <div
              className={`relative flex items-center justify-center rounded-xl px-3 py-1 ${
                isActive ? "bg-blue-600/15" : ""
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {tab.id === "alerts" && unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                  {unreadAlertsCount > 9 ? "9+" : unreadAlertsCount}
                </span>
              )}
            </div>
            <span className="mt-0.5 text-[11px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
