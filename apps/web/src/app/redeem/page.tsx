"use client";

import { useState } from "react";

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [currentUserStatus, setCurrentUserStatus] = useState({
    tier: "Free Member",
    isPromotional: false,
    viewEarningContributed: true
  });

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const codeUpper = code.trim().toUpperCase();
    let message = "";
    let updatedStatus = { ...currentUserStatus };

    if (codeUpper.startsWith("PROMO")) {
      updatedStatus = {
        tier: codeUpper.includes("PREMIUM") ? "Panelva Premium (Promotional)" : "Panelva Plus (Promotional)",
        isPromotional: true,
        viewEarningContributed: false
      };
      message = `Success! Redeemed promotional code "${codeUpper}". Note: Promotional subscriptions do NOT increment views of the creators to keep analytics fair.`;
    } else if (codeUpper.startsWith("PAID") || codeUpper.startsWith("GIFT")) {
      updatedStatus = {
        tier: codeUpper.includes("PREMIUM") ? "Panelva Premium (Paid)" : "Panelva Plus (Paid)",
        isPromotional: false,
        viewEarningContributed: true
      };
      message = `Success! Redeemed gift/paid subscription code "${codeUpper}". This is a normal subscriber tier and views will earn standard creator cuts.`;
    } else {
      message = `Error: Code "${codeUpper}" is invalid. Please try using "PROMO-PLUS", "PROMO-PREMIUM", "PAID-PLUS", or "PAID-PREMIUM" for this simulation.`;
    }

    if (!message.startsWith("Error")) {
      setCurrentUserStatus(updatedStatus);
    }
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    setCode("");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg)", color: "var(--text-dark)", padding: "4rem 2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Redeem <span style={{ color: "var(--secondary)" }}>Promo Code</span>
          </h1>
          <p style={{ color: "var(--text-dark-muted)", fontSize: "1.1rem" }}>
            Enter your 16-character code below to activate your Panelva Plus or Premium subscription.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          
          {/* Redeem Box */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="6" y1="8" x2="10" y2="8"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="10" y2="16"></line></svg>
              <h3 style={{ margin: 0 }}>Activate Subscription</h3>
            </div>
            <form onSubmit={handleRedeem} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Enter Code (e.g. PROMO-PREMIUM)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  background: "#111216",
                  border: "1px solid var(--dark-border)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "1rem",
                  textTransform: "uppercase",
                  outline: "none"
                }}
              />
              <button type="submit" style={{ background: "var(--gradient-main)", border: "none", color: "#fff", padding: "12px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                Redeem Code
              </button>
            </form>
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-dark-muted)", marginBottom: "0.5rem" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>Test Codes:</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", color: "var(--text-dark-muted)", fontFamily: "monospace" }}>
                <div>PROMO-PLUS (Promo Plus - Views excluded)</div>
                <div>PROMO-PREMIUM (Promo Premium - Views excluded)</div>
                <div>PAID-PLUS (Paid Plus - Standard views count)</div>
                <div>PAID-PREMIUM (Paid Premium - Standard views count)</div>
              </div>
            </div>
          </div>

          {/* Status Monitor */}
          <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h3 style={{ margin: 0 }}>Active Subscription Status</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", display: "block" }}>Active Level</span>
                <strong style={{ fontSize: "1.2rem", color: currentUserStatus.tier.includes("Premium") ? "var(--secondary)" : currentUserStatus.tier.includes("Plus") ? "var(--primary)" : "#fff" }}>
                  {currentUserStatus.tier}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", display: "block" }}>Is Promotional?</span>
                <strong style={{ color: currentUserStatus.isPromotional ? "#e74c3c" : "#2ecc71" }}>
                  {currentUserStatus.isPromotional ? "Yes (Admin Promo Code)" : "No (Paid Subscription)"}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", display: "block" }}>View Count Contribution</span>
                <strong style={{ color: currentUserStatus.viewEarningContributed ? "#2ecc71" : "#e74c3c" }}>
                  {currentUserStatus.viewEarningContributed ? "Active (Increments views)" : "Excluded (No creator view payouts)"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Console Log */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Redemption Log</h3>
          <div style={{ maxHeight: "150px", overflowY: "auto", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "10px" }}>
            {log.length === 0 ? (
              <span style={{ color: "var(--text-dark-muted)" }}>No codes redeemed in this session.</span>
            ) : (
              log.map((entry, idx) => (
                <div key={idx} style={{ padding: "8px", background: "#060709", border: "1px solid var(--dark-border)", borderRadius: "4px" }}>
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
