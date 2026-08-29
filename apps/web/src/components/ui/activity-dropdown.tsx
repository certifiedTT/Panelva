"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Bell, Info, CreditCard, Sparkles, MessageSquare, Crown, 
  ShieldAlert, Lock, Heart, BookOpen, Compass, Handshake, 
  Trophy, Check, X, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

// Notification Category Types
export type NotificationType = 
  | "SYSTEM" 
  | "PAYMENT" 
  | "CREATOR" 
  | "SOCIAL" 
  | "MEMBERSHIP" 
  | "ADMIN" 
  | "SECURITY" 
  | "ENGAGEMENT" 
  | "CONTENT" 
  | "DISCOVERY" 
  | "COLLABORATION" 
  | "ACHIEVEMENT";

export interface ActivityItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  image?: string;
  actionUrl?: string;
  category: "INVITATION" | "CREATOR_NOTIFICATION" | "LOCAL_NOTIFICATION";
  rawItem: any;
}

interface ActivityDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  items: ActivityItem[];
  onMarkRead: (id: string, category: ActivityItem["category"]) => void;
  onMarkAllRead: () => void;
  onOpenInvitation: (invitation: any) => void;
  onRespondInvitation: (id: string, response: "ACCEPT" | "DECLINE") => void;
}

// Icon mapping helper
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "SYSTEM":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "PAYMENT":
      return <CreditCard className="h-4 w-4 text-emerald-500" />;
    case "CREATOR":
      return <Sparkles className="h-4 w-4 text-purple-500" />;
    case "SOCIAL":
      return <MessageSquare className="h-4 w-4 text-sky-500" />;
    case "MEMBERSHIP":
      return <Crown className="h-4 w-4 text-amber-500" />;
    case "ADMIN":
      return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    case "SECURITY":
      return <Lock className="h-4 w-4 text-yellow-500" />;
    case "ENGAGEMENT":
      return <Heart className="h-4 w-4 text-red-500 fill-red-500/20" />;
    case "CONTENT":
      return <BookOpen className="h-4 w-4 text-indigo-500" />;
    case "DISCOVERY":
      return <Compass className="h-4 w-4 text-teal-500" />;
    case "COLLABORATION":
      return <Handshake className="h-4 w-4 text-blue-400" />;
    case "ACHIEVEMENT":
      return <Trophy className="h-4 w-4 text-yellow-400" />;
    default:
      return <Bell className="h-4 w-4 text-zinc-400" />;
  }
};

export function formatRelativeTime(dateInput: Date | string | number): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (isNaN(date.getTime())) {
    // If it's already a relative format like "Just now" or "2 hours ago", return directly
    return String(dateInput);
  }
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return `${diffDays} days ago`;
  }
}

