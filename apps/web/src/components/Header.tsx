"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { NotificationIcon } from "@/components/StateIcons";
import { Crown, Sparkles, ChevronRight, User, Settings2, Clock, Settings, LogOut, Search, Bell, Eye, EyeOff } from "lucide-react";
import { trpc } from "../lib/trpc";
import { InvitationModal } from "./InvitationModal";
import { motion } from "framer-motion";
import ActivityDropdown, { ActivityItem, NotificationType, formatRelativeTime } from "./ui/activity-dropdown";
import {
  getRoleDisplayName,
  isAdminRole,
  SUPPORTED_PREVIEW_ROLES,
} from "../lib/roleUtils";
import { useAuth } from "./AuthContext";
import { createClient } from "@/utils/supabase/client";

interface WebNotification {
  id: string;
  text: string;
  timestamp: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    role: effectiveRole,
    actualRole,
    isSignedIn,
    isLoading: isAuthLoading,
    previewRole,
    setPreviewRole,
    clearPreviewRole,
    signOut,
  } = useAuth();

  const username = user?.username || "";

  const userJoinedDate = useMemo(() => {
    if (!user?.createdAt) return "Joined Just now";
    try {
      const date = new Date(user.createdAt);
      return `Joined ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } catch {
      return "Joined Just now";
    }
  }, [user?.createdAt]);

  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);


  const [isImmersiveMode, setIsImmersiveMode] = useState<boolean>(false);

  // Sync immersive state with localStorage
  useEffect(() => {
    const checkImmersive = () => {
      const val = localStorage.getItem("panelva_reader_immersive") === "true";
      setIsImmersiveMode(val);
    };
    checkImmersive();
    window.addEventListener("panelva_immersive_update", checkImmersive);
    return () => {
      window.removeEventListener("panelva_immersive_update", checkImmersive);
    };
  }, []);
  
  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);

  // Collaboration Invitation states & queries
  const [activeInvitation, setActiveInvitation] = useState<any>(null);
  const { data: dbInvitations, refetch: refetchInvitations } = (trpc.collaboration.getReceivedInvitations as any).useQuery(undefined, {
    enabled: isSignedIn,
  });

  const isCreatorOrAdmin = useMemo(() => {
    return isSignedIn && effectiveRole !== "USER";
  }, [isSignedIn, effectiveRole]);

  const showBecomeCreator = useMemo(() => {
    return !isSignedIn || effectiveRole === "USER";
  }, [isSignedIn, effectiveRole]);

  const { data: dbNotifications, refetch: refetchNotifications } = (trpc.creator.getCreatorNotifications as any).useQuery(undefined, {
    enabled: isCreatorOrAdmin,
  });

  const { data: dbReaderNotifications, refetch: refetchReaderNotifications } = (trpc.user.getReaderNotifications as any).useQuery(undefined, {
    enabled: isSignedIn,
  });

  const markReadMutation = trpc.creator.markNotificationRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
    }
  });

  const markReaderReadMutation = trpc.user.markNotificationRead.useMutation({
    onSuccess: () => {
      refetchReaderNotifications();
    }
  });

  const markAllReaderReadMutation = trpc.user.markAllNotificationsRead.useMutation({
    onSuccess: () => {
      refetchReaderNotifications();
    }
  });

  const respondMutation = trpc.collaboration.respondToInvitation.useMutation({
    onSuccess: () => {
      refetchInvitations();
      alert("Successfully responded to the collaboration invitation.");
      setActiveInvitation(null);
    },
    onError: (err: any) => {
      alert(`Error responding to invitation: ${err.message}`);
    }
  });

  const handleInvitationResponse = (response: "ACCEPT" | "DECLINE") => {
    if (!activeInvitation) return;
    respondMutation.mutate({
      invitationId: activeInvitation.id,
      response,
    });
  };

  const handleRespondInvitation = (id: string, response: "ACCEPT" | "DECLINE") => {
    respondMutation.mutate({
      invitationId: id,
      response,
    });
  };

  // Build unified notification items
  const activityItems = useMemo(() => {
    const list: ActivityItem[] = [];

    // 1. Collaboration Invitations
    if (dbInvitations) {
      dbInvitations.forEach((inv: any) => {
        list.push({
          id: inv.id,
          type: "COLLABORATION",
          title: "Collaboration Invite",
          description: `Invite as ${inv.role} for series "${inv.series.title}"`,
          time: formatRelativeTime(inv.createdAt),
          isRead: false,
          image: inv.sender?.avatarUrl || undefined,
          category: "INVITATION",
          rawItem: inv,
        });
      });
    }

    // 2. Database Creator Notifications
    if (dbNotifications) {
      dbNotifications.forEach((notif: any) => {
        let typeVal: NotificationType = "SYSTEM";
        const validTypes: NotificationType[] = [
          "SYSTEM", "PAYMENT", "CREATOR", "SOCIAL", "MEMBERSHIP", 
          "ADMIN", "SECURITY", "ENGAGEMENT", "CONTENT", "DISCOVERY", 
          "COLLABORATION", "ACHIEVEMENT"
        ];
        if (validTypes.includes(notif.type as any)) {
          typeVal = notif.type as NotificationType;
        }

        list.push({
          id: notif.id,
          type: typeVal,
          title: notif.title,
          description: notif.message,
          time: formatRelativeTime(notif.createdAt),
          isRead: notif.isRead,
          category: "CREATOR_NOTIFICATION",
          rawItem: notif,
        });
      });
    }

    // 3. Local storage notifications
    if (notifications) {
      notifications.forEach((notif: any) => {
        list.push({
          id: notif.id,
          type: "CREATOR",
          title: "Creator Update",
          description: notif.text,
          time: formatRelativeTime(notif.timestamp),
          isRead: notif.isRead ?? false,
          category: "LOCAL_NOTIFICATION",
          rawItem: notif,
        });
      });
    }

    // 4. Reader Notifications (New Chapter Alerts)
    if (dbReaderNotifications) {
      dbReaderNotifications.forEach((notif: any) => {
        list.push({
          id: notif.id,
          type: "CONTENT",
          title: notif.title,
          description: notif.message,
          time: formatRelativeTime(notif.createdAt),
          isRead: notif.isRead,
          category: "CREATOR_NOTIFICATION",
          rawItem: notif,
        });
      });
    }

    // Sort by timestamp desc
    list.sort((a: any, b: any) => {
      const timeA = a.rawItem.createdAt 
        ? new Date(a.rawItem.createdAt).getTime() 
        : (a.rawItem.timestamp && !isNaN(Date.parse(a.rawItem.timestamp)) ? new Date(a.rawItem.timestamp).getTime() : 0);
      const timeB = b.rawItem.createdAt 
        ? new Date(b.rawItem.createdAt).getTime() 
        : (b.rawItem.timestamp && !isNaN(Date.parse(b.rawItem.timestamp)) ? new Date(b.rawItem.timestamp).getTime() : 0);
      return timeB - timeA;
    });

    return list;
  }, [dbInvitations, dbNotifications, dbReaderNotifications, notifications]);

  // Unified Unread Count
  const totalUnreadCount = useMemo(() => {
    let count = 0;
    count += dbInvitations?.length || 0;
    count += dbNotifications?.filter((n: any) => !n.isRead).length || 0;
    count += dbReaderNotifications?.filter((n: any) => !n.isRead).length || 0;
    count += unreadCount;
    return count;
  }, [dbInvitations, dbNotifications, dbReaderNotifications, unreadCount]);

  // Bell animate state on new notification
  const [bellWiggle, setBellWiggle] = useState(false);
  const prevUnreadCountRef = useRef(0);

  useEffect(() => {
    if (totalUnreadCount > prevUnreadCountRef.current) {
      setBellWiggle(true);
      const timer = setTimeout(() => setBellWiggle(false), 800);
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = totalUnreadCount;
  }, [totalUnreadCount]);

  const handleMarkRead = (id: string, category: ActivityItem["category"]) => {
    if (category === "CREATOR_NOTIFICATION") {
      // Check if it's in dbReaderNotifications
      const isReader = dbReaderNotifications?.some((n: any) => n.id === id);
      if (isReader) {
        markReaderReadMutation.mutate({ notificationId: id });
      } else {
        markReadMutation.mutate({ id });
      }
    } else if (category === "LOCAL_NOTIFICATION") {
      const existing = localStorage.getItem("panelva_notifications");
      if (existing) {
        const parsed = JSON.parse(existing) as any[];
        const updated = parsed.map((item: any) => {
          if (item.id === id) {
            return { ...item, isRead: true };
          }
          return item;
        });
        localStorage.setItem("panelva_notifications", JSON.stringify(updated));
        
        setUnreadCount(prev => {
          const next = Math.max(0, prev - 1);
          localStorage.setItem("panelva_notifications_unread", next.toString());
          return next;
        });

        window.dispatchEvent(new Event("panelva_notification_update"));
      }
    }
  };

  const handleMarkAllRead = async () => {
    // 1. DB Creator notifications
    const unreadDb = dbNotifications?.filter((n: any) => !n.isRead) || [];
    if (unreadDb.length > 0) {
      try {
        await Promise.all(unreadDb.map((n: any) => markReadMutation.mutateAsync({ id: n.id })));
      } catch (e) {
        console.error("Failed to mark all DB creator notifications as read", e);
      }
    }

    // 2. DB Reader notifications
    const unreadReader = dbReaderNotifications?.filter((n: any) => !n.isRead) || [];
    if (unreadReader.length > 0) {
      try {
        await markAllReaderReadMutation.mutateAsync();
      } catch (e) {
        console.error("Failed to mark all reader notifications as read", e);
      }
    }

    // 3. Local notifications
    const existing = localStorage.getItem("panelva_notifications");
    if (existing) {
      const parsed = JSON.parse(existing) as any[];
      const updated = parsed.map((item: any) => ({ ...item, isRead: true }));
      localStorage.setItem("panelva_notifications", JSON.stringify(updated));
    }
    setUnreadCount(0);
    localStorage.setItem("panelva_notifications_unread", "0");

    refetchNotifications();
    refetchReaderNotifications();
    window.dispatchEvent(new Event("panelva_notification_update"));
  };



  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: searchResults, isLoading: isSearchLoading } = (trpc.series.search as any).useQuery(
    { query: debouncedQuery, limit: 8 },
    { enabled: debouncedQuery.length > 0 }
  );

  const filteredSuggestions = searchResults || [];
  
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-blue-500/30 text-blue-400 rounded px-0.5">{part}</mark>
            : part
        )}
      </span>
    );
  };
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen to creator status update notifications
  useEffect(() => {
    const loadNotifications = () => {
      const existing = localStorage.getItem("panelva_notifications");
      if (existing) {
        setNotifications(JSON.parse(existing));
      }
      const count = localStorage.getItem("panelva_notifications_unread") || "0";
      setUnreadCount(Number(count));
      refetchInvitations();
      if (isCreatorOrAdmin) {
        refetchNotifications();
      }
    };

    const handleUpdate = () => {
      const existing = localStorage.getItem("panelva_notifications");
      if (existing) {
        setNotifications(JSON.parse(existing));
      }
      setUnreadCount((prev) => {
        const next = prev + 1;
        localStorage.setItem("panelva_notifications_unread", next.toString());
        return next;
      });
      refetchInvitations();
      if (isCreatorOrAdmin) {
        refetchNotifications();
      }
    };

    loadNotifications();
    window.addEventListener("panelva_notification_update", handleUpdate);
    window.addEventListener("storage", loadNotifications);
    return () => {
      window.removeEventListener("panelva_notification_update", handleUpdate);
      window.removeEventListener("storage", loadNotifications);
    };
  }, [refetchInvitations, refetchNotifications, isCreatorOrAdmin]);

  const getRoleInfo = () => {
    const role = effectiveRole;

    if (role === "MASTER_ADMIN") {
      return { text: "Command Center", link: "/admin", isDashboard: true, badge: "Master Admin" };
    } else if (isAdminRole(role)) {
      return { text: "Admin Dashboard", link: "/admin", isDashboard: true, badge: getRoleDisplayName(role) };
    } else if (role === "CREATOR" || role === "VERIFIED_CREATOR") {
      return { text: "Creator Studio", link: "/studio", isDashboard: true, badge: "Creator" };
    }
    return { text: "", link: "", isDashboard: false, badge: "User" };
  };

  // Suppress header on dedicated workspace pages (Studio & Admin) and reading immersive mode
  const isWorkspacePage = pathname?.startsWith("/studio") || pathname?.startsWith("/admin");
  const isReadingPage = pathname?.includes("/read") || pathname?.includes("/chapter");
  if (isWorkspacePage || (isReadingPage && isImmersiveMode)) {
    return null;
  }


  const handleSignOut = async () => {
    await signOut();
    setIsMoreOpen(false);
    alert("Signed out successfully.");
    router.push("/");
  };

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setUnreadCount(0);
    localStorage.setItem("panelva_notifications_unread", "0");
  };

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0b0c10]/80 backdrop-blur-md [.light-theme_&]:bg-white/80 [.light-theme_&]:border-zinc-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-white italic transition [.light-theme_&]:text-zinc-900">
              panelva
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
              <Link
                href="/"
                className={`transition-colors duration-200 ${
                  pathname === "/"
                    ? "text-white [.light-theme_&]:text-zinc-900 font-semibold"
                    : "text-zinc-400 hover:text-white [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
                }`}
              >
                Home
              </Link>
              <Link
                href="/comics"
                className={`transition-colors duration-200 ${
                  pathname === "/comics"
                    ? "text-white [.light-theme_&]:text-zinc-900 font-semibold"
                    : "text-zinc-400 hover:text-white [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
                }`}
              >
                Comics
              </Link>
              <Link
                href="/novels"
                className={`transition-colors duration-200 ${
                  pathname === "/novels"
                    ? "text-white [.light-theme_&]:text-zinc-900 font-semibold"
                    : "text-zinc-400 hover:text-white [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
                }`}
              >
                Novels
              </Link>

              <Link
                href="/creator_hub"
                className={`transition-colors duration-200 ${
                  pathname === "/creator_hub"
                    ? "text-white [.light-theme_&]:text-zinc-900 font-semibold"
                    : "text-zinc-400 hover:text-white [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
                }`}
              >
                Creator Hub
              </Link>

              {/* More Section Dropdown */}
              <div className="relative dropdown-container" ref={dropdownRef}>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`transition-colors duration-200 flex items-center gap-1 hover:text-white [.light-theme_&]:hover:text-zinc-900 ${
                    isMoreOpen ? "text-white [.light-theme_&]:text-zinc-900" : "text-zinc-400 [.light-theme_&]:text-zinc-500"
                  }`}
                >
                  More
                </button>

              {isMoreOpen && (
                <div className="glass-panel dropdown-menu-list">
                  {/* Mobile Navigation Links */}
                  <div className="mobile-only-nav">
                    <Link href="/" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                      Home
                    </Link>
                    <Link href="/comics" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                      Comics
                    </Link>
                    <Link href="/novels" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                      Novels
                    </Link>

                    <Link href="/creator_hub" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--secondary)" }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      Creator Hub
                    </Link>
                    <div className="dropdown-divider"></div>
                  </div>

                  {showBecomeCreator && (
                    <Link href="/creator/apply" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--secondary)" }}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      Become a creator
                    </Link>
                  )}
                  <Link href="/redeem" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="6" y1="8" x2="10" y2="8"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="10" y2="16"></line></svg>
                    Redeem code
                  </Link>
                  
                  {/* My Library conditionally active based on Signed In status */}
                  {isSignedIn ? (
                    <>
                      <Link href="/library" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        My library
                      </Link>
                      <Link href="/history" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#3498db" }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Reading history
                      </Link>
                    </>
                  ) : (
                    <div 
                      className="dropdown-item-disabled" 
                      title="Sign in to view your library"
                      onClick={() => {
                        setIsMoreOpen(false);
                        router.push("/auth");
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      My library <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", marginLeft: "auto" }}>(signed out)</span>
                    </div>
                  )}
                  
                  <div className="dropdown-divider"></div>
                  
                  <Link href="/trending" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    Trending now
                  </Link>
                  <Link href="/premium" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#f1c40f" }}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path></svg>
                    Go premium
                  </Link>
                  <Link href="/help" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Help center
                  </Link>

                  <div className="dropdown-divider"></div>
                  
                  {isSignedIn ? (
                    <button 
                      onClick={handleSignOut}
                      className="dropdown-item-link"
                      style={{ color: "#e74c3c", fontWeight: 600 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"></path></svg>
                      Sign Out
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setIsMoreOpen(false);
                        router.push("/auth");
                      }}
                      className="dropdown-item-link"
                      style={{ color: "var(--secondary)", fontWeight: 600 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                      Sign In
                    </button>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative hidden sm:block">
            <form onSubmit={(e) => { e.preventDefault(); setIsSearchFocused(false); }}>
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 [.light-theme_&]:text-zinc-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search comics, novels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-64 rounded-full bg-zinc-900/80 py-1.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 border border-zinc-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all [.light-theme_&]:bg-zinc-100/80 [.light-theme_&]:text-zinc-900 [.light-theme_&]:placeholder-zinc-400 [.light-theme_&]:border-zinc-300"
              />
            </form>
            {isSearchFocused && searchQuery.trim() !== "" && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-white/5 bg-[#0b0c10]/95 backdrop-blur-md p-1 shadow-xl z-50 max-h-80 overflow-y-auto [.light-theme_&]:bg-white/95 [.light-theme_&]:border-zinc-200">
                {filteredSuggestions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500 text-center">
                    No results found
                  </div>
                ) : (
                  filteredSuggestions.map((item: any) => (
                    <div
                      key={item.id}
                      onMouseDown={() => {
                        router.push(`/read/${item.id}`);
                        setSearchQuery("");
                        setIsSearchFocused(false);
                      }}
                      className="flex flex-col gap-1 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-white/5 [.light-theme_&]:hover:bg-zinc-100"
                    >
                      <div className="text-xs font-semibold text-white [.light-theme_&]:text-zinc-900">
                        {highlightText(item.title, searchQuery)}
                      </div>
                      <div className="flex gap-2 items-center text-[10px] text-zinc-500">
                        <span style={{ 
                          backgroundColor: item.type === "COMIC" ? "rgba(37, 99, 235, 0.15)" : "rgba(168, 85, 247, 0.15)",
                          color: item.type === "COMIC" ? "#3b82f6" : "#a855f7",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: 700,
                          fontSize: "0.6rem",
                          textTransform: "uppercase"
                        }}>
                          {item.type === "COMIC" ? "Comic" : "Novel"}
                        </span>
                        <span>•</span>
                        <span>{item.genre}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <div className="relative dropdown-container" ref={notifRef}>
              <button 
                onClick={handleOpenNotifications}
                title="Notifications / Inbox" 
                className="relative flex items-center hover:text-white transition-colors duration-200 text-zinc-400 [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
              >
                <motion.div
                  animate={bellWiggle ? { rotate: [0, 15, -15, 12, -12, 6, -6, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center justify-center"
                >
                  <Bell size={20} />
                </motion.div>
                {totalUnreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>
              <ActivityDropdown
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                items={activityItems}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onOpenInvitation={setActiveInvitation}
                onRespondInvitation={handleRespondInvitation}
              />
            </div>
            <div className="relative dropdown-container" ref={profileDropdownRef}>
              <button
                onClick={() => {
                  if (isSignedIn) {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  } else {
                    router.push("/auth");
                  }
                }}
                title={isSignedIn ? `Logged In as ${username}` : "Guest (Click to Sign In)"}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-850 border border-zinc-700 hover:border-zinc-500 transition"
              >
                {isSignedIn ? (
                  <span className="text-xs font-medium text-zinc-300">
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </span>
                ) : (
                  <User size={16} className="text-zinc-400" />
                )}
              </button>
              {isSignedIn && isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-white/5 bg-[#0b0c10]/95 backdrop-blur-md p-3 shadow-xl z-50 flex flex-col gap-3 [.light-theme_&]:bg-white/95 [.light-theme_&]:border-zinc-200">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white [.light-theme_&]:text-zinc-900">{username}</span>
                        <Crown size={11} className="text-blue-500 fill-blue-500" />
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {userJoinedDate}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5 flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[8px] font-bold tracking-wider text-blue-500 uppercase">
                      <Sparkles size={8} /> PREMIUM
                    </div>
                    <div className="text-sm font-extrabold text-white [.light-theme_&]:text-zinc-900">
                      Panelva <span className="text-blue-500">+</span>
                    </div>
                    <div 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        router.push("/premium");
                      }} 
                      className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-0.5 mt-1 cursor-pointer"
                    >
                      Get Started <ChevronRight size={10} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        router.push("/profile");
                      }}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/5 transition-colors [.light-theme_&]:hover:bg-zinc-100"
                    >
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-blue-500" />
                        <span className="text-xs font-semibold text-zinc-300 [.light-theme_&]:text-zinc-700">Profile</span>
                      </div>
                      <ChevronRight size={12} className="text-zinc-500" />
                    </div>
                    {getRoleInfo().isDashboard && (
                      <div 
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          router.push(getRoleInfo().link);
                        }}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/5 transition-colors [.light-theme_&]:hover:bg-zinc-100"
                      >
                        <div className="flex items-center gap-2">
                          {getRoleInfo().text === "Command Center" ? <Crown size={14} className="text-blue-500" /> : <Settings2 size={14} className="text-blue-500" />}
                          <span className="text-xs font-semibold text-zinc-300 [.light-theme_&]:text-zinc-700">{getRoleInfo().text}</span>
                        </div>
                        <ChevronRight size={12} className="text-zinc-500" />
                      </div>
                    )}
                    <div 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        router.push("/trending");
                      }}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/5 transition-colors [.light-theme_&]:hover:bg-zinc-100"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-500" />
                        <span className="text-xs font-semibold text-zinc-300 [.light-theme_&]:text-zinc-700">History</span>
                      </div>
                      <ChevronRight size={12} className="text-zinc-500" />
                    </div>
                    <div 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        router.push("/settings");
                      }}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/5 transition-colors [.light-theme_&]:hover:bg-zinc-100"
                    >
                      <div className="flex items-center gap-2">
                        <Settings size={14} className="text-blue-500" />
                        <span className="text-xs font-semibold text-zinc-300 [.light-theme_&]:text-zinc-700">Settings</span>
                      </div>
                      <ChevronRight size={12} className="text-zinc-500" />
                    </div>
                  </div>
                  <div className="h-px bg-white/5 my-1 [.light-theme_&]:bg-zinc-200"></div>
                  <button 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-500 px-3 py-1.5 text-xs font-semibold transition-colors duration-200"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push("/publish")}
              className="rounded-full bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20"
            >
              Publish
            </button>
          </div>
        </div>
        </div>
      </header>
      {activeInvitation && (
        <InvitationModal
          invitation={activeInvitation}
          onClose={() => setActiveInvitation(null)}
          onResponse={handleInvitationResponse}
        />
      )}

      {/* Role Preview Panel — Master Admin Only */}
      {isSignedIn && actualRole === "MASTER_ADMIN" && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-[#0d0e12]/95 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-3.5 rounded-xl w-60 flex flex-col gap-2.5 text-[11px] font-sans text-white">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-500" /> Role Preview
            </span>
            <span className="bg-amber-600/20 text-amber-400 font-extrabold text-[7px] uppercase px-1.5 py-0.5 rounded tracking-wide border border-amber-500/20">
              Master Admin
            </span>
          </div>
          
          <div className="flex flex-col gap-1">
            <select
              value={previewRole || "ACTUAL"}
              onChange={(e) => {
                const newRole = e.target.value;
                if (newRole === "ACTUAL") {
                  clearPreviewRole();
                } else {
                  setPreviewRole(newRole);
                }
                // Force re-render
                window.location.reload();
              }}
              className="w-full bg-[#161b22] border border-gray-800 hover:border-zinc-700 text-white rounded-lg px-2 py-1.5 text-[11px] focus:outline-none transition cursor-pointer"
            >
              {SUPPORTED_PREVIEW_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          
          <div className="text-[9px] text-gray-500 leading-tight border-t border-zinc-800/60 pt-1.5">
            <p>Viewing as: <strong className="text-amber-400 uppercase">{getRoleDisplayName(effectiveRole)}</strong></p>
          </div>
        </div>
      )}

      {/* Persistent Preview Mode Banner */}
      {isSignedIn && previewRole && actualRole === "MASTER_ADMIN" && (
        <div className="fixed top-16 left-0 right-0 z-[9998] bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md px-6 py-2.5 flex items-center justify-center gap-3 text-amber-400 font-semibold text-xs shadow-[0_4px_12px_rgba(245,158,11,0.08)]">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Preview Mode Active — Viewing Platform as: <strong className="text-white uppercase tracking-wider">{getRoleDisplayName(effectiveRole)}</strong></span>
          <button 
            onClick={() => {
              clearPreviewRole();
              window.location.reload();
            }}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold px-3 py-1 rounded-lg text-[10px] uppercase transition-colors border border-amber-500/30 flex items-center gap-1"
          >
            <EyeOff size={10} /> Exit Preview
          </button>
        </div>
      )}
    </>
  );
}
