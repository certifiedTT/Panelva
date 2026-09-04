import React from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Flag,
  DollarSign,
  ScrollText,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Sidebar, SidebarItem } from "./Sidebar";

export type AdminRole = "MASTER_ADMIN" | "ADMIN" | "MODERATOR" | "BIZ_OPS";

export type AdminPageId =
  | "overview"
  | "users"
  | "series"
  | "reports"
  | "payouts"
  | "logs";

export interface AdminShellProps {
  children: React.ReactNode;
  activePage: AdminPageId;
  onSelectPage: (page: AdminPageId) => void;
  role: AdminRole;
  adminName?: string;
  onExitConsole?: () => void;
  className?: string;
}

// RBAC Page Matrix per engineering standards:
// - Master Admin: Everything
// - Admin: Operations + Users (Overview, Users, Series)
// - Moderator: Reports & Community (Overview, Reports)
// - Biz Ops: Revenue & Payouts (Overview, Payouts)
const ROLE_ALLOWED_PAGES: Record<AdminRole, AdminPageId[]> = {
  MASTER_ADMIN: ["overview", "users", "series", "reports", "payouts", "logs"],
  ADMIN: ["overview", "users", "series"],
  MODERATOR: ["overview", "reports"],
  BIZ_OPS: ["overview", "payouts"],
};

const ALL_ADMIN_ITEMS: { id: AdminPageId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "series", label: "Series", icon: BookOpen },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "payouts", label: "Payouts", icon: DollarSign },
  { id: "logs", label: "System Logs", icon: ScrollText },
];

export function AdminShell({
  children,
  activePage,
  onSelectPage,
  role,
  adminName = "Console Admin",
  onExitConsole,
  className = "",
}: AdminShellProps) {
  // Filter sidebar items strictly by RBAC: hide inaccessible pages entirely
  const allowedPageIds = ROLE_ALLOWED_PAGES[role] || ["overview"];
  const visibleItems: SidebarItem[] = ALL_ADMIN_ITEMS.filter((item) =>
    allowedPageIds.includes(item.id)
  );

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-950 text-slate-100 ${className}`}>
      {/* Fixed Admin Sidebar with Blue Accent per Design Spec */}
      <Sidebar
        items={visibleItems}
        activeId={activePage}
        onSelect={(id) => onSelectPage(id as AdminPageId)}
        accentColor="blue"
        header={
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Console</span>
              </div>
              {onExitConsole && (
                <button
                  onClick={onExitConsole}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Exit
                </button>
              )}
            </div>
            <p className="truncate text-sm font-semibold text-slate-200">{adminName}</p>
            <span className="inline-block self-start rounded bg-blue-950/80 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-800/40">
              {role.replace("_", " ")}
            </span>
          </div>
        }
      />

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-900/40">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
