"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CountdownItem {
  id: string;
  title: string;
  chapter: string;
  fromTier: string;
  toTier: string;
  secondsRemaining: number;
}

export default function TrendingPage() {
  const initialCountdowns: CountdownItem[] = [
    { id: "c1", title: "Shadow Hunter Chronicles", chapter: "Chapter 15", fromTier: "Premium (Tier 3)", toTier: "Ad-supported (Tier 2)", secondsRemaining: 3600 * 24 * 3 + 3600 * 4 },
    { id: "c2", title: "Levelling Up in the Underworld", chapter: "Chapter 11", fromTier: "Ad-supported (Tier 2)", toTier: "Free (Tier 1)", secondsRemaining: 3600 * 5 },
    { id: "c3", title: "The Silent Alchemist", chapter: "Chapter 14", fromTier: "Premium (Tier 3)", toTier: "Ad-supported (Tier 2)", secondsRemaining: 3600 * 24 * 6 + 3600 * 22 }
  ];

  const [countdowns, setCountdowns] = useState<CountdownItem[]>(initialCountdowns);

  // Decrement counters every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdowns((prev) =>
        prev.map((item) => ({
          ...item,
          secondsRemaining: Math.max(0, item.secondsRemaining - 1)
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Released!";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${days > 0 ? `${days}d ` : ""}${hours}h ${mins}m ${secs}s`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg)", color: "var(--text-dark)", padding: "4rem 2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "3rem" }}>
        
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Trending <span style={{ color: "var(--secondary)" }}>Now</span>
          </h1>
          <p style={{ color: "var(--text-dark-muted)", fontSize: "1.1rem" }}>
            Hot releases, top user charts, and upcoming Wait-for-Free chapter drops.
          </p>
        </div>

        {/* 7-Day Drop Scheduler Countdown Widgets */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", margin: 0 }}>
              7-Day Chapter Drop Schedule
            </h2>
          </div>
          <p style={{ color: "var(--text-dark-muted)", fontSize: "0.95rem", margin: "0 0 2rem 0" }}>
            Panelva drops premium chapters by one tier every 7 days. Watch the timers below to see when access expands!
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {countdowns.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", border: "1px solid var(--dark-border)", borderRadius: "8px", background: "#0c0d12" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "1.1rem" }}>{item.title}</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>
                    {item.chapter} — moving from <span style={{ color: "var(--secondary)" }}>{item.fromTier}</span> to <span style={{ color: "var(--primary)" }}>{item.toTier}</span>
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", display: "block" }}>Unlocks In</span>
                  <strong style={{ fontSize: "1.2rem", color: "var(--secondary)", fontFamily: "monospace" }}>
                    {formatTime(item.secondsRemaining)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending list */}
        <div>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Top Charts Today</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-panel interactive-card" style={{ padding: "1.25rem 2rem", display: "flex", alignItems: "center", gap: "2rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--secondary)" }}>#1</span>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.2rem" }}>Shadow Hunter Chronicles</h4>
                <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>Action • Fantasy • 4.9★</span>
              </div>
            </div>
            <div className="glass-panel interactive-card" style={{ padding: "1.25rem 2rem", display: "flex", alignItems: "center", gap: "2rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>#2</span>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.2rem" }}>The Silent Alchemist</h4>
                <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>Novel • Alchemy • 4.8★</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
