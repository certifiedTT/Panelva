"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Shield,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkspaceNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: "default" | "success" | "warning" | "error" | "info";
  authorized?: boolean;
}

export interface WorkspaceNavGroup {
  id: string;
  label: string;
  items: WorkspaceNavItem[];
}

interface WorkspaceLayoutProps {
  type: "creator" | "admin";
  title: string;
  contextSubtitle?: string;
  user?: {
    username?: string;
    penName?: string;
    avatarUrl?: string;
    role?: string;
  };
  roleBadge?: string;
  groups: WorkspaceNavGroup[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onClose?: () => void;
  children: React.ReactNode;
}

export function WorkspaceLayout({
  type,
  title,
  contextSubtitle,
  user,
  roleBadge,
  groups,
  activeTab,
  onSelectTab,
  onClose,
  children,
}: WorkspaceLayoutProps) {
  const router = useRouter();

  // Desktop sidebar collapse state (saved in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  // Mobile off-canvas drawer open state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`panelva_ws_collapsed_${type}`);
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    } catch {}
  }, [type]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`panelva_ws_collapsed_${type}`, String(next));
      } catch {}
      return next;
    });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/");
    }
  };

  const handleSelectNav = (tabId: string) => {
    onSelectTab(tabId);
    setIsMobileDrawerOpen(false);
  };

  const isCreator = type === "creator";
  const userIdentifier = isCreator
    ? user?.penName || user?.username || "Creator"
    : user?.username || "Admin";

  const contextTitle = isCreator
    ? `Creator Studio • @${userIdentifier}`
    : `Admin Console • ${roleBadge || "Operations"}`;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07080a] text-zinc-100 font-sans selection:bg-blue-500/30 selection:text-white">
      {/* ─── 1. Persistent Top Workspace Header ─── */}
      <header className="h-14 border-b border-[#1c1e24] bg-[#0c0d12]/95 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0 select-none">
        {/* Left: Hamburger Toggle & Platform Brand */}
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Open Navigation"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Button */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Panelva Minimal Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-black tracking-tight text-white italic hover:opacity-80 transition-opacity"
          >
            <span>panelva</span>
            <span className="text-[10px] not-italic px-1.5 py-0.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider">
              {isCreator ? "Studio" : "Admin"}
            </span>
          </Link>
        </div>

        {/* Center: Context Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-200">{contextTitle}</span>
          {contextSubtitle && (
            <span className="text-zinc-500 text-[11px] font-normal">
              • {contextSubtitle}
            </span>
          )}
        </div>

        {/* Right: User Avatar, Role Badge & Exit Button */}
        <div className="flex items-center gap-3">
          {/* Role / Tier Badge */}
          {roleBadge && (
            <div
              className={cn(
                "hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                isCreator
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-purple-500/10 text-purple-400 border-purple-500/20"
              )}
            >
              {isCreator ? (
                <Sparkles className="w-3 h-3" />
              ) : (
                <Shield className="w-3 h-3" />
              )}
              <span>{roleBadge}</span>
            </div>
          )}

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/10 flex items-center justify-center text-xs font-black text-white shadow-inner">
            {userIdentifier.charAt(0).toUpperCase()}
          </div>

          {/* Exit / Close Workspace Button */}
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 text-zinc-400 transition-colors flex items-center gap-1.5 px-2.5 text-xs font-bold"
            title="Exit Workspace"
            aria-label="Exit Workspace"
          >
            <span className="hidden sm:inline">Exit</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── 2. Main Workspace Body ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ─── 2A. Desktop Collapsible Left Sidebar ─── */}
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r border-[#1c1e24] bg-[#0c0d12]/60 backdrop-blur-sm transition-all duration-300 ease-in-out shrink-0 select-none z-20 overflow-y-auto overflow-x-hidden",
            isSidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex-1 py-4 px-2 flex flex-col gap-6">
            {groups.map((group) => {
              const visibleItems = group.items.filter(
                (item) => item.authorized !== false
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.id} className="flex flex-col gap-1">
                  {!isSidebarCollapsed && (
                    <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                      {group.label}
                    </div>
                  )}

                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl transition-all duration-150 text-xs font-semibold",
                          isSidebarCollapsed
                            ? "w-11 h-11 justify-center mx-auto"
                            : "w-full px-3 py-2.5 justify-between",
                          isActive
                            ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                        )}
                        title={isSidebarCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              "w-4 h-4 shrink-0 transition-colors",
                              isActive
                                ? "text-blue-400"
                                : "text-zinc-400 group-hover:text-zinc-200"
                            )}
                          />
                          {!isSidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>

                        {/* Badges / Active Indicators */}
                        {!isSidebarCollapsed && item.badge !== undefined && (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold",
                              item.badgeVariant === "error"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : item.badgeVariant === "warning"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Collapsed Active Indicator Pill */}
                        {isSidebarCollapsed && isActive && (
                          <span className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ─── 2B. Mobile Off-Canvas Drawer Backdrop & Container ─── */}
        {isMobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Off-canvas Drawer */}
            <div className="relative w-72 max-w-[85vw] h-full bg-[#0d0e13] border-r border-[#1c1e24] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#1c1e24] flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {title}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    @{userIdentifier}
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Nav Items */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-5">
                {groups.map((group) => {
                  const visibleItems = group.items.filter(
                    (item) => item.authorized !== false
                  );
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={group.id} className="flex flex-col gap-1">
                      <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                        {group.label}
                      </div>

                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectNav(item.id)}
                            className={cn(
                              "w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors",
                              isActive
                                ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                                : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon
                                className={cn(
                                  "w-4 h-4 shrink-0",
                                  isActive ? "text-blue-400" : "text-zinc-400"
                                )}
                              />
                              <span>{item.label}</span>
                            </div>

                            {item.badge !== undefined && (
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                  item.badgeVariant === "error"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : item.badgeVariant === "warning"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-[#1c1e24]">
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 text-zinc-400 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit Workspace</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── 2C. Main Content Viewport ─── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#07080a]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
