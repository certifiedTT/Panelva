"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { trpc } from "../../lib/trpc";
import { 
  ArrowLeft, Settings, MoreVertical, User, Sparkles, Coins, 
  LayoutGrid, MessageSquare, Flame, BookOpen, Clock, Award, CheckCircle
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
  const { user, role: userRole, isLoading } = useAuth();

  const username = user?.username || "";
  const joinedDate = useMemo(() => {
    if (!user?.createdAt) return "Joined Just now";
    try {
      const date = new Date(user.createdAt);
      return `Joined ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } catch {
      return "Joined Just now";
    }
  }, [user?.createdAt]);

  const [bio, setBio] = useState("Member of the Panelva universe.");
  const [activeTab, setActiveTab] = useState<"favorites" | "about" | "activity" | "wallet">("favorites");
  const [streak, setStreak] = useState(5);
  const [brokenStreak, setBrokenStreak] = useState(20);
  const [isStreakRecoverable, setIsStreakRecoverable] = useState(true);
  const [isRestoringStreak, setIsRestoringStreak] = useState(false);

  // Fetch real database data
  const { data: profileData, refetch: refetchProfile } = (trpc.user.getProfile as any).useQuery(undefined, {
    enabled: !!user,
  });
  const { data: dbTransactions, refetch: refetchTransactions } = (trpc.user.getTransactionHistory as any).useQuery(undefined, {
    enabled: !!user,
  });

  const wcoins = profileData?.wCoinBalance || 0;
  const creditBalance = wcoins;

  const transactions = useMemo(() => {
    return (dbTransactions || []).map((t: any) => {
      const isReceived = t.destinationUserId === user?.id;
      const rawAmount = isReceived ? t.amount : -t.amount;
      return {
        id: t.transactionId || t.id,
        date: new Date(t.createdAt).toLocaleDateString() + " " + new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: t.description || t.type,
        amount: isReceived ? `+${t.amount}` : `-${t.amount}`,
        rawAmount,
        source: t.sourceUserId ? `User ${t.sourceUserId.substring(0, 6)}` : "System",
        destination: t.destinationUserId ? `User ${t.destinationUserId.substring(0, 6)}` : "System",
        status: "COMPLETED"
      };
    });
  }, [dbTransactions, user?.id]);

  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [promoInput, setPromoInput] = useState("");
  const [autoRenew, setAutoRenew] = useState(true);

  // Derived wallet balances
  const lifetimePurchased = useMemo(() => {
    return (dbTransactions || [])
      .filter((t: any) => t.type === "COIN_RECHARGE" && t.destinationUserId === user?.id)
      .reduce((acc: number, t: any) => acc + t.amount, 0);
  }, [dbTransactions, user?.id]);

  const lifetimeSpent = useMemo(() => {
    return (dbTransactions || [])
      .filter((t: any) => t.sourceUserId === user?.id)
      .reduce((acc: number, t: any) => acc + t.amount, 0);
  }, [dbTransactions, user?.id]);

  const creditsEarned = useMemo(() => {
    return (dbTransactions || [])
      .filter((t: any) => t.type === "REDEEM_CODE" && t.destinationUserId === user?.id)
      .reduce((acc: number, t: any) => acc + t.amount, 0);
  }, [dbTransactions, user?.id]);

  // Bookmarks from profile query
  const bookmarkedItems = profileData?.bookmarks || [];

  // Comments from profile query
  const comments = profileData?.comments || [];

  // Recharge Mutation
  const rechargeCoinsMutation = trpc.user.rechargeCoins.useMutation({
    onSuccess: () => {
      refetchProfile();
      refetchTransactions();
      setSelectedPkg(null);
      alert("Recharge successful!");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to recharge credits.");
    }
  });

  // Redeem Mutation
  const redeemPromoMutation = trpc.user.redeemPromoCode.useMutation({
    onSuccess: (data: any) => {
      refetchProfile();
      refetchTransactions();
      setPromoInput("");
      alert(`Promo code redeemed successfully! ${data.premiumDays} days of Premium access granted.`);
    },
    onError: (err: any) => {
      alert(err.message || "Invalid or expired promo code.");
    }
  });

  // Interaction handlers
  const handleOpenCheckout = (pkg: any) => {
    setSelectedPkg(pkg);
  };

  const handleProcessPayment = () => {
    if (!selectedPkg) return;
    rechargeCoinsMutation.mutate({
      amountCoins: selectedPkg.amount + selectedPkg.bonus,
      amountUsd: selectedPkg.price,
    });
  };

  const handleRedeemPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    redeemPromoMutation.mutate({ code });
  };

  const simulateRenewalMutation = trpc.user.simulateRenewal.useMutation({
    onSuccess: () => {
      refetchProfile();
      refetchTransactions();
      alert("Membership auto-renewed successfully using 300 Credits.");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to renew membership.");
    }
  });

  const handleSimulateRenewal = () => {
    simulateRenewalMutation.mutate();
  };

  const handleClaimReward = (amount: number, type: string) => {
    rechargeCoinsMutation.mutate({ amountCoins: amount, amountUsd: 0.01 });
  };

  const restoreTokens = (user as any)?.subscription === "PREMIUM" ? 3 : (user as any)?.subscription === "PLUS" ? 2 : 1;

  const restoreStreakMutation = ((trpc.user as any).restoreStreak || (trpc.user as any).restoreStreakMutation)?.useMutation({
    onSuccess: (data: any) => {
      refetchProfile();
      refetchTransactions();
      setStreak(20);
      setIsStreakRecoverable(false);
      setIsRestoringStreak(false);
      alert(data?.message || "Your 20 day streak has been restored!");
    },
    onError: (err: any) => {
      setIsRestoringStreak(false);
      alert(err.message || "Failed to restore streak.");
    }
  });

  const handleRestoreStreak = (useToken = false) => {
    if (useToken && restoreTokens > 0) {
      setIsRestoringStreak(true);
      restoreStreakMutation.mutate({ useToken: true });
      return;
    }

    if (creditBalance < 20) {
      alert("Insufficient credits. You need 20 Credits to restore your streak.");
      return;
    }
    setIsRestoringStreak(true);
    restoreStreakMutation.mutate({ useToken: false });
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
      return;
    }

    if (user) {
      // Load bio
      const savedBio = localStorage.getItem(`panelva_user_bio_${user.username}`);
      if (savedBio) {
        setBio(savedBio);
      } else {
        setBio("Member of the Panelva universe.");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "80vh", backgroundColor: "#07080a", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--text-dark-muted)" }}>Loading profile...</p>
      </div>
    );
  }


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

          {/* Metrics row - Following, Streak, Reads */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginTop: "1rem" }}>
            <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "14px", background: "#07080a", border: "1px solid #1c1e24", borderRadius: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                <User size={16} />
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{profileData?.followingCount || 42}</div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>FOLLOWING</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "14px", background: "#07080a", border: "1px solid #1c1e24", borderRadius: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(249, 115, 22, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#f97316" }}>
                <Flame size={16} />
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{streak}</div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>STREAK</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "14px", background: "#07080a", border: "1px solid #1c1e24", borderRadius: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                <BookOpen size={16} />
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{profileData?.totalReads || 384}</div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>READS</span>
              </div>
            </div>
          </div>

        </div>

        {/* Streak Recovery Card (Available for 24 hours only, costs 20 Credits) */}
        {isStreakRecoverable && (
          <div style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(13, 14, 18, 0.98) 100%)",
            border: "1px solid #332014",
            borderRadius: "16px",
            padding: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(249, 115, 22, 0.15)", display: "flex", justifyContent: "center", alignItems: "center", color: "#f97316" }}>
                <Flame size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>Streak Recovery</h4>
                  <span style={{ fontSize: "0.7rem", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "2px 8px", borderRadius: "9999px", fontWeight: 700 }}>24H WINDOW</span>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>
                  Your {brokenStreak} day streak expired yesterday. Restore it within 24 hours.
                </p>
                {restoreTokens > 0 ? (
                  <div style={{ marginTop: "6px", fontSize: "0.8rem", color: "#f59e0b", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                    <Sparkles size={14} /> {restoreTokens} Restore Token{restoreTokens > 1 ? "s" : ""} available ({(user as any)?.subscription === "PREMIUM" ? "Premium: 3 tokens" : (user as any)?.subscription === "PLUS" ? "Panelva Plus: 2 tokens" : "Free Reader: 1 token"})
                  </div>
                ) : (
                  <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "var(--text-dark-muted)", fontStyle: "italic" }}>
                    20 Credits fee goes strictly to the platform (master-admin account).
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", gap: "6px" }}>
                {restoreTokens > 0 ? (
                  <>
                    <Sparkles size={16} /> 1 Token (Free)
                  </>
                ) : (
                  <>
                    <Coins size={16} /> 20 Credits (Platform)
                  </>
                )}
              </span>
              <button
                onClick={() => handleRestoreStreak(restoreTokens > 0)}
                disabled={isRestoringStreak}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
                className="hover:bg-blue-600 transition"
              >
                {isRestoringStreak ? "Restoring..." : restoreTokens > 0 ? "Restore (1 Token)" : "Restore"}
              </button>
            </div>
          </div>
        )}

        {/* Tab Selector bar */}
        <div style={{ display: "inline-flex", background: "#0d0e12", border: "1px solid #1c1e24", padding: "5px", borderRadius: "30px", gap: "6px", width: "100%", overflowX: "auto" }}>
          {[
            { id: "favorites", label: "Favorites", icon: <BookOpen size={15} /> },
            { id: "about", label: "About", icon: <User size={15} /> },
            { id: "activity", label: "Activity", icon: <Clock size={15} /> },
            { id: "wallet", label: `Wallet (${creditBalance})`, icon: <Coins size={15} /> }
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

        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#fff" }}>Favorites</h3>
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
                <div style={{ fontWeight: 600, color: "#d1d5db" }}>No favorites yet.</div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>Explore series and tap bookmark to add them to your favorites.</span>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.5rem" }}>
                {bookmarkedItems.map((item: any) => (
                  <Link key={item.id} href={`/read/${item.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }} className="hover:opacity-90 transition">
                      <div style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "3/4",
                        borderRadius: "10px",
                        background: item.coverUrl ? `url(${item.coverUrl}) center/cover no-repeat` : "linear-gradient(135deg, #111827, #1f2937)",
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
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid #1c1e24" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>BIO</span>
              <p style={{ margin: "8px 0 0 0", color: "#d1d5db", fontSize: "0.95rem", lineHeight: 1.6 }}>{bio}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
              <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid #1c1e24" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, textTransform: "uppercase" }}>MEMBER SINCE</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginTop: "6px" }}>{joinedDate.replace("Joined ", "")}</div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid #1c1e24" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, textTransform: "uppercase" }}>REPUTATION</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f59e0b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Award size={16} /> +{profileData?.reputationPoints || 145} Points
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", marginTop: "4px", display: "block" }}>
                  Earned via constructive comments
                </span>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid #1c1e24" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, textTransform: "uppercase" }}>READING STREAK</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f97316", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Flame size={16} /> {streak} Days Active
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", marginTop: "4px", display: "block" }}>
                  Consecutive days reading
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab (Reading Journal) */}
        {activeTab === "activity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Today's Reading */}
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#fff" }}>Today's Reading</h3>
              <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid #1c1e24", display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ width: "64px", height: "80px", borderRadius: "10px", background: "linear-gradient(135deg, #1e3a8a, #2563eb)", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff" }}>
                  <BookOpen size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>Shadow City: Neon Blade</h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    <CheckCircle size={14} /> Chapter 42 completed
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} /> 18 minutes
                  </span>
                </div>
              </div>
            </div>

            {/* Reading Summary */}
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#fff" }}>Reading Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid #1c1e24", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#2563eb" }}>1h 42m</div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, textTransform: "uppercase" }}>Today</span>
                </div>
                <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid #1c1e24", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#2563eb" }}>18 Chapters</div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, textTransform: "uppercase" }}>This Week</span>
                </div>
              </div>
            </div>

            {/* Recent History */}
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#fff" }}>Recent History</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { title: "Archmage Curriculum", chapter: "Chapter 29", date: "Yesterday", time: "22m" },
                  { title: "Dragon Ashes", chapter: "Chapter 11", date: "2 days ago", time: "15m" },
                  { title: "Void Runner", chapter: "Chapter 8", date: "3 days ago", time: "14m" }
                ].map((item, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: "1.25rem 1.5rem", borderRadius: "12px", border: "1px solid #1c1e24", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>{item.title}</h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>{item.chapter}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.85rem", color: "#d1d5db", fontWeight: 600 }}>{item.date}</div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                        <Clock size={11} /> {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Credits Wallet Tab View (Requirement 2, 3, 5, 7, 9) */}
        {activeTab === "wallet" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Wallet Statistics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
              {[
                { label: "Current Balance", value: `${creditBalance.toLocaleString()} Credits`, color: "#10b981" },
                { label: "Lifetime Purchased", value: `${lifetimePurchased.toLocaleString()} Credits`, color: "#3b82f6" },
                { label: "Lifetime Spent", value: `${lifetimeSpent.toLocaleString()} Credits`, color: "#ef4444" },
                { label: "Promo & Rewards", value: `${creditsEarned.toLocaleString()} Credits`, color: "#eab308" }
              ].map((c: any, idx: number) => (
                <div key={idx} className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{c.label}</span>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: c.color, marginTop: "8px" }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "2.5rem" }}>
              
              {/* Left Side: Purchase Packages & Transaction History */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                
                {/* Buy Credits packages */}
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#fff" }}>Purchase Credits Packages</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                    {[
                      { amount: 100, price: "$1.00", bonus: 0 },
                      { amount: 250, price: "$2.50", bonus: 0 },
                      { amount: 500, price: "$5.00", bonus: 0 },
                      { amount: 1000, price: "$10.00", bonus: 100 },
                      { amount: 2500, price: "$25.00", bonus: 300 },
                      { amount: 5000, price: "$50.00", bonus: 700 },
                      { amount: 10000, price: "$100.00", bonus: 1500 }
                    ].map((pkg: any, idx: number) => (
                      <div 
                        key={idx} 
                        onClick={() => handleOpenCheckout(pkg)}
                        style={{
                          background: "#0d0e12",
                          border: "1px solid #1c1e24",
                          borderRadius: "16px",
                          padding: "1.25rem",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          position: "relative",
                          overflow: "hidden"
                        }}
                        className="hover:border-blue-500/50 hover:shadow-lg transition-transform hover:-translate-y-0.5"
                      >
                        {pkg.bonus > 0 && (
                          <div style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            background: "linear-gradient(135deg, #eab308, #ca8a04)",
                            color: "#000",
                            fontSize: "0.65rem",
                            fontWeight: 900,
                            padding: "3px 10px",
                            borderBottomLeftRadius: "10px",
                            textTransform: "uppercase"
                          }}>
                            +{pkg.bonus} Bonus
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>{pkg.amount.toLocaleString()}</div>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700 }}>CREDITS</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#10b981" }}>{pkg.price}</span>
                          <button style={{ background: "#2563eb", border: "none", color: "#fff", fontSize: "0.7rem", padding: "4px 8px", borderRadius: "6px", fontWeight: 700 }}>BUY</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ledger transaction history list */}
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#fff" }}>Ledger Transaction History</h3>
                  <div className="glass-panel" style={{ background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", padding: "1rem", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1c1e24", color: "var(--text-dark-muted)", fontWeight: 700 }}>
                          <th style={{ padding: "8px" }}>Transaction ID</th>
                          <th style={{ padding: "8px" }}>Date</th>
                          <th style={{ padding: "8px" }}>Type</th>
                          <th style={{ padding: "8px" }}>Amount</th>
                          <th style={{ padding: "8px" }}>Source</th>
                          <th style={{ padding: "8px" }}>Destination</th>
                          <th style={{ padding: "8px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice().reverse().map((tx: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(28, 30, 36, 0.4)", color: "#d1d5db" }}>
                            <td style={{ padding: "10px 8px", fontFamily: "monospace", color: "#9ca3af" }}>{tx.id}</td>
                            <td style={{ padding: "10px 8px" }}>{tx.date}</td>
                            <td style={{ padding: "10px 8px", fontWeight: 700 }}>{tx.type}</td>
                            <td style={{ padding: "10px 8px", fontWeight: 900, color: tx.rawAmount >= 0 ? "#10b981" : "#ef4444" }}>{tx.amount}</td>
                            <td style={{ padding: "10px 8px", color: "#9ca3af" }}>{tx.source}</td>
                            <td style={{ padding: "10px 8px", color: "#9ca3af" }}>{tx.destination}</td>
                            <td style={{ padding: "10px 8px" }}>
                              <span style={{ fontSize: "0.65rem", fontWeight: 900, padding: "2px 6px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Side: Auto-Renewal Settings, Promo Codes, Rewards Simulation */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* Auto-Renewal Settings */}
                <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em" }}>Studio Membership Renewal</h4>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>Membership Auto-Renewal</div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)" }}>Automatically renew using Credits wallet</span>
                    </div>
                    <button 
                      onClick={() => setAutoRenew(!autoRenew)}
                      style={{
                        background: autoRenew ? "#10b981" : "#ef4444",
                        border: "none",
                        color: "#fff",
                        fontSize: "0.7rem",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {autoRenew ? "ACTIVE" : "PAUSED"}
                    </button>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
                    If enabled, memberships will renew automatically. If your balance drops below the required credits (e.g. 300 Credits), renewal will pause until topped up.
                  </p>
                  <button 
                    onClick={handleSimulateRenewal}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "1px solid #1c1e24",
                      color: "#fff",
                      fontSize: "0.75rem",
                      padding: "8px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                    className="hover:bg-slate-900 transition"
                  >
                    Simulate Membership Renewal (-300 Credits)
                  </button>
                </div>

                {/* Promo Code Redemption */}
                <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em" }}>Redeem Promo Code</h4>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", display: "block", marginBottom: "1rem" }}>Redeem WELCOME100 or FREE500 codes</span>
                  
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      placeholder="Enter promo code..." 
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      style={{
                        background: "#07080a",
                        border: "1px solid #1c1e24",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "0.8rem",
                        color: "#fff",
                        flex: 1,
                        outline: "none"
                      }}
                    />
                    <button 
                      onClick={handleRedeemPromo}
                      style={{
                        background: "#2563eb",
                        border: "none",
                        color: "#fff",
                        fontSize: "0.75rem",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Redeem
                    </button>
                  </div>
                </div>

                {/* Rewards Simulation Board */}
                <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em" }}>Rewards & Compensation</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { label: "Daily Login Reward (+10 Credits)", amount: 10, type: "Daily Login Reward" },
                      { label: "Daily Referral Bonus (+50 Credits)", amount: 50, type: "Referral Reward" },
                      { label: "Achievement Claim: view 10k (+100 Credits)", amount: 100, type: "Achievement Reward" },
                      { label: "Admin Compensation Reward (+500 Credits)", amount: 500, type: "Admin Compensation" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleClaimReward(item.amount, item.type)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          background: "#07080a",
                          border: "1px solid #1c1e24",
                          color: "#fff",
                          fontSize: "0.75rem",
                          padding: "10px",
                          borderRadius: "8px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                        className="hover:border-zinc-700 transition"
                      >
                        🎁 {item.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Checkout Modal */}
        {selectedPkg && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "2rem"
          }}>
            <div style={{
              background: "#0d0e12",
              border: "1px solid #1c1e24",
              borderRadius: "20px",
              padding: "2rem",
              maxWidth: "450px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem"
            }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#fff" }}>Secure Payment Checkout</h3>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)" }}>Platform Credits Purchase Ledger Layer</span>
              </div>

              <div style={{ background: "#07080a", border: "1px solid #1c1e24", borderRadius: "12px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{selectedPkg.amount.toLocaleString()} Credits</div>
                  {selectedPkg.bonus > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#eab308", fontWeight: 700 }}>+ {selectedPkg.bonus.toLocaleString()} Promotional Credits Included</span>
                  )}
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#10b981" }}>{selectedPkg.price}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 700, textTransform: "uppercase" }}>Select Payment Channel:</span>
                {[
                  { name: "Card (Visa / Mastercard)", id: "Card" },
                  { name: "Bank Transfer", id: "Bank Transfer" },
                  { name: "Mobile Money", id: "Mobile Money" },
                  { name: "Apple Pay", id: "Apple Pay" },
                  { name: "Google Pay", id: "Google Pay" }
                ].map(method => (
                  <label 
                    key={method.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "0.8rem",
                      color: "#fff",
                      background: paymentMethod === method.id ? "rgba(37,99,235,0.06)" : "#07080a",
                      border: paymentMethod === method.id ? "1px solid #2563eb" : "1px solid #1c1e24",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    <input 
                      type="radio" 
                      name="payment_method" 
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      style={{ cursor: "pointer" }}
                    />
                    {method.name}
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button 
                  onClick={() => setSelectedPkg(null)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid #1c1e24",
                    color: "var(--text-dark-muted)",
                    fontSize: "0.8rem",
                    padding: "12px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  className="hover:text-white hover:bg-slate-900 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProcessPayment}
                  style={{
                    flex: 1.5,
                    background: "#2563eb",
                    border: "none",
                    color: "#fff",
                    fontSize: "0.8rem",
                    padding: "12px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  className="hover:bg-blue-600 transition"
                >
                  Pay & Recharge
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
