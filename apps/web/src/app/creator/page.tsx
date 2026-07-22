"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Layers, BarChart3, Megaphone, HelpCircle, Coins, FileText,
  Search, Users, Sparkles, AlertCircle, Wallet, DollarSign, Gift, Play, Clock, 
  ArrowRight, Shield, Plus, Lock, Unlock, CheckCircle, Trash2, ArrowUpRight
} from "lucide-react";
import { useMemo } from "react";
import { trpc } from "../../lib/trpc";
import { TimeAgo } from "../../components/TimeAgo";

export default function CreatorPage() {
  const [currentUser, setCurrentUser] = useState("");
  const [userRole, setUserRole] = useState("USER");
  const [activeTab, setActiveTab] = useState<"dashboard" | "series" | "performance" | "ads" | "support" | "revenue" | "reports">("dashboard");

  // Core creator stats state
  const [stats, setStats] = useState({
    followers: 84,
    views: 8200,
    walletCoins: 1250,
    earningsUsd: 145.20,
    lifetimeUsd: 185.00,
    totalCoinsEarned: 9250
  });

  // Series List State
  const [seriesList, setSeriesList] = useState<any[]>([]);

  // Gifts and Payout History State
  const [gifts, setGifts] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  // Series Creation Form State
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"COMIC" | "NOVEL">("COMIC");
  const [collabPenName, setCollabPenName] = useState("");
  const [collabRatio, setCollabRatio] = useState(50);
  const [collaborators, setCollaborators] = useState<{ name: string; ratio: number }[]>([]);

  // DB-backed Collaboration hooks
  const isCreator = userRole === "CREATOR" || userRole === "MASTER_ADMIN" || userRole === "ADMIN";
  const { data: dbCreatorSeries, refetch: refetchCreatorSeries } = trpc.series.getCreatorSeries.useQuery(undefined, {
    enabled: isCreator,
  });

  const { data: vettedCreators } = trpc.collaboration.listVettedCreators.useQuery(undefined, {
    enabled: isCreator,
  });

  const sendInviteMutation = trpc.collaboration.sendInvitation.useMutation({
    onSuccess: () => {
      refetchCreatorSeries();
      alert("Collaboration invitation sent successfully!");
    },
    onError: (err) => {
      alert(`Failed to send invitation: ${err.message}`);
    }
  });

  const cancelInviteMutation = trpc.collaboration.cancelInvitation.useMutation({
    onSuccess: () => {
      refetchCreatorSeries();
      alert("Invitation cancelled successfully!");
    },
    onError: (err) => {
      alert(`Failed to cancel invitation: ${err.message}`);
    }
  });

  // Invitation Form State
  const [activeInviteSeriesId, setActiveInviteSeriesId] = useState<string | null>(null);
  const [inviteReceiverId, setInviteReceiverId] = useState("");
  const [inviteRole, setInviteRole] = useState("Illustrator");
  const [inviteRoleDesc, setInviteRoleDesc] = useState("");
  const [inviteRatio, setInviteRatio] = useState(25);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteTerms, setInviteTerms] = useState("");

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInviteSeriesId || !inviteReceiverId) {
      alert("Please select a creator to invite");
      return;
    }
    sendInviteMutation.mutate({
      seriesId: activeInviteSeriesId,
      receiverId: inviteReceiverId,
      role: inviteRole as any,
      roleDescription: inviteRoleDesc || undefined,
      shareRatio: Number(inviteRatio),
      message: inviteMessage || undefined,
      terms: inviteTerms || undefined,
    });
    setInviteReceiverId("");
    setInviteRole("Illustrator");
    setInviteRoleDesc("");
    setInviteRatio(25);
    setInviteMessage("");
    setInviteTerms("");
    setActiveInviteSeriesId(null);
  };

  const handleCancelInvite = (invitationId: string) => {
    if (confirm("Are you sure you want to cancel this invitation?")) {
      cancelInviteMutation.mutate({ invitationId });
    }
  };

  // Combine database series and local storage series list
  const combinedSeries = useMemo(() => {
    const list = [...seriesList].map(s => ({ ...s, isDbBacked: false }));
    if (dbCreatorSeries) {
      dbCreatorSeries.forEach((dbs) => {
        // Find existing match by title or ID
        const idx = list.findIndex(
          (s) => s.id === dbs.id || s.title.toLowerCase() === dbs.title.toLowerCase()
        );

        const mapped = {
          id: dbs.id,
          title: dbs.title,
          type: dbs.type,
          views: dbs.views,
          likes: dbs.likes,
          status: dbs.status,
          coverUrl: dbs.coverUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop",
          description: dbs.description,
          adSystemEnabled: dbs.adSystemEnabled,
          milestoneLocked: dbs.milestoneLocked,
          waitForFreeDays: dbs.waitForFreeDays,
          collaborators: dbs.collaborators.map((c: any) => ({
            name: c.user.creatorProfiles[0]?.penName || c.user.username,
            ratio: c.shareRatio,
            role: c.role,
          })),
          pendingInvitations: dbs.invitations
            .filter((i: any) => i.status === "PENDING")
            .map((i: any) => ({
              id: i.id,
              receiverName: i.receiver.creatorProfiles[0]?.penName || i.receiver.username,
              ratio: i.shareRatio,
              role: i.role,
              status: i.status,
            })),
          isDbBacked: true,
        };

        if (idx !== -1) {
          list[idx] = mapped;
        } else {
          list.push(mapped);
        }
      });
    }
    return list;
  }, [seriesList, dbCreatorSeries]);

  // Sync state with localStorage on mount
  useEffect(() => {
    const user = localStorage.getItem("panelva_user") || "Guest";
    setCurrentUser(user);

    // Shared role-checking logic
    const getRoleForUser = (usernameToCheck: string) => {
      if (!usernameToCheck || usernameToCheck === "Guest") return "USER";
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

    // Load series list
    const savedSeries = localStorage.getItem("panelva_creator_series");
    if (savedSeries) {
      setSeriesList(JSON.parse(savedSeries));
    } else {
      const INITIAL_SERIES = [
        {
          id: "ser-1",
          title: "Shadow Hunter Chronicles",
          type: "COMIC",
          views: 6500,
          likes: 420,
          status: "Ongoing",
          adSystemEnabled: true,
          milestoneLocked: false,
          waitForFreeDays: 7,
          collaborators: [
            { name: "ArtistLine", ratio: 50 },
            { name: "MangaCreatorPro", ratio: 50 },
          ],
          createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString()
        },
        {
          id: "ser-2",
          title: "The Silent Alchemist",
          type: "NOVEL",
          views: 1700,
          likes: 98,
          status: "Completed",
          adSystemEnabled: false,
          milestoneLocked: true,
          waitForFreeDays: 5,
          collaborators: [],
          createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString()
        },
      ];
      localStorage.setItem("panelva_creator_series", JSON.stringify(INITIAL_SERIES));
      setSeriesList(INITIAL_SERIES);
    }

    // Load gifts list
    const savedGifts = localStorage.getItem("panelva_creator_gifts");
    if (savedGifts) {
      setGifts(JSON.parse(savedGifts));
    } else {
      localStorage.setItem("panelva_creator_gifts", JSON.stringify([]));
      setGifts([]);
    }

    // Load payouts list
    const savedPayouts = localStorage.getItem("panelva_creator_payouts");
    if (savedPayouts) {
      setPayouts(JSON.parse(savedPayouts));
    } else {
      localStorage.setItem("panelva_creator_payouts", JSON.stringify([]));
      setPayouts([]);
    }

    // Load stats
    const savedStats = localStorage.getItem("panelva_creator_stats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    } else {
      const initialStats = {
        followers: user.toLowerCase().includes("creator") || user === "notjud3" ? 120 : 84,
        views: user.toLowerCase().includes("creator") || user === "notjud3" ? 14200 : 8200,
        walletCoins: 1250,
        earningsUsd: 145.20,
        lifetimeUsd: 185.00,
        totalCoinsEarned: 9250
      };
      localStorage.setItem("panelva_creator_stats", JSON.stringify(initialStats));
      setStats(initialStats);
    }
  }, []);

  const isMonetizationEligible = stats.followers >= 100 || stats.views >= 10000;

  // Actions
  const handleAddCollaborator = () => {
    if (!collabPenName.trim()) return;
    setCollaborators([...collaborators, { name: collabPenName, ratio: Number(collabRatio) }]);
    setCollabPenName("");
  };

  const handleCreateSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const currentTotal = collaborators.reduce((acc, c) => acc + c.ratio, 0);
    const creatorRatio = 100 - currentTotal;

    if (creatorRatio < 0) {
      alert("Collaborators share cannot exceed 100%!");
      return;
    }

    const allCollabs = [
      ...collaborators,
      { name: currentUser, ratio: creatorRatio }
    ];

    const newSeries = {
      id: `ser-${Date.now()}`,
      title: newTitle,
      type: newType,
      views: 0,
      likes: 0,
      status: "Coming soon",
      adSystemEnabled: true,
      milestoneLocked: false,
      waitForFreeDays: 7,
      collaborators: allCollabs,
      createdAt: new Date().toISOString()
    };

    const updatedList = [newSeries, ...seriesList];
    setSeriesList(updatedList);
    localStorage.setItem("panelva_creator_series", JSON.stringify(updatedList));

    setNewTitle("");
    setCollaborators([]);
    setActiveTab("dashboard"); // Return to Dashboard to see the new activity
    alert(`"${newTitle}" series created and split ratio request dispatched!`);
  };

  const handleToggleAd = (id: string) => {
    const updated = seriesList.map(s => s.id === id ? { ...s, adSystemEnabled: !s.adSystemEnabled } : s);
    setSeriesList(updated);
    localStorage.setItem("panelva_creator_series", JSON.stringify(updated));
  };

  const handleToggleLock = (id: string) => {
    const updated = seriesList.map(s => s.id === id ? { ...s, milestoneLocked: !s.milestoneLocked } : s);
    setSeriesList(updated);
    localStorage.setItem("panelva_creator_series", JSON.stringify(updated));
  };

  const handleChangeStatus = (id: string, title: string, newStatus: string) => {
    const updated = seriesList.map(s => s.id === id ? { ...s, status: newStatus } : s);
    setSeriesList(updated);
    localStorage.setItem("panelva_creator_series", JSON.stringify(updated));

    // Send notifications to library subscribers
    const newNotification = {
      id: Date.now().toString(),
      text: `"${title}" status updated to "${newStatus}" by creator.`,
      timestamp: new Date().toLocaleTimeString()
    };

    const existing = localStorage.getItem("panelva_notifications");
    const list = existing ? JSON.parse(existing) : [];
    list.unshift(newNotification);
    localStorage.setItem("panelva_notifications", JSON.stringify(list));

    const unread = localStorage.getItem("panelva_notifications_unread") || "0";
    localStorage.setItem("panelva_notifications_unread", (Number(unread) + 1).toString());

    window.dispatchEvent(new Event("panelva_notification_update"));
    alert(`Status updated to "${newStatus}". Subscribers of "${title}" have been notified!`);
  };

  // Simulate receiving WCoins support
  const handleSimulateSupport = () => {
    const supportAmountCoins = 5000; // 5000 coins = $5.00 USD
    const supportValueUsd = 5.00;
    
    const names = ["AnimeFan99", "MangaReaderX", "PanelvaSup", "BobTheNovelist", "ChibiIllustrator"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    const newGift = {
      reader: randomName,
      gift: "Super Support Pack",
      wcoins: supportAmountCoins,
      date: new Date().toISOString()
    };

    const updatedGifts = [newGift, ...gifts];
    setGifts(updatedGifts);
    localStorage.setItem("panelva_creator_gifts", JSON.stringify(updatedGifts));

    const updatedStats = {
      ...stats,
      walletCoins: stats.walletCoins + supportAmountCoins,
      earningsUsd: Number((stats.earningsUsd + supportValueUsd).toFixed(2)),
      lifetimeUsd: Number((stats.lifetimeUsd + supportValueUsd).toFixed(2)),
      totalCoinsEarned: stats.totalCoinsEarned + supportAmountCoins
    };
    setStats(updatedStats);
    localStorage.setItem("panelva_creator_stats", JSON.stringify(updatedStats));

    alert(`Simulated Support: @${randomName} gifted you 5,000 WCoins! Earned $5.00 USD.`);
  };

  // Payout request
  const handleWithdrawal = () => {
    if (stats.earningsUsd < 25) return;
    
    const withdrawAmount = stats.earningsUsd;
    const newPayout = {
      date: new Date().toLocaleDateString(),
      status: "PENDING",
      amount: `$${withdrawAmount.toFixed(2)}`
    };

    // Add to Payout history
    const updatedPayouts = [newPayout, ...payouts];
    setPayouts(updatedPayouts);
    localStorage.setItem("panelva_creator_payouts", JSON.stringify(updatedPayouts));

    // Reset current payout balance
    const updatedStats = {
      ...stats,
      earningsUsd: 0.00
    };
    setStats(updatedStats);
    localStorage.setItem("panelva_creator_stats", JSON.stringify(updatedStats));

    // Sync back to global payouts list for admins to review
    try {
      const globalPayouts = JSON.parse(localStorage.getItem("panelva_payouts") || "[]");
      globalPayouts.unshift({
        id: `pay-${Date.now()}`,
        creator: currentUser,
        amount: `$${withdrawAmount.toFixed(2)}`,
        status: "PENDING",
        date: new Date().toISOString()
      });
      localStorage.setItem("panelva_payouts", JSON.stringify(globalPayouts));
    } catch (e) {}

    alert(`Payout request of $${withdrawAmount.toFixed(2)} successfully sent to Admin Vetting Queue!`);
  };

  // Become creator promo
  if (!isCreator) {
    return (
      <div className="creator-page" style={{ minHeight: "80vh", backgroundColor: "var(--bg-color)", color: "var(--text-color)", display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
        <div className="glass-panel" style={{ padding: "3rem", maxWidth: "480px", textAlign: "center", display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center", background: "var(--panel-color)", border: "1px solid var(--border-color)", borderRadius: "16px" }}>
          <Shield size={64} color="#2563eb" />
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>Creator Studio</h2>
          <p style={{ color: "var(--text-dark-muted)", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
            You are not currently registered as a Panelva Creator. To begin publishing your visual comics, prose novels, manage splitted revenue with collaborators, and monetize your content, please submit an application.
          </p>
          <Link href="/creator/apply">
            <button style={{ background: "var(--gradient-main)", border: "none", color: "#fff", padding: "12px 28px", borderRadius: "20px", fontWeight: 700, cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
              Apply to Become Creator
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-page" style={{ display: "flex", minHeight: "calc(100vh - 64px)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontFamily: "var(--font-sans)" }}>
      
      {/* ─── LEFT SIDEBAR NAVIGATION ─── */}
      <aside style={{ width: "90px", background: "var(--panel-color)", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: "24px", flexShrink: 0 }}>
        {/* Blue W Logo */}
        <div style={{ width: "40px", height: "40px", backgroundColor: "#2563eb", color: "#fff", borderRadius: "10px", fontSize: "1.35rem", fontWeight: 900, display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "16px" }}>
          W
        </div>

        {/* Navigation buttons */}
        {[
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
          { id: "series", label: "Series", icon: <Layers size={20} /> },
          { id: "performance", label: "Performance", icon: <BarChart3 size={20} /> },
          { id: "ads", label: "Ads", icon: <Megaphone size={20} /> },
          { id: "support", label: "Support", icon: <HelpCircle size={20} /> },
          { id: "revenue", label: "Revenue", icon: <Coins size={20} /> },
          { id: "reports", label: "Reports", icon: <FileText size={20} /> }
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: isActive ? "#2563eb" : "var(--text-dark-muted)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                padding: "8px 0",
                transition: "color 0.2s, background-color 0.2s",
                borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
                backgroundColor: isActive ? "rgba(37, 99, 235, 0.04)" : "transparent"
              }}
              className={isActive ? "" : "hover:text-white"}
            >
              {item.icon}
              <span style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "capitalize" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <main style={{ flex: 1, padding: "3rem 2.5rem", overflowY: "auto" }}>
        
        {/* ─── 1. DASHBOARD VIEW (CREATOR HOME) ─── */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Header Title Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, margin: 0, color: "#fff" }}>Creator Home</h1>
                <p style={{ color: "var(--text-dark-muted)", margin: "0.25rem 0 0 0", fontSize: "1rem" }}>Tracking your impact across the Panelva.</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => alert("Search creator works...")} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0d0e12", border: "1px solid #1c1e24", color: "var(--text-dark-muted)", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }} className="hover:text-white transition">
                  <Search size={18} />
                </button>
                <button onClick={() => alert("Manage studio staff and collaborators splits...")} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0d0e12", border: "1px solid #1c1e24", color: "var(--text-dark-muted)", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }} className="hover:text-white transition">
                  <Users size={18} />
                </button>
              </div>
            </div>

            {/* Metrics cards row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
              <div className="glass-panel" style={{ padding: "2rem 1.5rem", textAlign: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff" }}>{stats.views}</div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "8px", display: "block" }}>PLATFORM VIEWS</span>
              </div>
              <div className="glass-panel" style={{ padding: "2rem 1.5rem", textAlign: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff" }}>{stats.totalCoinsEarned}</div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "8px", display: "block" }}>EARNED WCOINS</span>
              </div>
              <div className="glass-panel" style={{ padding: "2rem 1.5rem", textAlign: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff" }}>${stats.earningsUsd.toFixed(2)}</div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "8px", display: "block" }}>PAYOUT BALANCE</span>
              </div>
            </div>

            {/* Split layout: left widgets vs right panels */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
              {/* Left Widget Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                
                {/* Management Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <BarChart3 size={18} color="#2563eb" />
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Management</h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <button 
                      onClick={() => setActiveTab("series")}
                      style={{ padding: "2.5rem 1.5rem", textAlign: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", color: "#fff", cursor: "pointer", transition: "transform 0.2s" }}
                      className="hover:scale-102"
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <Play size={24} color="#2563eb" style={{ margin: "0 auto 12px auto" }} />
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Series & Episodes</div>
                    </button>
                    <button 
                      onClick={() => setActiveTab("revenue")}
                      style={{ padding: "2.5rem 1.5rem", textAlign: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", color: "#fff", cursor: "pointer", transition: "transform 0.2s" }}
                      className="hover:scale-102"
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <Coins size={24} color="#2563eb" style={{ margin: "0 auto 12px auto" }} />
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Revenue & Payouts</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={18} color="#2563eb" />
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Recent Activity</h2>
                  </div>
                  
                  {combinedSeries.length === 0 ? (
                    <div style={{ border: "1.5px dashed #1c1e24", borderRadius: "16px", padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                      <Plus size={36} color="var(--text-dark-muted)" />
                      <div style={{ fontWeight: 600, color: "#d1d5db" }}>No series found. Ready to start?</div>
                      <button onClick={() => setActiveTab("series")} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                        Publish your first series <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {combinedSeries.slice(0, 3).map((s) => (
                        <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "12px" }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>{s.title}</span>
                            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-dark-muted)" }}>Format: {s.type} &bull; Views: {s.views} &bull; Status: {s.status}</span>
                          </div>
                          <button onClick={() => { setActiveTab("series"); }} style={{ border: "1px solid #1c1e24", background: "none", color: "#2563eb", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }} className="hover:bg-primary-alpha transition">
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Sidebar Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Creator Resources */}
                <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563eb" }}>
                    <Sparkles size={18} />
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "#fff" }}>Creator Resources</h3>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", margin: 0, lineHeight: 1.5 }}>
                    Stand out in the Panelva. Download our branding kit to make your social media posts look professional.
                  </p>
                  <button onClick={() => alert("Downloading Panelva branding kit asset pack...")} style={{ background: "#16171a", border: "1px solid #2c2d30", color: "#fff", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", width: "100%", marginTop: "8px" }} className="hover:bg-grey transition">
                    Get Asset Kit
                  </button>
                </div>

                {/* Support & Feedback */}
                <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563eb" }}>
                    <HelpCircle size={18} />
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "#fff" }}>Support & Feedback</h3>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", margin: 0, lineHeight: 1.5 }}>
                    Have questions about monetization or upload limits?
                  </p>
                  <button onClick={() => setActiveTab("support")} style={{ background: "transparent", border: "1px solid #1c1e24", color: "#fff", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", width: "100%", marginTop: "8px" }} className="hover:bg-primary-alpha transition">
                    Visit Help Center
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ─── 2. REVENUE VIEW (CREATOR REVENUE) ─── */}
        {activeTab === "revenue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Header */}
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: "12px" }}>
                <Coins size={36} color="#2563eb" /> Revenue
              </h1>
              <p style={{ color: "var(--text-dark-muted)", margin: "0.25rem 0 0 0", fontSize: "1rem" }}>Manage your earnings and payouts.</p>
            </div>

            {/* Predictable Payouts Alert */}
            <div style={{ display: "flex", gap: "12px", background: "rgba(37, 99, 235, 0.05)", border: "1px solid rgba(37, 99, 235, 0.15)", borderRadius: "12px", padding: "1.25rem" }}>
              <AlertCircle size={20} color="#2563eb" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>Predictable Payouts</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>Your gifted WCoins convert to payout balance at a flat rate of 1,000 WCoins = $1.00.</p>
              </div>
            </div>

            {/* Metrics cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", display: "block" }}>PAYOUT BALANCE</span>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>${stats.earningsUsd.toFixed(2)}</div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", display: "block", marginTop: "4px" }}>Available for withdrawal</span>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                  <Wallet size={20} />
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", display: "block" }}>LIFETIME</span>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>${stats.lifetimeUsd.toFixed(2)}</div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", display: "block", marginTop: "4px" }}>Total channel earnings</span>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#10b981" }}>
                  <DollarSign size={20} />
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", display: "block" }}>TOTAL WCOINS</span>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{stats.totalCoinsEarned}</div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", display: "block", marginTop: "4px" }}>From reader support</span>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(241, 196, 15, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#f1c40f" }}>
                  <Gift size={20} />
                </div>
              </div>
            </div>

            {/* Withdrawal Action button */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <button 
                onClick={handleWithdrawal}
                disabled={stats.earningsUsd < 25}
                style={{
                  background: stats.earningsUsd >= 25 ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "rgba(37,99,235,0.12)",
                  border: "none",
                  color: stats.earningsUsd >= 25 ? "#fff" : "var(--text-dark-muted)",
                  padding: "12px 28px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: stats.earningsUsd >= 25 ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s"
                }}
              >
                <DollarSign size={16} />
                {stats.earningsUsd >= 25 ? "Withdraw Earnings" : `Reach $25 to withdraw`}
              </button>

              <button 
                onClick={handleSimulateSupport}
                style={{
                  background: "transparent",
                  border: "1px dashed #2563eb",
                  color: "#2563eb",
                  padding: "11px 20px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                title="Simulate reader support of 5,000 WCoins ($5.00 USD) for testing"
              >
                <Plus size={16} /> Simulate Reader Support
              </button>
            </div>

            {/* Two tables split */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              {/* Recent Support */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} color="#2563eb" />
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Recent Support</h3>
                </div>
                <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  {gifts.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-dark-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
                      No gifts received.
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1c1e24", color: "var(--text-dark-muted)" }}>
                          <th style={{ padding: "10px" }}>Reader</th>
                          <th style={{ padding: "10px" }}>Gift</th>
                          <th style={{ padding: "10px", textAlign: "right" }}>WCoins</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gifts.map((g, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                            <td style={{ padding: "12px 10px", fontWeight: 600, color: "#fff" }}>@{g.reader}</td>
                            <td style={{ padding: "12px 10px", color: "#d1d5db" }}>{g.gift}</td>
                            <td style={{ padding: "12px 10px", color: "var(--secondary)", fontWeight: 700, textAlign: "right" }}>+{g.wcoins}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Payout History */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} color="#2563eb" />
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Payout History</h3>
                </div>
                <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  {payouts.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-dark-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
                      No payouts found.
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1c1e24", color: "var(--text-dark-muted)" }}>
                          <th style={{ padding: "10px" }}>Date</th>
                          <th style={{ padding: "10px" }}>Status</th>
                          <th style={{ padding: "10px", textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                            <td style={{ padding: "12px 10px", color: "#d1d5db" }}>{p.date}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ color: p.status === "COMPLETED" ? "#10b981" : "#2563eb", fontWeight: 700 }}>
                                {p.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: 700, textAlign: "right", color: "#fff" }}>{p.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ─── 3. SERIES VIEW (UPLOAD & SPLITS) ─── */}
        {activeTab === "series" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "2.5rem" }}>
            
            {/* Uploaded Series list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, margin: 0, color: "#fff" }}>Your Series</h1>
                <p style={{ color: "var(--text-dark-muted)", margin: "0.25rem 0 0 0" }}>Status governance and monetization checks</p>
              </div>

              {combinedSeries.map((s) => (
                <div key={s.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#fff" }}>{s.title}</h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)" }}>Type: {s.type} &bull; {s.views} views</span>
                      {s.isDbBacked && (
                        <span style={{ marginLeft: "8px", fontSize: "0.65rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                          DB BACKED
                        </span>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", background: "rgba(37,99,235,0.12)", color: "#2563eb", padding: "4px 8px", borderRadius: "4px", fontWeight: 600 }}>
                        Paywall: {s.milestoneLocked ? "Locked" : "Unlocked"}
                      </span>
                    </div>
                  </div>

                  {s.collaborators && s.collaborators.length > 0 && (
                    <div style={{ fontSize: "0.8rem", background: "#07080a", border: "1px solid #1c1e24", padding: "10px 14px", borderRadius: "8px" }}>
                      <strong style={{ color: "#fff" }}>Revenue Splits configuration:</strong>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                        {s.collaborators.map((c: any, idx: number) => (
                          <span key={idx} style={{ background: "#1c1e24", padding: "3px 8px", borderRadius: "4px", fontSize: "0.75rem", color: "#d1d5db" }}>
                            {c.name} ({c.role || "Collaborator"}): {c.ratio}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {s.isDbBacked && s.pendingInvitations && s.pendingInvitations.length > 0 && (
                    <div style={{ fontSize: "0.8rem", background: "rgba(37,99,235,0.02)", border: "1px solid rgba(37,99,235,0.12)", padding: "10px 14px", borderRadius: "8px" }}>
                      <strong style={{ color: "#3b82f6" }}>Pending Collaboration Invites:</strong>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                        {s.pendingInvitations.map((i: any) => (
                          <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "#d1d5db" }}>
                              @{i.receiverName} as <strong>{i.role}</strong> ({i.ratio}%)
                            </span>
                            <button
                              onClick={() => handleCancelInvite(i.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                padding: "2px 6px",
                              }}
                              className="hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {s.isDbBacked && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem" }}>
                      {activeInviteSeriesId === s.id ? (
                        <form onSubmit={handleSendInvite} style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "0.8rem", color: "#fff" }}>Send Collaboration Invite</strong>
                            <button 
                              type="button" 
                              onClick={() => setActiveInviteSeriesId(null)}
                              style={{ background: "none", border: "none", color: "#a1a1aa", fontSize: "0.75rem", cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-dark-muted)", marginBottom: "4px" }}>Select Verified Creator</label>
                            <select
                              value={inviteReceiverId}
                              onChange={(e) => setInviteReceiverId(e.target.value)}
                              required
                              style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", color: "#fff", padding: "6px", borderRadius: "6px", fontSize: "0.8rem" }}
                            >
                              <option value="">-- Choose Creator --</option>
                              {vettedCreators?.map((c: any) => (
                                <option key={c.user.id} value={c.user.id}>
                                  @{c.penName} ({c.type})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-dark-muted)", marginBottom: "4px" }}>Role</label>
                              <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", color: "#fff", padding: "6px", borderRadius: "6px", fontSize: "0.8rem" }}
                              >
                                <option value="Writer">Writer</option>
                                <option value="Illustrator">Illustrator</option>
                                <option value="Colorist">Colorist</option>
                                <option value="Editor">Editor</option>
                                <option value="Studio">Studio</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-dark-muted)", marginBottom: "4px" }}>Share %</label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={inviteRatio}
                                onChange={(e) => setInviteRatio(Number(e.target.value))}
                                required
                                style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", color: "#fff", padding: "6px", borderRadius: "6px", fontSize: "0.8rem" }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-dark-muted)", marginBottom: "4px" }}>Responsibilities Description</label>
                            <input
                              type="text"
                              placeholder="e.g., Lineart, storyboard sketching"
                              value={inviteRoleDesc}
                              onChange={(e) => setInviteRoleDesc(e.target.value)}
                              style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", color: "#fff", padding: "6px", borderRadius: "6px", fontSize: "0.8rem" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-dark-muted)", marginBottom: "4px" }}>Message</label>
                            <input
                              type="text"
                              placeholder="Optional message..."
                              value={inviteMessage}
                              onChange={(e) => setInviteMessage(e.target.value)}
                              style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", color: "#fff", padding: "6px", borderRadius: "6px", fontSize: "0.8rem" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-dark-muted)", marginBottom: "4px" }}>Terms & Conditions</label>
                            <input
                              type="text"
                              placeholder="Optional terms..."
                              value={inviteTerms}
                              onChange={(e) => setInviteTerms(e.target.value)}
                              style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", color: "#fff", padding: "6px", borderRadius: "6px", fontSize: "0.8rem" }}
                            />
                          </div>

                          <button
                            type="submit"
                            style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", marginTop: "4px" }}
                          >
                            Send Collaboration Invitation
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveInviteSeriesId(s.id);
                            if (vettedCreators && vettedCreators.length > 0) {
                              setInviteReceiverId(vettedCreators[0].user.id);
                            }
                          }}
                          style={{
                            background: "transparent",
                            border: "1px dashed #2563eb",
                            color: "#2563eb",
                            padding: "8px",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <Plus size={14} /> Invite Co-Creator
                        </button>
                      )}
                    </div>
                  )}

                  {/* Status selection dropdown */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid #1c1e24", paddingTop: "1rem" }}>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", fontWeight: 700 }}>Series Status Selector:</label>
                    <select 
                      value={s.status || "Ongoing"} 
                      onChange={(e) => handleChangeStatus(s.id, s.title, e.target.value)}
                      style={{ background: "#07080a", border: "1px solid #1c1e24", color: "#fff", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", outline: "none" }}
                    >
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Hiatus">Hiatus</option>
                      <option value="Season ended">Season ended</option>
                      <option value="New Season Coming soon">New Season Coming soon</option>
                      <option value="Coming soon">Coming soon</option>
                    </select>
                  </div>

                  {/* Ads and Locked Paywall actions */}
                  <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #1c1e24", paddingTop: "1rem" }}>
                    <button 
                      onClick={() => handleToggleAd(s.id)}
                      disabled={!isMonetizationEligible}
                      style={{
                        flex: 1,
                        background: s.adSystemEnabled ? "#2563eb" : "transparent",
                        border: s.adSystemEnabled ? "none" : "1px solid #1c1e24",
                        color: "#fff",
                        padding: "8px",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: isMonetizationEligible ? "pointer" : "not-allowed",
                        opacity: isMonetizationEligible ? 1 : 0.5
                      }}
                    >
                      Ads: {s.adSystemEnabled ? "Active" : "Disabled"}
                    </button>

                    <button 
                      onClick={() => handleToggleLock(s.id)}
                      disabled={!isMonetizationEligible}
                      style={{
                        flex: 1,
                        background: s.milestoneLocked ? "var(--secondary)" : "transparent",
                        border: s.milestoneLocked ? "none" : "1px solid #1c1e24",
                        color: "#fff",
                        padding: "8px",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: isMonetizationEligible ? "pointer" : "not-allowed",
                        opacity: isMonetizationEligible ? 1 : 0.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      {s.milestoneLocked ? <Lock size={14} /> : <Unlock size={14} />}
                      Paywall: {s.milestoneLocked ? "Locked" : "Unlocked"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Creator Upload form */}
            <div className="glass-panel" style={{ padding: "2rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 1.5rem 0", color: "#fff" }}>Upload New Series</h2>
              <form onSubmit={handleCreateSeries} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "6px", fontWeight: 600 }}>Series Title</label>
                  <input 
                    type="text" 
                    placeholder="Enter series title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", padding: "10px 14px", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "6px", fontWeight: 600 }}>Format Type</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "COMIC" | "NOVEL")}
                    style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", padding: "10px 14px", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }}
                  >
                    <option value="COMIC">Visual Comic</option>
                    <option value="NOVEL">Prose Novel</option>
                  </select>
                </div>

                <div style={{ border: "1px solid #1c1e24", padding: "1rem", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.15)" }}>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "0.9rem", color: "#fff", fontWeight: 700 }}>Creator Splits Config</h4>
                  <p style={{ margin: "0 0 1rem 0", fontSize: "0.75rem", color: "var(--text-dark-muted)" }}>
                    Add co-creators (illustrators, proofreaders). Remaining share is allocated to you.
                  </p>

                  <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
                    <input 
                      type="text" 
                      placeholder="Partner pen name..."
                      value={collabPenName}
                      onChange={(e) => setCollabPenName(e.target.value)}
                      style={{ flex: 2, background: "#07080a", border: "1px solid #1c1e24", padding: "8px 12px", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
                    />
                    <input 
                      type="number" 
                      min="1" 
                      max="99" 
                      value={collabRatio}
                      onChange={(e) => setCollabRatio(Number(e.target.value))}
                      style={{ flex: 1, background: "#07080a", border: "1px solid #1c1e24", padding: "8px 12px", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
                    />
                    <button 
                      type="button"
                      onClick={handleAddCollaborator}
                      style={{ background: "#2563eb", border: "none", color: "#fff", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                    >
                      Add
                    </button>
                  </div>

                  {collaborators.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {collaborators.map((c, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", background: "#07080a", padding: "6px 10px", borderRadius: "4px" }}>
                          <span>@{c.name} (Partner)</span>
                          <strong>{c.ratio}% share</strong>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", background: "rgba(37,99,235,0.1)", padding: "6px 10px", borderRadius: "4px", color: "#2563eb" }}>
                        <span>@{currentUser} (You)</span>
                        <strong>{100 - collaborators.reduce((acc, c) => acc + c.ratio, 0)}% share</strong>
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" style={{ background: "var(--gradient-main)", border: "none", color: "#fff", padding: "12px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", marginTop: "1rem" }}>
                  Publish & request Splits Agreement
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── 4. PERFORMANCE VIEW (MOCK GRAPHS) ─── */}
        {activeTab === "performance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, margin: 0, color: "#fff" }}>Performance Metrics</h1>
              <p style={{ color: "var(--text-dark-muted)", margin: "0.25rem 0 0 0" }}>Interactive stats overview and reader retention</p>
            </div>

            <div className="glass-panel" style={{ padding: "2rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
              <h3 style={{ margin: "0 0 1.5rem 0", color: "#fff" }}>Platform Engagement Chart</h3>
              <div style={{ height: "240px", background: "#07080a", borderRadius: "12px", border: "1px solid #1c1e24", display: "flex", alignItems: "flex-end", padding: "20px", gap: "20px", justifyContent: "space-around" }}>
                {[
                  { m: "Jan", v: 24 }, { m: "Feb", v: 45 }, { m: "Mar", v: 30 },
                  { m: "Apr", v: 65 }, { m: "May", v: 80 }, { m: "Jun", v: 95 }
                ].map((val, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "10px" }}>
                    <div style={{ height: `${val.v * 1.8}px`, width: "100%", background: "linear-gradient(180deg, #2563eb, rgba(37,99,235,0.25))", borderRadius: "6px" }}></div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)" }}>{val.m}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", marginTop: "1rem" }}>
                * Displaying platform views growth rate in thousands. Reader retention stands at a healthy **78.4%** across series.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#fff" }}>Follower Growth</h4>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981" }}>+14.2%</div>
                <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>Follower increase in the last 15 days.</p>
              </div>
              <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#fff" }}>Likes Ratio</h4>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#2563eb" }}>6.4%</div>
                <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>Engagement score (total likes / total views).</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── 5. ADS PANEL ─── */}
        {activeTab === "ads" && (
          <div className="glass-panel" style={{ padding: "2rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>Monetization & Ads Configuration</h2>
              <p style={{ color: "var(--text-dark-muted)", margin: "0.25rem 0 0 0" }}>Control how banner ads and split monetization are enabled for your library</p>
            </div>

            <div style={{ display: "flex", gap: "12px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.12)", padding: "1rem", borderRadius: "8px" }}>
              <AlertCircle size={20} color="#2563eb" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: "0.85rem", color: "#d1d5db" }}>
                Monetization options are locked until your account meets the minimum eligibility check of 100 followers or 10,000 views. Standard ads splits pay creators 70% of split impressions.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1c1e24", paddingBottom: "12px" }}>
                <div>
                  <strong style={{ display: "block", color: "#fff" }}>Banner Ad Revenue Share</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>Allows ads to run at the bottom of visual chapters</span>
                </div>
                <span style={{ color: isMonetizationEligible ? "#10b981" : "#ef4444", fontWeight: 700, fontSize: "0.85rem" }}>
                  {isMonetizationEligible ? "ELIGIBLE" : "LOCKED"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1c1e24", paddingBottom: "12px" }}>
                <div>
                  <strong style={{ display: "block", color: "#fff" }}>Video Promo Splits</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>Enables split reward coins for watching short ad sponsors</span>
                </div>
                <span style={{ color: isMonetizationEligible ? "#10b981" : "#ef4444", fontWeight: 700, fontSize: "0.85rem" }}>
                  {isMonetizationEligible ? "ELIGIBLE" : "LOCKED"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── 6. SUPPORT PANEL ─── */}
        {activeTab === "support" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, margin: 0, color: "#fff" }}>Help & Creator Support</h1>
              <p style={{ color: "var(--text-dark-muted)", margin: "0.25rem 0 0 0" }}>FAQs, limits, splits documentation and support tickets</p>
            </div>

            <div className="glass-panel" style={{ padding: "2rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>Frequently Asked Questions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <strong style={{ color: "#fff", display: "block" }}>How do revenue splits work?</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>Splits are configured at publication and are immutable for that series once accepted by all partners. Platform takes a 25% cut.</span>
                </div>
                <div>
                  <strong style={{ color: "#fff", display: "block" }}>What are visual comic upload specifications?</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>Upload pages vertically, keeping width under 800px. JPG/PNG formats are supported. Max 20MB per chapter.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 7. REPORTS PANEL ─── */}
        {activeTab === "reports" && (
          <div className="glass-panel" style={{ padding: "2rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 8px 0", color: "#fff" }}>Creator Abuse Reports</h2>
            <p style={{ color: "var(--text-dark-muted)", margin: "0 0 1.5rem 0" }}>Safety reports targeting comments or uploads on your channel</p>
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-dark-muted)", fontSize: "0.9rem", fontStyle: "italic", border: "1px dashed #1c1e24", borderRadius: "8px" }}>
              Your series chapters are currently compliant with Panelva community safety guidelines. No active abuse reports filed.
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
