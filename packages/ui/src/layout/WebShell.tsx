import React from "react";
import { TopBar, TopBarProps } from "./TopBar";
import { Sidebar, SidebarItem } from "./Sidebar";

export interface WebShellProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (path: string) => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  unreadCount?: number;
  userAvatarUrl?: string;
  sidebarItems?: SidebarItem[];
  activeSidebarId?: string;
  onSelectSidebarItem?: (id: string) => void;
  className?: string;
}

export function WebShell({
  children,
  activePath = "/",
  onNavigate,
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
  unreadCount = 0,
  userAvatarUrl,
  sidebarItems,
  activeSidebarId,
  onSelectSidebarItem,
  className = "",
}: WebShellProps) {
  return (
    <div className={`flex min-h-screen flex-col bg-slate-950 text-slate-100 ${className}`}>
      <TopBar
        activePath={activePath}
        onNavigate={onNavigate}
        onOpenSearch={onOpenSearch}
        onOpenNotifications={onOpenNotifications}
        onOpenProfile={onOpenProfile}
        unreadCount={unreadCount}
        userAvatarUrl={userAvatarUrl}
      />

      <div className="flex flex-1 overflow-hidden">
        {sidebarItems && activeSidebarId && onSelectSidebarItem && (
          <Sidebar
            items={sidebarItems}
            activeId={activeSidebarId}
            onSelect={onSelectSidebarItem}
            className="hidden lg:flex"
          />
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
