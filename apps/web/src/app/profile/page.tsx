"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Settings, MoreVertical, User, Sparkles, Coins, 
  LayoutGrid, MessageSquare
} from "lucide-react";

// Mock Database of Series to resolve bookmarked titles
const SERIES_DB = [
  { id: "1", title: "Love Bites", genre: "Romance", likes: "3.9M", isNew: true, coverBg: "linear-gradient(135deg, #4c0519, #9f1239)" },
  { id: "2", title: "Star Catcher", genre: "Romance", likes: "3M", isNew: true, coverBg: "linear-gradient(135deg, #1e1b4b, #311042)" },
  { id: "3", title: "A Spell for a Smith", genre: "Fantasy", likes: "3.4M", isNew: true, coverBg: "linear-gradient(135deg, #022c22, #064e3b)" },
  { id: "4", title: "Surviving the Game as a Barbarian", genre: "Fantasy", likes: "4.4M", isNew: true, coverBg: "linear-gradient(135deg, #450a0a, #781c1c)" },
  { id: "5", title: "Swolemates", genre: "Comedy", likes: "7.6M", isNew: true, coverBg: "linear-gradient(135deg, #1f2937, #111827)" },
  { id: "6", title: "Sweet Romance, Spicy Roommates", genre: "Romance", likes: "92,054", isNew: true, coverBg: "linear-gradient(135deg, #831843, #db2777)" },
  { id: "7", title: "Born to be the Grand Duchess", genre: "Romance", likes: "549,934", isNew: true, coverBg: "linear-gradient(135deg, #0c4a6e, #0369a1)" },
  { id: "8", title: "Life of a Demon Hunter", genre: "Action", likes: "25,011", isNew: true, coverBg: "linear-gradient(135deg, #062f4f, #000000)" },
  { id: "9", title: "Girlfriend Manual", genre: "Romance", likes: "2.2M", isNew: false, coverBg: "linear-gradient(135deg, #581c87, #3b0764)" },
  { id: "10", title: "Aiming for the Alimony", genre: "Romance", likes: "919,423", isNew: true, coverBg: "linear-gradient(135deg, #111827, #1f2937)" },
  { id: "11", title: "Archmage Curriculum", genre: "Fantasy", likes: "61,697", isNew: true, coverBg: "linear-gradient(135deg, #065f46, #047857)" },
  { id: "12", title: "My Child Will Have a Different Father", genre: "Fantasy", likes: "2.1M", isNew: true, coverBg: "linear-gradient(135deg, #451a03, #78350f)" }
];

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("USER");
  const [joinedDate, setJoinedDate] = useState("Joined May 28, 2026");
  const [bio, setBio] = useState("Member of the Panelva universe.");
  const [wcoins, setWcoins] = useState(20);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "comments">("overview");

  useEffect(() => {
    const user = localStorage.getItem("panelva_user");
    if (!user) {
      router.push("/auth");
      return;
    }

    setUsername(user);

    // Dynamic role deduction
    const getRoleForUser = (usernameToCheck: string) => {
      if (!usernameToCheck) return "USER";
      const storedCurrentRole = localStorage.getItem("panelva_role");
      const storedCurrentUser = localStorage.getItem("panelva_user");
      if (storedCurrentRole && storedCurrentUser === usernameToCheck) {
        return storedCurrentRole;
      }
      try {
        const rolesMap = JSON.parse(localStorage.getItem("panelva_user_roles") || "{}");
        if (rolesMap[usernameToCheck]) return rolesMap[usernameToCheck];
      } catch (e) {}
      if (usernameToCheck === "notjud3" || usernameToCheck === "iseniyijude" || usernameToCheck === "iseniyijude_gmail" || usernameToCheck.toLowerCase().includes("master")) return "MASTER_ADMIN";
      if (usernameToCheck.toLowerCase().includes("admin") || usernameToCheck === "TO30") return "ADMIN";
      if (usernameToCheck.toLowerCase().includes("creator") || usernameToCheck.toLowerCase().includes("artist") || usernameToCheck.toLowerCase().includes("author") || usernameToCheck.toLowerCase().includes("novelist")) return "CREATOR";
      return "USER";
    };

    const role = getRoleForUser(user);
    setUserRole(role);

    // Joined date check
    const savedDate = localStorage.getItem("panelva_joined_date") || (user === "notjud3" ? "Joined May 28, 2026" : "Joined Just now");
    setJoinedDate(savedDate);

    // Load bio
    const savedBio = localStorage.getItem(`panelva_user_bio_${user}`);
    if (savedBio) {
      setBio(savedBio);
    } else {
      setBio("Member of the Panelva universe.");
    }

    // Load WCoins balance
    try {
      const savedStats = localStorage.getItem("panelva_creator_stats");
      if (savedStats && (role === "CREATOR" || role === "MASTER_ADMIN" || role === "ADMIN")) {
        const statsObj = JSON.parse(savedStats);
        setWcoins(statsObj.walletCoins);
      } else {
        setWcoins(20);
      }
    } catch (e) {}

    // Load bookmarks
    try {
      const savedBookmarks = localStorage.getItem(`panelva_bookmarks_${user}`) || localStorage.getItem("panelva_bookmarks") || "[]";
      setBookmarks(JSON.parse(savedBookmarks));
    } catch (e) {}
  }, [router]);

  const bookmarkedItems = SERIES_DB.filter(s => bookmarks.includes(s.id));
  const initials = username ? username.charAt(0).toUpperCase() : "U";

  // Clean role display badge
  const renderRoleBadge = () => {
    const badgeStyle: React.CSSProperties = {
      fontSize: "0.7rem",
      padding: "0.3em 0.9em",
      borderRadius: "9999px",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: "3px",
      letterSpacing: "0.02em",
      lineHeight: "1",
      whiteSpace: "nowrap",
      verticalAlign: "middle"
    };

    if (userRole === "MASTER_ADMIN") {
      return (
        <span style={{ ...badgeStyle, background: "#2563eb", color: "#fff" }}>
          <Sparkles size={10} style={{ fill: "#fff" }} /> MASTER
        </span>
      );
    } else if (userRole === "ADMIN") {
      return (
        <span style={{ ...badgeStyle, background: "#ef4444", color: "#fff" }}>
          ADMIN
        </span>
      );
    } else if (userRole === "CREATOR") {
      return (
        <span style={{ ...badgeStyle, background: "#10b981", color: "#fff" }}>
          CREATOR
        </span>
      );
    }
    return null;
  };

  return (
    <div className="profile-page" style={{ minHeight: "100vh", backgroundColor: "#07080a", color: "#fff", padding: "3rem 2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
        {/* Profile Card Header Container */}
        <div style={{
          position: "relative",
          width: "100%",
          background: "linear-gradient(180deg, rgba(37,99,235,0.06) 0%, rgba(13,14,18,0.98) 100%)",
          border: "1px solid #1c1e24",
          borderRadius: "20px",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
        }}>
          {/* Top Row Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button 
              onClick={() => router.back()} 
              style={{ color: "var(--text-dark-muted)", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
              className="hover:text-white transition"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ display: "flex", gap: "10px", color: "var(--text-dark-muted)" }}>
              <Link href="/settings" style={{ color: "inherit", display: "flex", alignItems: "center" }} className="hover:text-white transition">
                <Settings size={18} />
              </Link>
              <button onClick={() => alert("Profile options...")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center" }} className="hover:text-white transition">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {/* User Details */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ 
              width: "88px", 
              height: "88px", 
              borderRadius: "50%", 
              border: "3px solid #2563eb", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              fontSize: "2.2rem", 
              fontWeight: 800, 
              color: "#fff",
              background: "#1c1e24"
            }}>
              {initials}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "#fff" }}>{username}</h2>
                {renderRoleBadge()}
              </div>
              <span style={{ fontSize: "0.9rem", color: "var(--text-dark-muted)" }}>{joinedDate}</span>
            </div>
          </div>

          {/* Metrics row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginTop: "1rem" }}>
            <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "14px", background: "#07080a", border: "1px solid #1c1e24", borderRadius: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                <User size={16} />
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>0</div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>FOLLOWING</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "14px", background: "#07080a", border: "1px solid #1c1e24", borderRadius: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>Live</div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>CONCEPTS</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "14px", background: "#07080a", border: "1px solid #1c1e24", borderRadius: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(241, 196, 15, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#f1c40f" }}>
                <Coins size={16} />
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{wcoins}</div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>WCOINS</span>
              </div>
            </div>
          </div>

        </div>

        {/* Tab Selector bar */}
        <div style={{ display: "inline-flex", background: "#0d0e12", border: "1px solid #1c1e24", padding: "5px", borderRadius: "30px", gap: "6px", width: "100%", overflowX: "auto" }}>
          {[
            { id: "overview", label: "Overview", icon: <LayoutGrid size={15} /> },
            { id: "comments", label: "Comments", icon: <MessageSquare size={15} /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                background: activeTab === t.id ? "#07080a" : "transparent",
                border: activeTab === t.id ? "1px solid #1c1e24" : "1px solid transparent",
                color: activeTab === t.id ? "#fff" : "var(--text-dark-muted)",
                padding: "10px 24px",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: 1,
                justifyContent: "center"
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Bottom Split layout */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "2.5rem" }}>
            {/* Left Column: About */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>ABOUT</span>
              <div className="glass-panel" style={{ padding: "1.25rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", fontSize: "0.9rem", color: "#d1d5db", lineHeight: 1.6 }}>
                {bio}
              </div>
            </div>

            {/* Right Column: Library */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#fff" }}>Library</h3>
                <span style={{ fontSize: "0.7rem", background: "#1c1e24", padding: "4px 10px", borderRadius: "20px", fontWeight: 700, color: "var(--text-dark-muted)" }}>
                  {bookmarkedItems.length} TITLES
                </span>
              </div>

              {bookmarkedItems.length === 0 ? (
                <div style={{ 
                  border: "1.5px dashed #1c1e24", 
                  borderRadius: "16px", 
                  padding: "6rem 2rem", 
                  textAlign: "center", 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  gap: "1rem" 
                }}>
                  <LayoutGrid size={36} color="var(--text-dark-muted)" />
                  <div style={{ fontWeight: 600, color: "#d1d5db" }}>No series found.</div>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>Exploring the universe.</span>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.5rem" }}>
                  {bookmarkedItems.map((item) => (
                    <Link key={item.id} href={`/read/${item.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }} className="hover:opacity-90 transition">
                        <div style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "3/4",
                          borderRadius: "10px",
                          background: item.coverBg,
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          overflow: "hidden"
                        }}>
                          <div style={{ padding: "1rem", textAlign: "center", fontWeight: 800, fontSize: "0.95rem", color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                            {item.title}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", paddingLeft: "2px" }}>
                          <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "capitalize" }}>{item.genre}</span>
                          <h4 style={{ margin: "2px 0 4px 0", fontSize: "0.85rem", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.title}
                          </h4>
                          <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#10b981", fontSize: "0.75rem", fontWeight: "bold" }}>
                            <span>💚</span>
                            <span>{item.likes}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments Tab View */}
        {activeTab === "comments" && (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-dark-muted)", fontSize: "0.95rem", fontStyle: "italic", border: "1px dashed #1c1e24", borderRadius: "16px" }}>
            No comments made yet.
          </div>
        )}

      </div>
    </div>
  );
}
