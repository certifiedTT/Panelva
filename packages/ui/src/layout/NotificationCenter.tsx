import React from "react";
import { Bell, CheckCheck } from "lucide-react";

export interface NotificationItem {
  id: string;
  avatarUrl?: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkUrl?: string;
}

export interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAllAsRead?: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
  className?: string;
}

export function NotificationCenter({
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  className = "",
}: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-bold text-slate-100">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List of Notification Cells */}
      <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No notifications at this time.
          </div>
        ) : (
          notifications.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectNotification?.(item)}
              className={`flex w-full items-start space-x-3.5 p-4 text-left transition-colors hover:bg-slate-800/40 ${
                !item.isRead ? "bg-blue-950/10" : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item.title}
                    className="h-10 w-10 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30">
                    <Bell className="h-5 w-5" />
                  </div>
                )}
                {!item.isRead && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-slate-900" />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm truncate ${
                      !item.isRead ? "font-bold text-slate-100" : "font-medium text-slate-300"
                    }`}
                  >
                    {item.title}
                  </p>
                  <span className="text-[11px] text-slate-500 shrink-0">{item.timestamp}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
