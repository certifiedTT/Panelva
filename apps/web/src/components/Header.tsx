"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { NotificationIcon } from "@/components/StateIcons";
import { Crown, Sparkles, ChevronRight, User, Settings2, Clock, Settings, LogOut, Search, Bell } from "lucide-react";
import { trpc } from "../lib/trpc";
import { InvitationModal } from "./InvitationModal";

const LOCAL_FALLBACK_CATALOG = [
  // Comics
  { id: "1", title: "Love Bites", genre: "Romance", type: "COMIC" },
  { id: "2", title: "Star Catcher", genre: "Romance", type: "COMIC" },
  { id: "3", title: "A Spell for a Smith", genre: "Fantasy", type: "COMIC" },
  { id: "4", title: "Surviving the Game as a Barbarian", genre: "Fantasy", type: "COMIC" },
  { id: "5", title: "Swolemates", genre: "Comedy", type: "COMIC" },
  { id: "6", title: "Sweet Romance, Spicy Roommates", genre: "Romance", type: "COMIC" },
  { id: "13", title: "Being Raised by Villains", genre: "Fantasy", type: "COMIC" },
  { id: "14", title: "Darling, Why Can't We Divorce?", genre: "Romance", type: "COMIC" },
  // Novels
  { id: "7", title: "Born to be the Grand Duchess", genre: "Romance", type: "NOVEL" },
  { id: "8", title: "Life of a Demon Hunter", genre: "Action", type: "NOVEL" },
  { id: "9", title: "Girlfriend Manual", genre: "Romance", type: "NOVEL" },
  { id: "10", title: "Aiming for the Alimony", genre: "Romance", type: "NOVEL" },
  { id: "11", title: "Archmage Curriculum", genre: "Fantasy", type: "NOVEL" },
  { id: "12", title: "My Child Will Have a Different Father", genre: "Fantasy", type: "NOVEL" },
  { id: "15", title: "The Holy Power of Modern Medicine", genre: "Fantasy", type: "NOVEL" },
  { id: "16", title: "Parent-Teacher Conflict", genre: "Romance", type: "NOVEL" },
  { id: "17", title: "Anna's Tale", genre: "Drama", type: "COMIC" },
  // Binge Series
  { id: "18", title: "Moonlight Sculptor", genre: "Fantasy", type: "COMIC" },
  { id: "19", title: "Tomb Raider King", genre: "Action", type: "COMIC" },
  { id: "20", title: "Dungeon Reset", genre: "Fantasy", type: "COMIC" },
  { id: "21", title: "God of Blackfield", genre: "Action", type: "COMIC" },
  { id: "22", title: "Overgeared", genre: "Fantasy", type: "COMIC" },
  { id: "23", title: "The Great Mage", genre: "Fantasy", type: "COMIC" },
  { id: "24", title: "Second Life Ranker", genre: "Fantasy", type: "COMIC" },
  { id: "25", title: "Returner's Magic", genre: "Fantasy", type: "COMIC" },
  // Season Returns
  { id: "26", title: "Solo Leveling: Ragnarok", genre: "Action", type: "COMIC" },
  { id: "27", title: "Tower of God Season 3", genre: "Fantasy", type: "COMIC" },
  { id: "28", title: "The Boxer: Back Alley", genre: "Drama", type: "COMIC" },
  { id: "29", title: "Mercenary Enrollment S2", genre: "Action", type: "COMIC" },
  { id: "30", title: "Eleceed New Season", genre: "Action", type: "COMIC" },
  { id: "31", title: "Beginning After the End S6", genre: "Fantasy", type: "COMIC" },
  { id: "32", title: "Wind Breaker Season 4", genre: "Drama", type: "COMIC" },
  { id: "33", title: "Doom Breaker Season 2", genre: "Action", type: "COMIC" },
  // Early Access
  { id: "34", title: "Blossoming Blade", genre: "Action", type: "COMIC" },
  { id: "35", title: "Omniscient Reader", genre: "Fantasy", type: "COMIC" },
  { id: "36", title: "Doom Breaker", genre: "Action", type: "COMIC" },
  { id: "37", title: "Undercover Professor", genre: "Fantasy", type: "COMIC" },
  { id: "38", title: "S-Classes That I Raised", genre: "Fantasy", type: "COMIC" },
  { id: "39", title: "Max-Level Newbie", genre: "Action", type: "COMIC" },
  { id: "40", title: "Standard Reincarnation", genre: "Fantasy", type: "COMIC" },
  { id: "41", title: "Reaper of Drifting Moon", genre: "Action", type: "COMIC" },
  // Originals
  { id: "42", title: "Panelva Chronicles", genre: "Fantasy", type: "COMIC" },
  { id: "43", title: "Neon Genesis: Panelva", genre: "Sci-Fi", type: "COMIC" },
  { id: "44", title: "Constellation Academy", genre: "Fantasy", type: "COMIC" },
  { id: "45", title: "Legend of Northern Blade", genre: "Action", type: "COMIC" },
  { id: "46", title: "Second Life Ranker", genre: "Fantasy", type: "COMIC" },
  { id: "47", title: "The Archmage's Return", genre: "Fantasy", type: "COMIC" },
  { id: "48", title: "Shadow Sovereign", genre: "Fantasy", type: "COMIC" },
  { id: "49", title: "Leveling Up My Class", genre: "Fantasy", type: "COMIC" },
];

