import {
  Home,
  BookOpen,
  BarChart3,
  Wallet,
  Users,
  Settings,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Sidebar, SidebarItem } from "./Sidebar";

export type CreatorStudioTab =
  | "dashboard"
  | "series"
  | "analytics"
  | "revenue"
  | "membership"
  | "stickers"
  | "community"
  | "settings";

export interface CreatorShellProps {
  children: React.ReactNode;
  activeTab: CreatorStudioTab;
  onTabChange: (tab: CreatorStudioTab) => void;
  creatorName?: string;
  onExitStudio?: () => void;
  className?: string;
}

export function CreatorShell({
  children,
  activeTab,
  onTabChange,
  creatorName = "Creator Studio",
  onExitStudio,
  className = "",
}: CreatorShellProps) {
  const sidebarItems: SidebarItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "series", label: "Series", icon: BookOpen },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "revenue", label: "Monetization", icon: Wallet },
    { id: "membership", label: "Membership", icon: Users },
    { id: "stickers", label: "Sticker Packs", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-950 text-slate-100 ${className}`}>
      {/* Permanent Fixed Sidebar */}
      <Sidebar
        items={sidebarItems}
        activeId={activeTab}
        onSelect={(id) => onTabChange(id as CreatorStudioTab)}
        accentColor="blue"
        header={
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Studio
              </span>
              {onExitStudio && (
                <button
                  onClick={onExitStudio}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Exit
                </button>
              )}
            </div>
            <h2 className="truncate text-base font-bold text-slate-100">{creatorName}</h2>
          </div>
        }
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-900/40">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
