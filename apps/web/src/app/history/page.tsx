"use client";

import Link from "next/link";
import { trpc } from "../../lib/trpc";

export default function HistoryPage() {
  const { data: historyList, isLoading } = trpc.user.getReadingHistory.useQuery();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg, #08090c)", color: "var(--text-dark, #ffffff)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--text-dark-muted, #8a8d98)" }}>Loading history...</p>
      </div>
    );
  }

  const history = historyList || [];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg, #08090c)", color: "var(--text-dark, #ffffff)", padding: "4rem 2rem", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Reading <span style={{ color: "var(--secondary, #8b5cf6)" }}>History</span>
        </h1>
        <p style={{ color: "var(--text-dark-muted, #8a8d98)", fontSize: "1.1rem", marginBottom: "3rem" }}>
          Track and continue reading your recently opened titles.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {history.map((item: any) => (
            <div 
              key={item.id} 
              className="glass-panel" 
              style={{ 
                padding: "1.5rem", 
                display: "flex", 
                gap: "1.5rem", 
                alignItems: "center", 
                background: "#0d0e12", 
                border: "1px solid #1a1c23", 
                borderRadius: "16px",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
                <img 
                  src={item.chapter.series.coverUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200"} 
                  alt={item.chapter.series.title}
                  style={{ width: "60px", aspectRatio: "3/4", objectFit: "cover", borderRadius: "8px", background: "#1f2937" }}
                />
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.65rem", background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa", padding: "2px 6px", borderRadius: "6px", fontWeight: 800, textTransform: "uppercase" }}>
                      {item.chapter.series.type}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Read on {new Date(item.readAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>{item.chapter.series.title}</h3>
                  <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                    Chapter {item.chapter.chapterIndex}: {item.chapter.title}
                  </span>

                  {/* Progress Bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                    <div style={{ width: "120px", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${item.progressPct}%`, height: "100%", background: "#8b5cf6" }} />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700 }}>
                      {item.progressPct}% read
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Link href={`/read/${item.chapter.series.id}`}>
                  <button 
                    style={{ 
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)", 
                      border: "none", 
                      color: "#fff", 
                      padding: "8px 20px", 
                      borderRadius: "20px", 
                      fontWeight: 700, 
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      transition: "transform 0.2s"
                    }}
                    className="hover:scale-105"
                  >
                    Continue
                  </button>
                </Link>
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 2rem", border: "1px dashed #1c1e24", borderRadius: "16px", color: "var(--text-dark-muted, #8a8d98)" }}>
              <p style={{ margin: "0 0 1rem 0" }}>You haven't read any episodes yet.</p>
              <Link href="/comics" style={{ color: "var(--secondary, #8b5cf6)", fontWeight: "bold", textDecoration: "underline" }}>
                Explore Comics & Novels
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