export default function ActivityDropdown({
  isOpen,
  onClose,
  items,
  onMarkRead,
  onMarkAllRead,
  onOpenInvitation,
  onRespondInvitation
}: ActivityDropdownProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Filter items based on selected tab
  const filteredItems = items.filter(item => {
    if (activeTab === "unread") {
      return !item.isRead;
    }
    return true;
  });

  // Focus management inside dropdown for keyboard accessibility
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen, activeTab]);

  // Handle keyboard events (Arrows, Escape, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const selectedItem = filteredItems[focusedIndex];
        if (selectedItem) {
          handleItemClick(selectedItem);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, focusedIndex, onClose]);

  // Focus trap: keep focus inside when tabbing
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleTabTrap);
    return () => window.removeEventListener("keydown", handleTabTrap);
  }, [isOpen]);

  // Sync scroll focus
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      const focusedItem = items[focusedIndex] as HTMLElement;
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [focusedIndex]);

  const handleItemClick = (item: ActivityItem) => {
    if (!item.isRead) {
      onMarkRead(item.id, item.category);
    }
    
    if (item.category === "INVITATION") {
      onOpenInvitation(item.rawItem);
      onClose();
    } else if (item.actionUrl) {
      window.location.href = item.actionUrl;
      onClose();
    }
  };

  const hasUnread = items.some(item => !item.isRead);

  // Framer Motion animation variants
  const dropdownVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: -12 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as any }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.15, ease: [0.7, 0, 0.84, 0] as any }
    }
  };

  const mobileDrawerVariants: Variants = {
    hidden: { y: "100%", opacity: 0.8 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 220 }
    },
    exit: { 
      y: "100%", 
      opacity: 0.8,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for mobile to close when clicked outside */}
          <motion.div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Desktop/Tablet absolute dropdown */}
          <motion.div
            ref={containerRef}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-label="Activity Center"
            className={cn(
              "absolute right-0 mt-3 z-50 w-96 max-h-[580px] hidden sm:flex flex-col",
              "glass-panel overflow-hidden border border-white/10 bg-[#0c0d12]/95 shadow-2xl",
              "[.light-theme_&]:bg-white/95 [.light-theme_&]:border-zinc-200"
            )}
          >
            {/* Arrow Pointer */}
            <div className="absolute top-0 right-5 -mt-1.5 h-3 w-3 rotate-45 border-l border-t border-white/10 bg-[#0c0d12] [.light-theme_&]:bg-white [.light-theme_&]:border-zinc-200" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-4 [.light-theme_&]:border-zinc-100">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-white [.light-theme_&]:text-zinc-900">Activity</h3>
                {hasUnread && (
                  <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
              {hasUnread && (
                <button 
                  onClick={onMarkAllRead}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition [.light-theme_&]:hover:text-blue-600"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 p-1 bg-white/5 [.light-theme_&]:bg-zinc-100 [.light-theme_&]:border-zinc-100">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                  activeTab === "all" 
                    ? "bg-[#0b0c10] text-white shadow-md [.light-theme_&]:bg-white [.light-theme_&]:text-zinc-900" 
                    : "text-zinc-400 hover:text-white [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
                )}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                  activeTab === "unread" 
                    ? "bg-[#0b0c10] text-white shadow-md [.light-theme_&]:bg-white [.light-theme_&]:text-zinc-900" 
                    : "text-zinc-400 hover:text-white [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
                )}
              >
                Unread
                {items.filter(i => !i.isRead).length > 0 && (
                  <span className="bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none">
                    {items.filter(i => !i.isRead).length}
                  </span>
                )}
              </button>
            </div>

            {/* Notifications Feed */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto max-h-[400px] p-2 space-y-1 scrollbar-thin"
              role="list"
            >
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3 [.light-theme_&]:bg-zinc-150">
                    <Bell className="h-5 w-5 text-zinc-500" />
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">No notifications found</p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      role="listitem"
                      tabIndex={0}
                      className={cn(
                        "group relative flex gap-3 p-3 rounded-xl cursor-pointer transition border border-transparent outline-none",
                        "hover:bg-white/5 hover:border-white/5",
                        "[.light-theme_&]:hover:bg-zinc-50 [.light-theme_&]:hover:border-zinc-100",
                        !item.isRead && "bg-blue-500/5 hover:bg-blue-500/10 [.light-theme_&]:bg-blue-50/50 [.light-theme_&]:hover:bg-blue-50",
                        focusedIndex === idx && "bg-white/5 border-white/5 [.light-theme_&]:bg-zinc-50 [.light-theme_&]:border-zinc-100"
                      )}
                    >
                      {/* Left: Icon or Avatar */}
                      <div className="flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt=""
                            className="h-9 w-9 rounded-full object-cover border border-white/10 [.light-theme_&]:border-zinc-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/5 [.light-theme_&]:bg-zinc-100 [.light-theme_&]:border-zinc-200">
                            {getNotificationIcon(item.type)}
                          </div>
                        )}
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold tracking-wider text-blue-500 uppercase">
                            {item.type}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium">•</span>
                          <span className="text-[10px] text-zinc-500 font-semibold">{item.time}</span>
                        </div>
                        <p className={cn(
                          "text-xs mt-1 text-white leading-snug [.light-theme_&]:text-zinc-900 truncate-2-lines",
                          !item.isRead ? "font-bold text-white [.light-theme_&]:text-zinc-900" : "font-normal text-zinc-300 [.light-theme_&]:text-zinc-650"
                        )}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-normal [.light-theme_&]:text-zinc-500 truncate-2-lines">
                          {item.description}
                        </p>

                        {/* Special Invitation Actions */}
                        {item.category === "INVITATION" && (
                          <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onRespondInvitation(item.id, "ACCEPT")}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold shadow-lg shadow-blue-600/10 flex items-center gap-1 transition"
                            >
                              <Check className="h-3 w-3" /> Accept
                            </button>
                            <button
                              onClick={() => onRespondInvitation(item.id, "DECLINE")}
                              className="px-3 py-1 bg-white/10 hover:bg-white/15 text-zinc-300 rounded-md text-[10px] font-bold border border-white/5 transition [.light-theme_&]:bg-zinc-100 [.light-theme_&]:text-zinc-700 [.light-theme_&]:hover:bg-zinc-200 [.light-theme_&]:border-zinc-200"
                            >
                              <X className="h-3 w-3" /> Decline
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Unread Indicator Dot / Mark Read trigger */}
                      <div className="flex-shrink-0 flex items-center justify-center w-4">
                        {!item.isRead && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkRead(item.id, item.category);
                            }}
                            title="Mark as read"
                            className="h-2 w-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" 
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Mobile bottom drawer list */}
          <motion.div
            variants={mobileDrawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-label="Activity Center"
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/10 bg-[#0c0d12]/95 backdrop-blur-md p-4 flex sm:hidden flex-col max-h-[85vh] shadow-2xl",
              "[.light-theme_&]:bg-white/95 [.light-theme_&]:border-zinc-200"
            )}
          >
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4 [.light-theme_&]:bg-zinc-200" />

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white [.light-theme_&]:text-zinc-900">Activity</h3>
                {hasUnread && (
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasUnread && (
                  <button 
                    onClick={onMarkAllRead}
                    className="text-xs font-bold text-blue-500"
                  >
                    Mark all read
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center [.light-theme_&]:bg-zinc-100"
                >
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 p-1 bg-white/5 rounded-lg mb-3 [.light-theme_&]:bg-zinc-100 [.light-theme_&]:border-zinc-150">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                  activeTab === "all" 
                    ? "bg-[#0b0c10] text-white [.light-theme_&]:bg-white [.light-theme_&]:text-zinc-900" 
                    : "text-zinc-400"
                )}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5",
                  activeTab === "unread" 
                    ? "bg-[#0b0c10] text-white [.light-theme_&]:bg-white [.light-theme_&]:text-zinc-900" 
                    : "text-zinc-400"
                )}
              >
                Unread
                {items.filter(i => !i.isRead).length > 0 && (
                  <span className="bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none">
                    {items.filter(i => !i.isRead).length}
                  </span>
                )}
              </button>
            </div>

            {/* Notifications Feed */}
            <div className="flex-1 overflow-y-auto space-y-2 pb-6">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3 [.light-theme_&]:bg-zinc-100">
                    <Bell className="h-5 w-5 text-zinc-500" />
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">No notifications found</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex gap-3 p-3 rounded-xl border border-white/5 bg-white/5",
                      "[.light-theme_&]:bg-zinc-50 [.light-theme_&]:border-zinc-150",
                      !item.isRead && "border-blue-500/20 bg-blue-500/5 [.light-theme_&]:border-blue-500/10 [.light-theme_&]:bg-blue-50/40"
                    )}
                  >
                    {/* Left: Icon or Avatar */}
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt=""
                          className="h-9 w-9 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/5 [.light-theme_&]:bg-zinc-150">
                          {getNotificationIcon(item.type)}
                        </div>
                      )}
                    </div>

                    {/* Middle: Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold tracking-wider text-blue-500 uppercase">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-zinc-500">•</span>
                        <span className="text-[10px] text-zinc-400 font-semibold">{item.time}</span>
                      </div>
                      <p className={cn(
                        "text-xs mt-1 text-white leading-snug [.light-theme_&]:text-zinc-900",
                        !item.isRead && "font-bold"
                      )}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-normal [.light-theme_&]:text-zinc-500">
                        {item.description}
                      </p>

                      {/* Special Invitation Actions */}
                      {item.category === "INVITATION" && (
                        <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onRespondInvitation(item.id, "ACCEPT")}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold shadow-lg shadow-blue-600/10 flex items-center gap-1 transition"
                          >
                            <Check className="h-3 w-3" /> Accept
                          </button>
                          <button
                            onClick={() => onRespondInvitation(item.id, "DECLINE")}
                            className="px-3 py-1 bg-white/10 hover:bg-white/15 text-zinc-300 rounded-md text-[10px] font-bold border border-white/5 transition [.light-theme_&]:bg-zinc-100 [.light-theme_&]:text-zinc-700"
                          >
                            <X className="h-3 w-3" /> Decline
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Unread Indicator Dot */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                      {!item.isRead && (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(item.id, item.category);
                          }}
                          className="h-2.5 w-2.5 rounded-full bg-blue-500" 
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
