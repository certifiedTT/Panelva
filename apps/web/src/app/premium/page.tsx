"use client";

import { useState } from "react";

export default function PremiumPage() {
  const plusPerks = [
    "Ad-free reading",
    "Offline-reading on mobile",
    "Changeable outside app logo for mobile",
    "Plus Badge (Blue)",
    "Priority comments (Rank 1)",
    "Early access to chapters"
  ];

  const premiumPerks = [
    "Early access to chapters",
    "Ad-free reading",
    "Offline-reading on mobile",
    "Changeable outside app logo for mobile",
    "Premium Badge (Gold)",
    "Priority comments (Rank 2)",
    "Animated profile pictures (PFP)",
    "More exclusive rewards to come!"
  ];

  const regions = [
    { name: "United States & Europe (USD)", code: "US", symbol: "$", plus: "1.99", premium: "3.99", note: "Standard USD equivalent pricing." },
    { name: "Nigeria (NGN)", code: "NG", symbol: "₦", plus: "1,000", premium: "2,000", note: "Optimized PPP sweet spot (saves ₦4,000/mo vs currency conversion, maximizing local volume)." },
    { name: "India (INR)", code: "IN", symbol: "₹", plus: "79", premium: "149", note: "Adjusted for regional purchasing power (approx. ₹450 saved vs strict USD conversion)." },
    { name: "Brazil (BRL)", code: "BR", symbol: "R$ ", plus: "7.90", premium: "14.90", note: "Localized for Latin American parity." },
    { name: "United Kingdom (GBP)", code: "GB", symbol: "£", plus: "1.79", premium: "3.49", note: "Converted for local GBP equivalence." }
  ];

  const [selectedRegion, setSelectedRegion] = useState(regions[0]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg)", color: "var(--text-dark)", padding: "4rem 2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "3rem" }}>
        
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Choose Your <span className="gradient-text">Upgrade</span>
          </h1>
          <p style={{ color: "var(--text-dark-muted)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto" }}>
            Unleash the full potential of Panelva. Choose the tier that matches your reading style.
          </p>

          {/* Purchasing Power Parity (PPP) Selector Block */}
          <div className="glass-panel" style={{ display: "inline-block", margin: "2rem auto 0 auto", padding: "1.5rem 2.5rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(30, 41, 59, 0.4)" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)", marginBottom: "8px" }}>
              🌐 Localized Regional Pricing (PPP)
            </label>
            <select
              value={selectedRegion.code}
              onChange={(e) => {
                const reg = regions.find((r) => r.code === e.target.value);
                if (reg) setSelectedRegion(reg);
              }}
              style={{
                background: "var(--dark-panel, #0f172a)",
                color: "#fff",
                border: "1px solid var(--dark-border, #334155)",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              {regions.map((reg) => (
                <option key={reg.code} value={reg.code}>
                  {reg.name}
                </option>
              ))}
            </select>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "12px", maxWidth: "450px", lineHeight: "1.4" }}>
              💡 <strong>PPP Adjustment:</strong> {selectedRegion.note}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginTop: "1rem" }}>
          
          {/* Panelva Plus */}
          <div className="glass-panel interactive-card" style={{ padding: "3rem 2rem", borderTop: "6px solid #3498db", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", background: "rgba(52, 152, 219, 0.15)", color: "#3498db", padding: "6px 12px", borderRadius: "20px", fontWeight: 700, textTransform: "uppercase" }}>
                Plus Badge (Blue)
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", margin: "10px 0 5px 0" }}>Panelva Plus</h2>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff" }}>
                  {selectedRegion.symbol}{selectedRegion.plus}
                </span>
                <span style={{ color: "var(--text-dark-muted)" }}>/ month</span>
              </div>
            </div>

            <div style={{ height: "1px", backgroundColor: "var(--dark-border)" }}></div>

            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.95rem" }}>
              {plusPerks.map((perk, idx) => (
                <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#3498db" }}>✓</span> {perk}
                </li>
              ))}
            </ul>

            <button style={{ marginTop: "auto", background: "#3498db", border: "none", color: "#fff", padding: "14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "1rem", transition: "all 0.2s" }} onClick={() => alert(`Subscribed to Panelva Plus at ${selectedRegion.symbol}${selectedRegion.plus}/mo!`)}>
              Upgrade to Plus
            </button>
          </div>

          {/* Panelva Premium */}
          <div className="glass-panel interactive-card" style={{ padding: "3rem 2rem", borderTop: "6px solid #f1c40f", display: "flex", flexDirection: "column", gap: "1.5rem", boxShadow: "0 10px 30px rgba(241, 196, 15, 0.1)" }}>
            <div>
              <span style={{ fontSize: "0.75rem", background: "rgba(241, 196, 15, 0.15)", color: "#f1c40f", padding: "6px 12px", borderRadius: "20px", fontWeight: 700, textTransform: "uppercase" }}>
                Premium Badge (Gold)
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", margin: "10px 0 5px 0" }}>Panelva Premium</h2>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff" }}>
                  {selectedRegion.symbol}{selectedRegion.premium}
                </span>
                <span style={{ color: "var(--text-dark-muted)" }}>/ month</span>
              </div>
            </div>

            <div style={{ height: "1px", backgroundColor: "var(--dark-border)" }}></div>

            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.95rem" }}>
              {premiumPerks.map((perk, idx) => (
                <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#f1c40f" }}>★</span> {perk}
                </li>
              ))}
            </ul>

            <button style={{ marginTop: "auto", background: "var(--gradient-main)", border: "none", color: "#fff", padding: "14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "1rem", transition: "all 0.2s" }} onClick={() => alert(`Subscribed to Panelva Premium at ${selectedRegion.symbol}${selectedRegion.premium}/mo!`)}>
              Upgrade to Premium
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
