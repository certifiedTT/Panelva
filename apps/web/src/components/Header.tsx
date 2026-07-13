"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { NotificationIcon } from "@/components/StateIcons";
import { Crown, Sparkles, ChevronRight, User, Settings2, Clock, Settings, LogOut } from "lucide-react";
import { trpc } from "../lib/trpc";

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
    };

    loadNotifications();
    window.addEventListener("panelva_notification_update", handleUpdate);
    window.addEventListener("storage", loadNotifications);
    return () => {
      window.removeEventListener("panelva_notification_update", handleUpdate);
      window.removeEventListener("storage", loadNotifications);
    };
  }, []);

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
      <nav className="nav-container">
        {/* Left logo and main links */}
        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
          <Link href="/" className="nav-logo">
            panelva
          </Link>
          <div className="nav-links-wrapper">
            <Link href="/" className={`nav-link-item ${pathname === "/" ? "active" : ""}`}>
              Home
            </Link>
            <Link href="/comics" className={`nav-link-item ${pathname === "/comics" ? "active" : ""}`}>
              Comics
            </Link>
            <Link href="/novels" className={`nav-link-item ${pathname === "/novels" ? "active" : ""}`}>
              Novels
            </Link>
            <Link href="/community" className={`nav-link-item ${pathname === "/community" ? "active" : ""}`}>
              Community
            </Link>

            {/* More Section Dropdown */}
            <div className="dropdown-container" ref={dropdownRef}>
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`dropdown-trigger ${isMoreOpen ? "open" : ""}`}
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
          </div>
        </div>

        {/* Right Search bar and profile controls */}
        <div className="header-right-controls" style={{ display: "flex", alignItems: "center" }}>
          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <form onSubmit={(e) => { e.preventDefault(); setIsSearchFocused(false); }}>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="header-search-input"
                onFocus={(e) => {
                  setIsSearchFocused(true);
                }}
                onBlur={(e) => {
                  setIsSearchFocused(false);
                }}
              />
              <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dark-muted)", display: "flex", alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
            </form>

            {/* Real-time search suggestions dropdown */}
            {isSearchFocused && searchQuery.trim() !== "" && (
              <div 
                className="glass-panel search-suggestions-overlay"
              >
                {filteredSuggestions.length === 0 ? (
                  <div style={{ padding: "8px 12px", fontSize: "0.78rem", color: "var(--text-muted-color)" }}>
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
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--border-color)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                        {item.title}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.68rem", color: "var(--text-muted-color)" }}>
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

          {/* Action icons */}
          <Link href="/trending" title="History / Recents" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "var(--text-dark-muted)", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-dark-muted)"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </Link>
          
          {/* Notifications envelope with dropdown */}
          <div className="dropdown-container" ref={notifRef}>
            <button 
              onClick={handleOpenNotifications}
              title="Notifications / Inbox" 
              style={{ 
                position: "relative",
                display: "flex", 
                alignItems: "center", 
                background: "none",
                border: "none",
                color: isNotificationsOpen ? "#fff" : "var(--text-dark-muted)", 
                cursor: "pointer",
                padding: 0,
                transition: "color var(--transition-fast)" 
              }}
            >
              <NotificationIcon size={18} color="currentColor" activeState={unreadCount > 0} />
              
              {/* Badge Counter */}
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-3px",
                  right: "-3px",
                  background: "#e74c3c",
                  color: "#fff",
                  fontSize: "0.55rem",
                  fontWeight: 800,
                  borderRadius: "50%",
                  minWidth: "11px",
                  height: "11px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "1px"
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="glass-panel dropdown-menu-list" style={{ minWidth: "260px" }}>
                <div style={{ padding: "8px 12px 6px 12px", borderBottom: "1px solid var(--dark-border)", fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
                  Subscriber Updates
                </div>
                <div style={{ maxHeight: "200px", overflowY: "auto", padding: "6px" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "12px 8px", fontSize: "0.8rem", color: "var(--text-dark-muted)", textAlign: "center" }}>
                      No new updates from creators.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: "var(--text-dark)", lineHeight: 1.3 }}>{notif.text}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)" }}>{notif.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown Container */}
          <div className="dropdown-container" ref={profileDropdownRef}>
            <button
              onClick={() => {
                if (isSignedIn) {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                } else {
                  router.push("/auth");
                }
              }}
              title={isSignedIn ? `Logged In as ${username}` : "Guest (Click to Sign In)"}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "var(--border-color)",
                border: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "0.85rem",
                fontWeight: "bold",
                color: "var(--text-color)",
                cursor: "pointer",
                outline: "none",
                transition: "all var(--transition-fast)"
              }}
            >
              {isSignedIn ? (
                username ? username.charAt(0).toUpperCase() : "U"
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              )}
            </button>

            {isSignedIn && isProfileDropdownOpen && (
              <div 
                className="glass-panel" 
                style={{ 
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  right: 0,
                  width: "240px",
                  padding: "0.8rem",
                  borderRadius: "14px",
                  backgroundColor: "var(--dropdown-bg)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  zIndex: 1050,
                  animation: "fadeInDown var(--transition-fast)"
                }}
              >
                {/* Header User profile info */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* Avatar */}
                  <div style={{ 
                    width: "32px", 
                    height: "32px", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--primary)", 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    fontSize: "0.85rem", 
                    fontWeight: 700, 
                    color: "#fff" 
                  }}>
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </div>
                  {/* Username & Joined Date */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-color)" }}>{username}</span>
                      {/* Plus/Premium Crown Badge */}
                      <Crown size={11} color="var(--primary)" style={{ fill: "var(--primary)" }} />
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted-color)" }}>
                      {userJoinedDate}
                    </span>
                  </div>
                </div>

                {/* Premium Banner Card */}
                <div style={{ 
                  border: "1px solid var(--primary)", 
                  background: "linear-gradient(180deg, rgba(37, 99, 235, 0.08), rgba(0,0,0,0))",
                  padding: "0.75rem", 
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.65rem", color: "var(--primary)", fontWeight: 700, letterSpacing: "0.05em" }}>
                    <Sparkles size={8} /> PREMIUM
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "3px" }}>
                    Panelva <span style={{ color: "var(--primary)" }}>+</span>
                  </div>
                  <div 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      router.push("/premium");
                    }} 
                    style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "2px", marginTop: "2px", cursor: "pointer" }}
                  >
                    Get Started <ChevronRight size={10} />
                  </div>
                </div>

                {/* Navigation list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {/* Profile Item */}
                  <div 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      router.push("/profile");
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", cursor: "pointer", transition: "opacity 0.2s" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                      <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--primary)" }}>
                        <User size={13} />
                      </div>
                      <span style={{ color: "var(--text-color)", fontWeight: 600, fontSize: "0.8rem" }}>Profile</span>
                    </div>
                    <ChevronRight size={12} color="var(--text-muted-color)" />
                  </div>
 
                  {/* Dashboard / Command Center Item (Conditionally Rendered) */}
                  {getRoleInfo().isDashboard && (
                    <div 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        router.push(getRoleInfo().link);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", cursor: "pointer", transition: "opacity 0.2s" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--primary)" }}>
                          {getRoleInfo().text === "Command Center" ? <Crown size={13} /> : <Settings2 size={13} />}
                        </div>
                        <span style={{ color: "var(--text-color)", fontWeight: 600, fontSize: "0.8rem" }}>{getRoleInfo().text}</span>
                      </div>
                      <ChevronRight size={12} color="var(--text-muted-color)" />
                    </div>
                  )}
 
                  {/* History Item */}
                  <div 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      router.push("/trending");
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", cursor: "pointer", transition: "opacity 0.2s" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                      <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--primary)" }}>
                        <Clock size={13} />
                      </div>
                      <span style={{ color: "var(--text-color)", fontWeight: 600, fontSize: "0.8rem" }}>History</span>
                    </div>
                    <ChevronRight size={12} color="var(--text-muted-color)" />
                  </div>
 
                  {/* Settings Item */}
                  <div 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      router.push("/settings");
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", cursor: "pointer", transition: "opacity 0.2s" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                      <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--primary)" }}>
                        <Settings size={13} />
                      </div>
                      <span style={{ color: "var(--text-color)", fontWeight: 600, fontSize: "0.8rem" }}>Settings</span>
                    </div>
                    <ChevronRight size={12} color="var(--text-muted-color)" />
                  </div>
                </div>
 
                <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "1px 0" }}></div>
 
                {/* Sign Out Button */}
                <button 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    handleSignOut();
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--border-color)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--input-bg)"}
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-color)",
                    padding: "6px 10px",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    width: "100%",
                    transition: "background-color 0.2s"
                  }}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>

          {/* Publish Button */}
          <button
            onClick={() => router.push("/publish")}
            style={{
              background: "var(--primary, #2563eb)",
              border: "none",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all var(--transition-fast)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.15)"}
            onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
          >
            Publish
          </button>
        </div>
      </nav>

    </>
  );
}
