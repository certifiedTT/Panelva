import React from "react";
import { Search, Bell, User } from "lucide-react";

export interface TopBarProps {
  activePath?: string;
  onNavigate?: (path: string) => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  unreadCount?: number;
  userAvatarUrl?: string;
  className?: string;
}

export function TopBar({
  activePath = "/",
  onNavigate,
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
  unreadCount = 0,
  userAvatarUrl,
  className = "",
}: TopBarProps) {
  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Series", path: "/series" },
    { label: "Creator Hub", path: "/hub" },
  ];

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 backdrop-blur-md ${className}`}
    >
      {/* Brand & Main Links */}
      <div className="flex items-center space-x-8">
        <button
          onClick={() => onNavigate?.("/")}
          className="flex items-center space-x-2.5 focus:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
            P
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Panelva</span>
        </button>

        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = activePath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => onNavigate?.(link.path)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-blue-400 bg-blue-600/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Actions: Search, Notifications, Profile */}
      <div className="flex items-center space-x-3">
        {/* Search trigger button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
          aria-label="Open global search"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search series, creators...</span>
          <kbd className="hidden sm:inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            /
          </kbd>
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={onOpenProfile}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 transition-colors hover:border-slate-500"
          aria-label="User Profile"
        >
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt="User Avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-slate-300" />
          )}
        </button>
      </div>
    </header>
  );
}