interface WebNotification {
  id: string;
  text: string;
  timestamp: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false); // Start logged out by default
  const [username, setUsername] = useState<string>("");
  const [userJoinedDate, setUserJoinedDate] = useState<string>("Joined Just now");
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const [isImmersiveMode, setIsImmersiveMode] = useState<boolean>(false);

  // Sync user state and immersive state with localStorage
  useEffect(() => {
    const checkUser = () => {
      const user = localStorage.getItem("panelva_user");
      if (user) {
        setIsSignedIn(true);
        setUsername(user);
        const savedDate = localStorage.getItem("panelva_joined_date") || (user === "notjud3" ? "Joined May 28, 2026" : "Joined Just now");
        setUserJoinedDate(savedDate);
      } else {
        setIsSignedIn(false);
        setUsername("");
      }
    };
    const checkImmersive = () => {
      const val = localStorage.getItem("panelva_reader_immersive") === "true";
      setIsImmersiveMode(val);
    };
    checkUser();
    checkImmersive();
    window.addEventListener("storage", checkUser);
    window.addEventListener("panelva_user_update", checkUser);
    window.addEventListener("panelva_immersive_update", checkImmersive);
    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("panelva_user_update", checkUser);
      window.removeEventListener("panelva_immersive_update", checkImmersive);
    };
  }, []);
  
  // Notifications State
  const [notifications, setNotifications] = useState<WebNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);

  // Collaboration Invitation states & queries
  const [activeInvitation, setActiveInvitation] = useState<any>(null);
  const { data: dbInvitations, refetch: refetchInvitations } = trpc.collaboration.getReceivedInvitations.useQuery(undefined, {
    enabled: isSignedIn,
  });

  const respondMutation = trpc.collaboration.respondToInvitation.useMutation({
    onSuccess: () => {
      refetchInvitations();
      alert("Successfully responded to the collaboration invitation.");
      setActiveInvitation(null);
    },
    onError: (err) => {
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

  // Auth Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [penName, setPenName] = useState("");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Query database series list
  const { data: dbTrending } = trpc.series.getTrending.useQuery({ limit: 100 });

  // Merge database series and local fallback catalog
  const combinedSeriesList = useMemo(() => {
    const map = new Map<string, { id: string; title: string; genre: string; type: string }>();

    // Add local fallback catalog items
    LOCAL_FALLBACK_CATALOG.forEach((item) => {
      map.set(item.title.toLowerCase(), item);
    });

    // Merge or overwrite with database series entries
    if (dbTrending) {
      dbTrending.forEach((item) => {
        map.set(item.title.toLowerCase(), {
          id: item.id,
          title: item.title,
          genre: item.genre,
          type: item.type,
        });
      });
    }

    return Array.from(map.values());
  }, [dbTrending]);

  // Filter recommendations based on search input
  const filteredSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return combinedSeriesList
      .filter((item) => item.title.toLowerCase().includes(query))
      .slice(0, 8); // Limit to 8 items max
  }, [searchQuery, combinedSeriesList]);
  
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
    };

    loadNotifications();
    window.addEventListener("panelva_notification_update", handleUpdate);
    window.addEventListener("storage", loadNotifications);
    return () => {
      window.removeEventListener("panelva_notification_update", handleUpdate);
      window.removeEventListener("storage", loadNotifications);
    };
  }, [refetchInvitations]);

  const getRoleForUser = (user: string) => {
    if (!user || user === "Guest") return "USER";
    
    // 1. Check custom stored role in panelva_role if it matches the current user
    const storedCurrentRole = localStorage.getItem("panelva_role");
    const storedCurrentUser = localStorage.getItem("panelva_user");
    if (storedCurrentRole && storedCurrentUser === user) {
      return storedCurrentRole;
    }
    
    // 2. Check in the custom roles database mapping
    try {
      const rolesMap = JSON.parse(localStorage.getItem("panelva_user_roles") || "{}");
      if (rolesMap[user]) return rolesMap[user];
    } catch (e) {}

    // 3. Fallback to default name-based heuristics
    if (user === "notjud3" || user.toLowerCase().includes("master")) return "MASTER_ADMIN";
    if (user.toLowerCase().includes("admin") || user === "TO30") return "ADMIN";
    if (user.toLowerCase().includes("creator") || user.toLowerCase().includes("artist") || user.toLowerCase().includes("author") || user.toLowerCase().includes("novelist")) return "CREATOR";
    return "USER";
  };

  const getRoleInfo = () => {
    const role = getRoleForUser(username);

    if (role === "MASTER_ADMIN") {
      return { text: "Command Center", link: "/admin", isDashboard: true, badge: "Master Admin" };
    } else if (role === "ADMIN") {
      return { text: "Admin Dashboard", link: "/admin", isDashboard: true, badge: "Admin" };
    } else if (role === "CREATOR") {
      return { text: "Creator Studio", link: "/creator", isDashboard: true, badge: "Creator" };
    }
    return { text: "", link: "", isDashboard: false, badge: "User" };
  };

  // Suppress header on reading pages only when immersive mode is active
  const isReadingPage = pathname?.includes("/read") || pathname?.includes("/chapter");
  if (isReadingPage && isImmersiveMode) {
    return null;
  }

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    
    const displayUser = penName || email.split("@")[0] || "User";
    setUsername(displayUser);
    setIsSignedIn(true);
    setIsAuthModalOpen(false);
    alert(authMode === "signin" ? `Successfully signed in as ${displayUser}!` : `Successfully registered as ${displayUser}!`);
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setUsername("");
    setIsMoreOpen(false);
    localStorage.removeItem("panelva_user");
    localStorage.removeItem("panelva_role");
    alert("Signed out successfully.");
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
                href="/community"
                className={`transition-colors duration-200 ${
                  pathname === "/community"
                    ? "text-white [.light-theme_&]:text-zinc-900 font-semibold"
                    : "text-zinc-400 hover:text-white [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
                }`}
              >
                Community
              </Link>

              {/* More Section Dropdown */}
              <div className="relative dropdown-container" ref={dropdownRef}>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`transition-colors duration-200 flex items-center gap-1 hover:text-white [.light-theme_&]:hover:text-zinc-900 ${
                    isMoreOpen ? "text-white [.light-theme_&]:text-zinc-900" : "text-zinc-400 [.light-theme_&]:text-zinc-500"
                  }`}
                >
                  More <span style={{ transition: "transform var(--transition-fast)", display: "inline-block", transform: isMoreOpen ? "rotate(180deg)" : "rotate(0deg)", fontSize: "0.7rem" }}>▼</span>
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
                    <Link href="/community" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      Community
                    </Link>
                    <div className="dropdown-divider"></div>
                  </div>

                  <Link href="/creator/apply" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--secondary)" }}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Become a creator
                  </Link>
                  <Link href="/redeem" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="6" y1="8" x2="10" y2="8"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="10" y2="16"></line></svg>
                    Redeem code
                  </Link>
                  
                  {/* My Library conditionally active based on Signed In status */}
                  {isSignedIn ? (
                    <Link href="/library" className="dropdown-item-link" onClick={() => setIsMoreOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                      My library
                    </Link>
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
                  filteredSuggestions.map((item) => (
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
                        {item.title}
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
            <Link 
              href="/trending" 
              title="History / Recents" 
              className="hover:text-white transition-colors duration-200 text-zinc-400 [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </Link>
            <div className="relative dropdown-container" ref={notifRef}>
              <button 
                onClick={handleOpenNotifications}
                title="Notifications / Inbox" 
                className="relative flex items-center hover:text-white transition-colors duration-200 text-zinc-400 [.light-theme_&]:text-zinc-500 [.light-theme_&]:hover:text-zinc-900"
              >
                <Bell size={20} />
                {(unreadCount > 0 || (dbInvitations && dbInvitations.length > 0)) && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/5 bg-[#0b0c10]/95 backdrop-blur-md p-1 shadow-xl z-50 [.light-theme_&]:bg-white/95 [.light-theme_&]:border-zinc-200">
                  <div className="px-3 py-2 border-b border-white/5 text-xs font-bold text-white [.light-theme_&]:text-zinc-900 [.light-theme_&]:border-zinc-200">
                    Subscriber Updates
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {dbInvitations && dbInvitations.length > 0 && (
                      <div className="mb-2 border-b border-white/5 pb-1">
                        <div className="px-3 py-1 text-[9px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/5 rounded">
                          Collaboration Invites
                        </div>
                        {dbInvitations.map((invitation) => (
                          <div 
                            key={invitation.id} 
                            onClick={() => {
                              setActiveInvitation(invitation);
                              setIsNotificationsOpen(false);
                            }}
                            className="px-3 py-2 mt-1 rounded-lg hover:bg-white/5 cursor-pointer flex flex-col gap-1 text-xs transition"
                          >
                            <span className="text-white font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Collab: {invitation.series.title}
                            </span>
                            <span className="text-zinc-400">
                              Invite as <strong>{invitation.role}</strong>
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              From @{invitation.series.creator.penName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {notifications.length === 0 && (!dbInvitations || dbInvitations.length === 0) ? (
                      <div className="px-3 py-4 text-xs text-zinc-500 text-center">
                        No new updates from creators.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="px-3 py-2 border-b border-white/5 last:border-none flex flex-col gap-1 text-xs [.light-theme_&]:border-zinc-200">
                          <span className="text-zinc-300 font-medium leading-relaxed [.light-theme_&]:text-zinc-700">{notif.text}</span>
                          <span className="text-[10px] text-zinc-500">{notif.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
                className="flex items-center justify-center h-8 w-8 rounded-full border border-white/10 hover:border-white/20 transition-all text-zinc-400 hover:text-white [.light-theme_&]:border-zinc-300 [.light-theme_&]:text-zinc-600 [.light-theme_&]:hover:text-zinc-900 bg-zinc-900/80 [.light-theme_&]:bg-zinc-100"
              >
                {isSignedIn ? (
                  <span className="text-xs font-bold text-white [.light-theme_&]:text-zinc-900">
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </span>
                ) : (
                  <User size={20} />
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
    </>
  );
}
