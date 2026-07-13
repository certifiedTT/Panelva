"use client";

import Link from "next/link";
import { useState } from "react";
import { DownloadDoneIcon } from "@/components/StateIcons";

export default function LibraryPage() {
  const [bookmarks, setBookmarks] = useState([
    { id: "1", title: "Shadow Hunter Chronicles", type: "Comic", lastRead: "Chapter 9", earlyChaptersAvailable: true, downloaded: true },
    { id: "4", title: "The Silent Alchemist", type: "Novel", lastRead: "Chapter 12", earlyChaptersAvailable: false, downloaded: false }
  ]);

  const toggleDownload = (id: string) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, downloaded: !b.downloaded } : b));
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg)", color: "var(--text-dark)", padding: "4rem 2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          My <span style={{ color: "var(--secondary)" }}>Library</span>
        </h1>
        <p style={{ color: "var(--text-dark-muted)", fontSize: "1.1rem", marginBottom: "3rem" }}>
          Manage your bookmarked titles, download history, and early access chapters.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="glass-panel" style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.75rem", background: "var(--primary-alpha)", color: "var(--secondary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                    {bookmark.type}
                  </span>
                  {bookmark.earlyChaptersAvailable && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", background: "rgba(241, 196, 15, 0.15)", color: "#f1c40f", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                      Early Chapters Unlocked
                    </span>
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: "1.5rem" }}>{bookmark.title}</h3>
                <span style={{ fontSize: "0.9rem", color: "var(--text-dark-muted)" }}>Last read: {bookmark.lastRead}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button 
                  onClick={() => toggleDownload(bookmark.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    color: bookmark.downloaded ? "#2ecc71" : "var(--text-dark-muted)",
                    transition: "color 0.2s"
                  }}
                  title={bookmark.downloaded ? "Remove from Offline Storage" : "Sync Offline"}
                >
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>Mobile Offline Sync</span>
                    <strong style={{ fontSize: "0.95rem" }}>
                      {bookmark.downloaded ? "Synced Offline" : "Not Synced"}
                    </strong>
                  </div>
                  <DownloadDoneIcon size={28} color={bookmark.downloaded ? "#2ecc71" : "var(--text-dark-muted)"} activeState={bookmark.downloaded} />
                </button>

                <Link href={`/read/${bookmark.id}`}>
                  <button style={{ background: "var(--gradient-main)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: "20px", fontWeight: 700, cursor: "pointer" }}>
                    Continue
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
