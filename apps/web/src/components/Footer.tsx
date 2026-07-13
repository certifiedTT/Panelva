"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Suppress footer on reading pages
  const isReadingPage = pathname?.includes("/read") || pathname?.includes("/chapter");
  if (isReadingPage) {
    return null;
  }

  return (
    <footer style={{
      backgroundColor: "#060709",
      borderTop: "1px solid var(--dark-border)",
      padding: "2.5rem 3rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxSizing: "border-box",
      width: "100%",
      marginTop: "auto",
      flexWrap: "wrap",
      gap: "1.5rem"
    }}>
      {/* Left Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.2rem",
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-0.02em"
        }}>
          Panelva
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>
          © 2026 Panelva. All rights reserved.
        </span>
      </div>

      {/* Center Links */}
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <Link href="/help" style={{ color: "var(--text-dark-muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-dark-muted)"}>
          Terms of Use
        </Link>
        <Link href="/help" style={{ color: "var(--text-dark-muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-dark-muted)"}>
          Guidelines
        </Link>
        <Link href="/help" style={{ color: "var(--text-dark-muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-dark-muted)"}>
          Policy
        </Link>
      </div>

      {/* Right Social Icons */}
      <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", color: "var(--text-dark-muted)" }}>
        {/* Instagram */}
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "inherit"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
        </a>
        {/* Facebook */}
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "inherit"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
        </a>
        {/* TikTok (note icon representation) */}
        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "inherit"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
        </a>
        {/* X (Twitter) */}
        <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "inherit"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z M4 20l6.768 -6.768 M20 4l-6.768 6.768"></path></svg>
        </a>
      </div>
    </footer>
  );
}
