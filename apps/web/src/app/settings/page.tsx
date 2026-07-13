"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, Shield, Bell, LogOut, ChevronRight, Mail, Lock, 
  Globe, Moon, Sparkles, Smartphone, Check, HelpCircle
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"account" | "security" | "preferences">("account");
  
  // Dynamic update forms
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState("");

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [password, setPassword] = useState("");

  const [language, setLanguage] = useState("English");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Sync state with localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("panelva_theme") || "dark";
    setIsDarkMode(storedTheme === "dark");

    const user = localStorage.getItem("panelva_user");
    if (user) {
      setIsSignedIn(true);
      setUsername(user);
      setTempUsername(user);
      
      const customEmail = localStorage.getItem(`panelva_email_${user}`) || `${user.toLowerCase()}@gmail.com`;
      setEmail(customEmail);
      setTempEmail(customEmail);
    } else {
      setIsSignedIn(false);
      // If not logged in, redirect to login
      router.push("/auth");
    }
  }, [router]);

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUsername.trim()) return;

    const oldUser = username;
    const newUser = tempUsername.trim();

    // Save previous email under new key
    const oldEmail = localStorage.getItem(`panelva_email_${oldUser}`) || `${oldUser.toLowerCase()}@gmail.com`;
    localStorage.setItem(`panelva_email_${newUser}`, oldEmail);

    // Save user roles mapping
    try {
      const rolesMap = JSON.parse(localStorage.getItem("panelva_user_roles") || "{}");
      if (rolesMap[oldUser]) {
        rolesMap[newUser] = rolesMap[oldUser];
        delete rolesMap[oldUser];
        localStorage.setItem("panelva_user_roles", JSON.stringify(rolesMap));
      }
    } catch (e) {}

    localStorage.setItem("panelva_user", newUser);
    setUsername(newUser);
    setIsEditingUsername(false);

    // Dispatch update event so Header immediately displays new username
    window.dispatchEvent(new Event("panelva_user_update"));
    alert("Username updated successfully!");
  };

  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail.trim()) return;

    localStorage.setItem(`panelva_email_${username}`, tempEmail.trim());
    setEmail(tempEmail.trim());
    setIsEditingEmail(false);
    alert("Email address updated successfully!");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingPassword(false);
    setPassword("");
    alert("Password updated successfully!");
  };

  const handleSignOut = () => {
    localStorage.removeItem("panelva_user");
    localStorage.removeItem("panelva_role");
    window.dispatchEvent(new Event("panelva_user_update"));
    alert("Signed out successfully.");
    router.push("/");
  };

  if (!isSignedIn) {
    return (
      <div style={{ minHeight: "80vh", backgroundColor: "#07080a", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--text-dark-muted)" }}>Redirecting to login...</p>
      </div>
    );
  }

  const userInitial = username ? username.charAt(0).toUpperCase() : "U";

  return (
    <div className="settings-page" style={{ minHeight: "100vh", backgroundColor: "#07080a", color: "#fff", padding: "3rem 2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "280px 1fr", gap: "3rem" }}>
        
        {/* ─── LEFT SIDEBAR ─── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "#fff" }}>Settings</h1>
          
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              { id: "account", label: "Account", icon: <User size={18} /> },
              { id: "security", label: "Security", icon: <Shield size={18} /> },
              { id: "preferences", label: "Preferences", icon: <Bell size={18} /> }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "none",
                    background: isActive ? "#2563eb" : "transparent",
                    color: isActive ? "#fff" : "var(--text-dark-muted)",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                  className={isActive ? "" : "hover:text-white hover:bg-primary-alpha"}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
            
            <div style={{ height: "1px", backgroundColor: "#1c1e24", margin: "1rem 0" }}></div>
            
            <button
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background: "transparent",
                color: "#ef4444",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* ─── RIGHT CONTENT PANEL ─── */}
        <section style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          
          {/* User Profile Header Card */}
          <div className="glass-panel" style={{ padding: "2rem", display: "flex", alignItems: "center", gap: "24px", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
            <div style={{ 
              width: "80px", 
              height: "80px", 
              borderRadius: "50%", 
              border: "3px solid #2563eb", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              fontSize: "2rem", 
              fontWeight: 800, 
              color: "#fff",
              background: "#1c1e24"
            }}>
              {userInitial}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#fff" }}>{username}</h2>
                <span style={{ fontSize: "0.9rem", color: "var(--text-dark-muted)", marginTop: "2px", display: "block" }}>{email}</span>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <button onClick={() => alert("Redirecting to public user library profile...")} style={{ background: "transparent", border: "1px solid #1c1e24", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }} className="hover:bg-primary-alpha transition">
                  View Public Profile
                </button>
                <Link href="/premium">
                  <button style={{ background: "rgba(37, 99, 235, 0.12)", border: "none", color: "#2563eb", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }} className="hover:bg-primary-alpha transition">
                    <Sparkles size={14} /> Go Premium
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* ─── TAB CONTENT: ACCOUNT DETAILS ─── */}
          {activeTab === "account" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>ACCOUNT DETAILS</span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Personal Information card */}
                <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                        <User size={18} />
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "1rem", color: "#fff" }}>Personal Information</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", marginTop: "2px", display: "block" }}>Update your username, bio, and social links</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingUsername(!isEditingUsername)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dark-muted)" }}
                      className="hover:text-white"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {isEditingUsername && (
                    <form onSubmit={handleUpdateUsername} style={{ display: "flex", gap: "12px", marginTop: "1.5rem", borderTop: "1px solid #1c1e24", paddingTop: "1.25rem" }}>
                      <input 
                        type="text"
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        placeholder="Enter new username..."
                        required
                        style={{ flex: 1, background: "#07080a", border: "1px solid #1c1e24", padding: "10px 14px", borderRadius: "8px", color: "#fff" }}
                      />
                      <button type="submit" style={{ background: "#2563eb", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                        Save
                      </button>
                    </form>
                  )}
                </div>

                {/* Premium Billing card */}
                <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "1rem", color: "#fff" }}>Panelva Premium</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", marginTop: "2px", display: "block" }}>Manage your current subscription and billing</span>
                      </div>
                    </div>
                    <Link href="/premium">
                      <ChevronRight size={20} style={{ color: "var(--text-dark-muted)" }} className="hover:text-white" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB CONTENT: SECURITY ─── */}
          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>SECURITY & PRIVACY</span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Change Email card */}
                <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                        <Mail size={18} />
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "1rem", color: "#fff" }}>Change Email Address</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", marginTop: "2px", display: "block" }}>Update the email associated with your account</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingEmail(!isEditingEmail)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dark-muted)" }}
                      className="hover:text-white"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {isEditingEmail && (
                    <form onSubmit={handleUpdateEmail} style={{ display: "flex", gap: "12px", marginTop: "1.5rem", borderTop: "1px solid #1c1e24", paddingTop: "1.25rem" }}>
                      <input 
                        type="email"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        placeholder="Enter new email..."
                        required
                        style={{ flex: 1, background: "#07080a", border: "1px solid #1c1e24", padding: "10px 14px", borderRadius: "8px", color: "#fff" }}
                      />
                      <button type="submit" style={{ background: "#2563eb", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                        Save
                      </button>
                    </form>
                  )}
                </div>

                {/* Change Password card */}
                <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                        <Lock size={18} />
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "1rem", color: "#fff" }}>Update Password</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", marginTop: "2px", display: "block" }}>Reset or change your account password</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingPassword(!isEditingPassword)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dark-muted)" }}
                      className="hover:text-white"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {isEditingPassword && (
                    <form onSubmit={handleUpdatePassword} style={{ display: "flex", gap: "12px", marginTop: "1.5rem", borderTop: "1px solid #1c1e24", paddingTop: "1.25rem" }}>
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password..."
                        required
                        style={{ flex: 1, background: "#07080a", border: "1px solid #1c1e24", padding: "10px 14px", borderRadius: "8px", color: "#fff" }}
                      />
                      <button type="submit" style={{ background: "#2563eb", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                        Save
                      </button>
                    </form>
                  )}
                </div>

                {/* Linked Accounts */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "1.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>LINKED ACCOUNTS</span>
                  <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <Mail size={18} color="var(--text-dark-muted)" />
                      <strong style={{ color: "#fff" }}>Password</strong>
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>{email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB CONTENT: PREFERENCES ─── */}
          {activeTab === "preferences" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>APP PREFERENCES</span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Notifications card */}
                <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                        <Bell size={18} />
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "1rem", color: "#fff" }}>Notifications</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", marginTop: "2px", display: "block" }}>Control which updates you receive</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert("Notification settings updated!")}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dark-muted)" }}
                      className="hover:text-white"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Display Language card */}
                <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                      <Globe size={18} />
                    </div>
                    <div>
                      <strong style={{ display: "block", fontSize: "1rem", color: "#fff" }}>Display Language</strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", marginTop: "2px", display: "block" }}>Select your preferred language for the interface</span>
                    </div>
                  </div>
                  
                  <select 
                    value={language}
                    onChange={(e) => { setLanguage(e.target.value); alert(`Preferred language changed to ${e.target.value}!`); }}
                    style={{ background: "#07080a", border: "1px solid #1c1e24", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", outline: "none" }}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="Japanese">日本語</option>
                  </select>
                </div>

                {/* Theme Selector card */}
                <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#2563eb" }}>
                      <Moon size={18} />
                    </div>
                    <div>
                      <strong style={{ display: "block", fontSize: "1rem", color: "#fff" }}>Visual Theme</strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", marginTop: "2px", display: "block" }}>Choose between light and dark appearance</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const nextMode = !isDarkMode;
                      setIsDarkMode(nextMode);
                      localStorage.setItem("panelva_theme", nextMode ? "dark" : "light");
                      window.dispatchEvent(new Event("panelva_theme_update"));
                    }}
                    style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--input-bg)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", color: "var(--text-color)" }}
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    <Moon size={18} style={{ fill: isDarkMode ? "currentColor" : "none" }} />
                  </button>
                </div>

              </div>
            </div>
          )}

        </section>

      </div>
    </div>
  );
}
