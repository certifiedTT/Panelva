"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Shield, Crown, Users, Flag, Eye, DollarSign, 
  Trash2, UserPlus, BarChart3, CreditCard, FileText, Ticket, LayoutGrid
} from "lucide-react";
import { TimeAgo } from "../../components/TimeAgo";

// Initial DB state fallbacks
const INITIAL_STAFF = [
  { username: "TO30", email: "tobidavid140@gmail.com", joined: "3 months ago", role: "ADMIN", avatar: "T" },
  { username: "notjud3", email: "j.iseniyi@gmail.com", joined: "15 days ago", role: "MASTER", avatar: "n" }
];

const INITIAL_USERS = [
  { username: "PixelArtist", email: "pixel@gmail.com", role: "CREATOR", joined: "1 month ago" },
  { username: "NovelistMax", email: "max@gmail.com", role: "CREATOR", joined: "2 weeks ago" },
  { username: "ReaderBob", email: "bob@gmail.com", role: "USER", joined: "5 days ago" },
  { username: "MangaFan", email: "fan@gmail.com", role: "USER", joined: "1 day ago" }
];

const INITIAL_APPLICATIONS = [
  {
    id: "app-1",
    penName: "PixelArtist",
    type: "ARTIST",
    bio: "Visual webtoon illustrator specializing in dark fantasy and dynamic line art.",
    portfolioUrl: "https://portfolio.panelva/pixelartist",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "app-2",
    penName: "NovelistMax",
    type: "NOVELIST",
    bio: "Writer of sci-fi light novels with over 5 published works on other hubs.",
    portfolioUrl: "https://portfolio.panelva/novelistmax",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const INITIAL_REPORTS = [
  {
    id: "rep-1",
    reporterName: "UserAlpha",
    reason: "Offensive language in comment on Chapter 4.",
    resolved: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "rep-2",
    reporterName: "UserBeta",
    reason: "Visual page elements contain copyrighted materials.",
    resolved: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const INITIAL_PAYOUTS = [
  { id: "pay-1", creator: "MangaCreatorPro", amount: "$145.20", status: "PENDING", date: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: "pay-2", creator: "ArtistLine", amount: "$84.00", status: "COMPLETED", date: new Date(Date.now() - 3600000 * 48).toISOString() }
];

const INITIAL_PROMOS = [
  { code: "PLUS30D1", type: "PLUS", duration: "30 Days", status: "Active", createdBy: "notjud3", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
  { code: "PREM60D2", type: "PREMIUM", duration: "60 Days", status: "Redeemed", createdBy: "TO30", createdAt: new Date(Date.now() - 3600000 * 48).toISOString() }
];

const INITIAL_SERIES = [
  { id: "ser-1", title: "Shadow Hunter Chronicles", creator: "MangaCreatorPro", type: "COMIC", status: "Ongoing", views: 6500 },
  { id: "ser-2", title: "The Silent Alchemist", creator: "MangaCreatorPro", type: "NOVEL", status: "Completed", views: 1700 }
];

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState("");
  const [userRole, setUserRole] = useState("USER");

  // State Management
  const [staff, setStaff] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"overview" | "payouts" | "applications" | "promos" | "safety" | "series" | "users">("overview");
  
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");

  // Promo Generator State
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoType, setNewPromoType] = useState<"PLUS" | "PREMIUM">("PLUS");
  const [newPromoDuration, setNewPromoDuration] = useState("30 Days");

  // Sync state with localStorage
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
      if (usernameToCheck === "notjud3" || usernameToCheck.toLowerCase().includes("master")) return "MASTER_ADMIN";
      if (usernameToCheck.toLowerCase().includes("admin") || usernameToCheck === "TO30") return "ADMIN";
      return "USER";
    };

    const role = getRoleForUser(user);
    setUserRole(role);

    // Sync database arrays
    const syncItem = (key: string, initial: any, setter: any) => {
      const saved = localStorage.getItem(key);
      if (saved) {
        setter(JSON.parse(saved));
      } else {
        localStorage.setItem(key, JSON.stringify(initial));
        setter(initial);
      }
    };

    syncItem("panelva_staff", INITIAL_STAFF, setStaff);
    syncItem("panelva_users", INITIAL_USERS, setUsers);
    syncItem("panelva_applications", INITIAL_APPLICATIONS, setApplications);
    syncItem("panelva_reports", INITIAL_REPORTS, setReports);
    syncItem("panelva_payouts", INITIAL_PAYOUTS, setPayouts);
    syncItem("panelva_promo_codes", INITIAL_PROMOS, setPromoCodes);
    syncItem("panelva_series", INITIAL_SERIES, setSeries);
  }, []);

  const isMasterAdmin = userRole === "MASTER_ADMIN";
  const isAdmin = userRole === "ADMIN" || isMasterAdmin;

  // Actions
  const handleApplicationAction = (id: string, status: "APPROVED" | "DENIED" | "PENDING") => {
    const updated = applications.map((app) => (app.id === id ? { ...app, status } : app));
    setApplications(updated);
    localStorage.setItem("panelva_applications", JSON.stringify(updated));
    alert(`Application successfully ${status.toLowerCase()}!`);
  };

  const handleResolveReport = (id: string) => {
    const updated = reports.map((rep) => (rep.id === id ? { ...rep, resolved: true } : rep));
    setReports(updated);
    localStorage.setItem("panelva_reports", JSON.stringify(updated));
    alert(`Report ${id} marked as resolved.`);
  };

  const handleApprovePayout = (id: string) => {
    const updated = payouts.map((pay) => (pay.id === id ? { ...pay, status: "COMPLETED" } : pay));
    setPayouts(updated);
    localStorage.setItem("panelva_payouts", JSON.stringify(updated));
    alert(`Payout ${id} processed successfully.`);
  };

  const handleGeneratePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newPromoCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase();
    
    if (promoCodes.some(p => p.code === code)) {
      alert("This promo code already exists!");
      return;
    }

    const newPromo = {
      code,
      type: newPromoType,
      duration: newPromoDuration,
      status: "Active",
      createdBy: currentUser,
      createdAt: new Date().toISOString()
    };

    const updated = [newPromo, ...promoCodes];
    setPromoCodes(updated);
    localStorage.setItem("panelva_promo_codes", JSON.stringify(updated));
    setNewPromoCode("");
    alert(`Promo Code "${code}" successfully created for ${newPromoType}!`);
  };

  const handlePromoteUser = (username: string, email: string) => {
    if (!isMasterAdmin) return;
    if (window.confirm(`Are you sure you want to promote @${username} to Administrator?`)) {
      const newStaffItem = {
        username,
        email,
        joined: "Just now",
        role: "ADMIN",
        avatar: username.charAt(0).toUpperCase()
      };

      const updatedStaff = [...staff, newStaffItem];
      setStaff(updatedStaff);
      localStorage.setItem("panelva_staff", JSON.stringify(updatedStaff));

      const updatedUsers = users.filter(u => u.username !== username);
      setUsers(updatedUsers);
      localStorage.setItem("panelva_users", JSON.stringify(updatedUsers));

      // Persist in roles map
      try {
        const rolesMap = JSON.parse(localStorage.getItem("panelva_user_roles") || "{}");
        rolesMap[username] = "ADMIN";
        localStorage.setItem("panelva_user_roles", JSON.stringify(rolesMap));
      } catch (e) {}

      alert(`@${username} has been granted Administrator status and added to the Staff Directory.`);
    }
  };

  const handleRevokeAdmin = (username: string) => {
    if (!isMasterAdmin) return;
    if (username === "notjud3") {
      alert("Cannot revoke permissions for the primary Master Admin!");
      return;
    }
    if (window.confirm(`Are you sure you want to revoke Administrator status for @${username}?`)) {
      const target = staff.find(s => s.username === username);
      if (target) {
        const returnedUser = {
          username: target.username,
          email: target.email,
          role: "USER",
          joined: "Just now"
        };
        const updatedUsers = [...users, returnedUser];
        setUsers(updatedUsers);
        localStorage.setItem("panelva_users", JSON.stringify(updatedUsers));
      }

      const updatedStaff = staff.filter(s => s.username !== username);
      setStaff(updatedStaff);
      localStorage.setItem("panelva_staff", JSON.stringify(updatedStaff));

      // Remove from roles map
      try {
        const rolesMap = JSON.parse(localStorage.getItem("panelva_user_roles") || "{}");
        delete rolesMap[username];
        localStorage.setItem("panelva_user_roles", JSON.stringify(rolesMap));
      } catch (e) {}

      alert(`Revoked administrator permissions for @${username}.`);
    }
  };

  const handleInviteAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim() || !inviteEmail.trim()) return;

    if (staff.some(s => s.username.toLowerCase() === inviteUsername.toLowerCase())) {
      alert("This user is already an administrator.");
      return;
    }

    const newInvite = {
      username: inviteUsername,
      email: inviteEmail,
      joined: "Invited (Pending)",
      role: "ADMIN",
      avatar: inviteUsername.charAt(0).toUpperCase()
    };

    const updatedStaff = [...staff, newInvite];
    setStaff(updatedStaff);
    localStorage.setItem("panelva_staff", JSON.stringify(updatedStaff));

    // Register in roles map so they can log in directly as admin
    try {
      const rolesMap = JSON.parse(localStorage.getItem("panelva_user_roles") || "{}");
      rolesMap[inviteUsername] = "ADMIN";
      localStorage.setItem("panelva_user_roles", JSON.stringify(rolesMap));
    } catch (e) {}

    setInviteUsername("");
    setInviteEmail("");
    alert(`Invite successfully sent to ${inviteEmail}. Pending confirmation.`);
  };

  // If not admin, block rendering
  if (!isAdmin) {
    return (
      <div className="admin-page" style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg)", display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
        <div className="glass-panel" style={{ padding: "3rem", maxWidth: "450px", textAlign: "center", display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center" }}>
          <Shield size={64} color="#ef4444" />
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "#fff" }}>Access Denied</h2>
          <p style={{ color: "var(--text-dark-muted)", textAlign: "center", margin: 0 }}>
            You do not have the required administrative permissions to access the governance portal.
          </p>
          <Link href="/">
            <button style={{ background: "var(--gradient-main)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: "20px", fontWeight: 700, cursor: "pointer" }}>
              Return to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ minHeight: "100vh", backgroundColor: "#07080a", color: "var(--text-dark)", padding: "3rem 2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Back Link */}
        <Link href="/" style={{ color: "var(--text-dark-muted)", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "0.9rem", marginBottom: "1.5rem", width: "fit-content", fontWeight: 500 }} className="hover:text-white transition">
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Hub Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ color: "#2563eb", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Shield size={36} />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, margin: 0, color: "#fff" }}>Admin Hub</h1>
              <p style={{ color: "var(--text-dark-muted)", margin: "0.25rem 0 0 0", fontSize: "1rem" }}>Unified command center for platform governance.</p>
            </div>
          </div>
          
          {/* Master Analytics Button (Master Admin Only) */}
          {isMasterAdmin && (
            <button 
              onClick={() => alert("Master Analytics: 12,430 Page Views, 84 New Subscribers, $420.00 Ad Revenue, 100% System Uptime.")}
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                border: "none",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(37, 99, 235, 0.45)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 0 25px rgba(37, 99, 235, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(37, 99, 235, 0.45)";
              }}
            >
              <Crown size={18} style={{ fill: "#fff" }} /> Master Analytics
            </button>
          )}
        </header>

        {/* Tab Navigation pills selector */}
        <div style={{ display: "inline-flex", background: "#0d0e12", border: "1px solid #1c1e24", padding: "5px", borderRadius: "30px", gap: "6px", marginBottom: "2.5rem", width: "100%", overflowX: "auto" }}>
          {[
            { id: "overview", label: "Overview", icon: <BarChart3 size={15} /> },
            { id: "payouts", label: "Payouts", icon: <CreditCard size={15} /> },
            { id: "applications", label: "Applications", icon: <FileText size={15} /> },
            { id: "promos", label: "Promo Codes", icon: <Ticket size={15} /> },
            { id: "safety", label: "Safety", icon: <Flag size={15} /> },
            { id: "series", label: "Series", icon: <LayoutGrid size={15} /> },
            { id: "users", label: "Users", icon: <Users size={15} /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                background: activeTab === t.id ? "#07080a" : "transparent",
                border: activeTab === t.id ? "1px solid #1c1e24" : "1px solid transparent",
                color: activeTab === t.id ? "#fff" : "var(--text-dark-muted)",
                padding: "8px 18px",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {/* Stats Metric Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {isMasterAdmin && (
                <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", display: "block" }}>TOTAL STAFF</span>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{staff.length}</div>
                  </div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                    <Users size={20} />
                  </div>
                </div>
              )}
              
              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", display: "block" }}>ACTIVE REPORTS</span>
                  <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{reports.filter(r => !r.resolved).length}</div>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                  <Flag size={20} />
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", display: "block" }}>PLATFORM VIEWS</span>
                  <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{series.reduce((acc, s) => acc + s.views, 0)}</div>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                  <Eye size={20} />
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", display: "block" }}>PAYOUT REQUESTS</span>
                  <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{payouts.filter(p => p.status === "PENDING").length}</div>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                  <DollarSign size={20} />
                </div>
              </div>
            </div>

            {/* Staff Directory Table (Master Admin Only) */}
            {isMasterAdmin ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>Staff Directory</h2>
                
                <div className="glass-panel" style={{ padding: "1.5rem", overflowX: "auto", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-dark)", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1c1e24", fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>
                        <th style={{ padding: "14px 12px" }}>Administrator</th>
                        <th style={{ padding: "14px 12px" }}>Joined</th>
                        <th style={{ padding: "14px 12px" }}>Access Level</th>
                        <th style={{ padding: "14px 12px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((member, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "16px 12px", display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#1c1e24", border: "1px solid #2c2d30", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
                              {member.avatar}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "4px" }}>
                                @{member.username}
                                {member.role === "MASTER" && <Crown size={12} color="#f1c40f" style={{ fill: "#f1c40f" }} />}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)" }}>{member.email}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px", fontSize: "0.9rem", color: "#d1d5db" }}>{member.joined}</td>
                          <td style={{ padding: "12px" }}>
                            {member.role === "MASTER" ? (
                              <span style={{ fontSize: "0.75rem", background: "#2563eb", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontWeight: 700 }}>
                                MASTER
                              </span>
                            ) : (
                              <span style={{ fontSize: "0.75rem", background: "#ef4444", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontWeight: 700 }}>
                                ADMIN
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            {member.role !== "MASTER" && (
                              <button 
                                onClick={() => handleRevokeAdmin(member.username)}
                                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", padding: "6px" }}
                                title="Revoke Admin Permissions"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Invite admin block */}
                <div className="glass-panel" style={{ padding: "2rem", maxWidth: "600px", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>Invite Administrator</h3>
                  <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>
                    Send an invite to grant a user admin privileges. Users cannot apply to be administrators.
                  </p>
                  <form onSubmit={handleInviteAdmin} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <input 
                      type="text" 
                      placeholder="Username"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      required
                      style={{ flex: 1, background: "#07080a", border: "1px solid #1c1e24", padding: "10px 14px", borderRadius: "8px", color: "#fff", minWidth: "140px" }}
                    />
                    <input 
                      type="email" 
                      placeholder="Email Address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      style={{ flex: 2, background: "#07080a", border: "1px solid #1c1e24", padding: "10px 14px", borderRadius: "8px", color: "#fff", minWidth: "200px" }}
                    />
                    <button type="submit" style={{ background: "var(--gradient-main)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                      Send Invite
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: "2rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.25rem", color: "#fff", fontWeight: 700 }}>Administrative Access Active</h3>
                <p style={{ margin: 0, color: "var(--text-dark-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  Welcome back, <strong>@{currentUser}</strong>. You are currently logged in with standard administrator credentials. Use the tabs above to manage content safety reports, verify creator applications, review splits, and process payouts.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── PAYOUTS TAB ─── */}
        {activeTab === "payouts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>Payout Verification Center</h2>
            <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-dark)", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1c1e24", fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>
                    <th style={{ padding: "12px" }}>Creator</th>
                    <th style={{ padding: "12px" }}>Withdrawal Amount</th>
                    <th style={{ padding: "12px" }}>Request Date</th>
                    <th style={{ padding: "12px" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((pay) => (
                    <tr key={pay.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "14px 12px", fontWeight: 700, color: "#fff" }}>@{pay.creator}</td>
                      <td style={{ padding: "12px", fontWeight: 800, color: "var(--secondary)" }}>{pay.amount}</td>
                      <td style={{ padding: "12px", fontSize: "0.85rem" }}><TimeAgo date={pay.date} /></td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          fontSize: "0.75rem", fontWeight: 700,
                          color: pay.status === "COMPLETED" ? "#10b981" : "#2563eb"
                        }}>
                          {pay.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {pay.status === "PENDING" ? (
                          <button 
                            onClick={() => handleApprovePayout(pay.id)}
                            style={{ background: "#2563eb", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                          >
                            Verify & Payout
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── APPLICATIONS TAB ─── */}
        {activeTab === "applications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>Creator Vetting Queue</h2>
            
            {applications.map((app) => (
              <div key={app.id} className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontFamily: "var(--font-display)", color: "#fff" }}>{app.penName}</h3>
                    <span style={{ fontSize: "0.75rem", background: "#1c1e24", padding: "4px 8px", borderRadius: "4px", color: "var(--text-dark-muted)", display: "inline-block", marginTop: "4px" }}>
                      Type: {app.type}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <TimeAgo date={app.createdAt} />
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ 
                        fontSize: "0.8rem", fontWeight: 600, 
                        color: app.status === "APPROVED" ? "#10b981" : app.status === "DENIED" ? "#ef4444" : "#2563eb"
                      }}>
                        Status: {app.status}
                      </span>
                    </div>
                  </div>
                </div>

                <p style={{ color: "#d1d5db", margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>{app.bio}</p>
                <div style={{ fontSize: "0.9rem" }}>
                  <strong style={{ color: "#fff" }}>Portfolio:</strong> <a href={app.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>{app.portfolioUrl}</a>
                </div>

                {app.status === "PENDING" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem", borderTop: "1px solid #1c1e24", paddingTop: "1rem" }}>
                    <input 
                      type="text" 
                      placeholder="Add review notes (optional)..."
                      value={noteMap[app.id] || ""}
                      onChange={(e) => setNoteMap({ ...noteMap, [app.id]: e.target.value })}
                      style={{ background: "#07080a", border: "1px solid #1c1e24", padding: "10px 14px", borderRadius: "8px", color: "#fff", width: "100%", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button 
                        onClick={() => handleApplicationAction(app.id, "APPROVED")}
                        style={{ background: "#10b981", border: "none", color: "#fff", padding: "8px 18px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                      >
                        Approve Application
                      </button>
                      <button 
                        onClick={() => handleApplicationAction(app.id, "DENIED")}
                        style={{ background: "#ef4444", border: "none", color: "#fff", padding: "8px 18px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                      >
                        Deny Application
                      </button>
                      <button 
                        onClick={() => handleApplicationAction(app.id, "PENDING")}
                        style={{ background: "none", border: "1px solid #1c1e24", color: "#fff", padding: "8px 18px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                      >
                        Keep Pending
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {applications.length === 0 && <p style={{ color: "var(--text-dark-muted)" }}>No applications available.</p>}
          </div>
        )}

        {/* ─── PROMO CODES TAB ─── */}
        {activeTab === "promos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>Promotional Code Registry</h2>

            {/* Code Generator Form */}
            <div className="glass-panel" style={{ padding: "2rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>Generate Promo Access Code</h3>
              <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.85rem", color: "var(--text-dark-muted)", lineHeight: 1.5 }}>
                Generates promotional subscription codes. When users redeem them, the system flags them as promotional users so they do not artificially inflate creator view counts.
              </p>
              
              <form onSubmit={handleGeneratePromo} style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-dark-muted)", marginBottom: "6px", fontWeight: 600 }}>Code Type</label>
                  <select 
                    value={newPromoType}
                    onChange={(e) => setNewPromoType(e.target.value as any)}
                    style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", padding: "10px", borderRadius: "8px", color: "#fff" }}
                  >
                    <option value="PLUS">Panelva Plus Code</option>
                    <option value="PREMIUM">Panelva Premium Code</option>
                  </select>
                </div>
                
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-dark-muted)", marginBottom: "6px", fontWeight: 600 }}>Duration</label>
                  <select 
                    value={newPromoDuration}
                    onChange={(e) => setNewPromoDuration(e.target.value)}
                    style={{ width: "100%", background: "#07080a", border: "1px solid #1c1e24", padding: "10px", borderRadius: "8px", color: "#fff" }}
                  >
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="90 Days">90 Days</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>

                <div style={{ flex: 2, minWidth: "200px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-dark-muted)", marginBottom: "6px", fontWeight: 600 }}>Custom Code String (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Auto-generate if empty..."
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value)}
                    maxLength={12}
                    style={{ width: "100%", boxSizing: "border-box", background: "#07080a", border: "1px solid #1c1e24", padding: "10px", borderRadius: "8px", color: "#fff" }}
                  />
                </div>

                <button type="submit" style={{ background: "var(--gradient-main)", border: "none", color: "#fff", padding: "11px 24px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                  Generate Code
                </button>
              </form>
            </div>

            {/* Promos List Table */}
            <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-dark)", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1c1e24", fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>
                    <th style={{ padding: "12px" }}>Promo Code</th>
                    <th style={{ padding: "12px" }}>Access Tier</th>
                    <th style={{ padding: "12px" }}>Duration</th>
                    <th style={{ padding: "12px" }}>Status</th>
                    <th style={{ padding: "12px" }}>Created By</th>
                    <th style={{ padding: "12px" }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "14px 12px", fontFamily: "monospace", fontSize: "1.1rem", color: "var(--secondary)", fontWeight: 700 }}>{p.code}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          background: p.type === "PREMIUM" ? "rgba(241, 196, 15, 0.15)" : "rgba(37, 99, 235, 0.15)", 
                          color: p.type === "PREMIUM" ? "#f1c40f" : "#2563eb",
                          padding: "4px 8px", borderRadius: "4px", fontWeight: 700
                        }}>
                          {p.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "0.9rem", color: "#d1d5db" }}>{p.duration}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ 
                          fontSize: "0.8rem", fontWeight: 600,
                          color: p.status === "Active" ? "#10b981" : "var(--text-dark-muted)"
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "0.9rem", color: "#d1d5db" }}>@{p.createdBy}</td>
                      <td style={{ padding: "12px", fontSize: "0.85rem" }}><TimeAgo date={p.createdAt} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── SAFETY TAB ─── */}
        {activeTab === "safety" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>Safety & Abuse Reports</h2>
            {reports.map((rep) => (
              <div key={rep.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", color: "var(--secondary)", fontWeight: 700 }}>Report {rep.id}</h4>
                  <p style={{ margin: "0 0 6px 0", fontSize: "0.95rem", color: "#fff" }}>{rep.reason}</p>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>
                    Reported by <strong>{rep.reporterName}</strong> &bull; <TimeAgo date={rep.createdAt} />
                  </div>
                </div>
                <div>
                  {rep.resolved ? (
                    <span style={{ color: "#10b981", fontWeight: 600, fontSize: "0.9rem" }}>Resolved</span>
                  ) : (
                    <button 
                      onClick={() => handleResolveReport(rep.id)}
                      style={{ background: "#2563eb", border: "none", color: "#fff", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Resolve Report
                    </button>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && <p style={{ color: "var(--text-dark-muted)" }}>No safety incidents reported.</p>}
          </div>
        )}

        {/* ─── SERIES TAB ─── */}
        {activeTab === "series" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>Uploaded Series Moderation</h2>
            <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-dark)", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1c1e24", fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>
                    <th style={{ padding: "12px" }}>Title</th>
                    <th style={{ padding: "12px" }}>Creator</th>
                    <th style={{ padding: "12px" }}>Format</th>
                    <th style={{ padding: "12px" }}>Status</th>
                    <th style={{ padding: "12px" }}>Views</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "14px 12px", fontWeight: 700, color: "#fff" }}>{s.title}</td>
                      <td style={{ padding: "12px", color: "#d1d5db" }}>@{s.creator}</td>
                      <td style={{ padding: "12px", fontSize: "0.85rem", color: "#d1d5db" }}>{s.type}</td>
                      <td style={{ padding: "12px", color: "#d1d5db" }}>{s.status}</td>
                      <td style={{ padding: "12px", fontSize: "0.9rem", color: "#d1d5db" }}>{s.views}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button 
                          onClick={() => alert(`Moderation action dispatched for series: "${s.title}"`)}
                          style={{ background: "none", border: "1px solid #1c1e24", color: "#ef4444", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                        >
                          Review Content
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── USERS TAB ─── */}
        {activeTab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>User Registry</h2>
            <div className="glass-panel" style={{ padding: "1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-dark)", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1c1e24", fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>
                    <th style={{ padding: "12px" }}>User</th>
                    <th style={{ padding: "12px" }}>Email</th>
                    <th style={{ padding: "12px" }}>Joined</th>
                    <th style={{ padding: "12px" }}>User Type</th>
                    {isMasterAdmin && <th style={{ padding: "12px", textAlign: "right" }}>Staff Promotion</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "14px 12px", fontWeight: 700, color: "#fff" }}>@{u.username}</td>
                      <td style={{ padding: "12px", color: "#d1d5db" }}>{u.email}</td>
                      <td style={{ padding: "12px", fontSize: "0.9rem", color: "#d1d5db" }}>{u.joined}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          background: u.role === "CREATOR" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                          color: u.role === "CREATOR" ? "#10b981" : "var(--text-dark-muted)",
                          padding: "4px 8px", borderRadius: "4px", fontWeight: 600
                        }}>
                          {u.role}
                        </span>
                      </td>
                      {isMasterAdmin && (
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <button 
                            onClick={() => handlePromoteUser(u.username, u.email)}
                            style={{ 
                              background: "none", border: "1px solid #1c1e24", 
                              color: "#2563eb", padding: "6px 12px", borderRadius: "6px", 
                              cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                              display: "inline-flex", alignItems: "center", gap: "6px" 
                            }}
                          >
                            <UserPlus size={14} /> Grant Admin
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
