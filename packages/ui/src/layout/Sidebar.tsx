import React from "react";

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

export interface SidebarProps {
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  accentColor?: "blue" | "purple";
  className?: string;
}

export function Sidebar({
  items,
  activeId,
  onSelect,
  header,
  footer,
  accentColor = "blue",
  className = "",
}: SidebarProps) {
  const activeClass =
    "bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-500";

  return (
    <aside
      className={`flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950 px-3 py-4 select-none ${className}`}
    >
      {header && <div className="mb-6 px-3">{header}</div>}

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? activeClass
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-4 w-4 ${isActive ? "" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {footer && <div className="mt-auto pt-4 border-t border-slate-800 px-3">{footer}</div>}
    </aside>
  );
}
