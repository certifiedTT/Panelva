import React from "react";
import { BottomNav, BottomNavTabId } from "./BottomNav";

export interface MobileShellProps {
  children: React.ReactNode;
  activeTab?: BottomNavTabId;
  onTabChange?: (tab: BottomNavTabId) => void;
  unreadAlertsCount?: number;
  header?: React.ReactNode;
  hideBottomNav?: boolean;
  className?: string;
}

export function MobileShell({
  children,
  activeTab = "home",
  onTabChange,
  unreadAlertsCount = 0,
  header,
  hideBottomNav = false,
  className = "",
}: MobileShellProps) {
  return (
    <div className={`flex min-h-screen flex-col bg-slate-950 text-slate-100 ${className}`}>
      {header && <div className="w-full">{header}</div>}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      {!hideBottomNav && onTabChange && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          unreadAlertsCount={unreadAlertsCount}
        />
      )}
    </div>
  );
}
