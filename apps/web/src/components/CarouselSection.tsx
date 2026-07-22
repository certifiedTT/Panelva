import Link from "next/link";
import React from "react";

export function CarouselSection({
  title,
  subtitle,
  items,
  activeIndex,
  onNext,
  onPrev,
  seeAllLink,
  icon,
  sectionBadgeText,
  sectionBadgeType = "cobalt"
}: {
  title: string;
  subtitle: string;
  items: any[];
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
  seeAllLink: string;
  icon?: React.ReactNode;
  sectionBadgeText?: string;
  sectionBadgeType?: "cobalt" | "gold" | "none";
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 750, margin: 0, color: "var(--text-color, #fff)", fontFamily: "var(--font-display)" }}>{title}</h2>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted-color, #a1a1aa)" }}>{subtitle}</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <Link href={seeAllLink} style={{ color: "#2563eb", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
            See All <span style={{ fontSize: "0.7rem" }}>❯</span>
          </Link>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={onPrev} style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-color)", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.75rem" }}>
              ←
            </button>
            <button onClick={onNext} style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-color)", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.75rem" }}>
              →
            </button>
          </div>
        </div>
      </div>

      <div className="home-carousel-grid">
        {Array.from({ length: Math.min(8, items.length) }).map((_, index) => {
          const displayIndex = (index + activeIndex) % items.length;
          const item = items[displayIndex];
          if (!item) return null;

          let badgeText = sectionBadgeText || "";
          let badgeType = sectionBadgeType;

          if (item.isNew && !badgeText) {
            badgeText = "New Episode";
            badgeType = "cobalt";
          }
          if (item.isNewSeries && !badgeText) {
            badgeText = "New Series";
            badgeType = "gold";
          }

          const linkHref = `/read/${item.id}?title=${encodeURIComponent(item.title)}&genre=${item.genre}&chapters=${item.chapters || 24}&likes=${item.likes}`;

          return (
            <Link key={`${item.id}-${index}`} href={linkHref} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: "10px", width: "100%", minWidth: 0 }}>
              <div style={{
                position: "relative",
                width: "100%",
                aspectRatio: "3/4",
                borderRadius: "12px",
                background: item.coverBg,
                border: "1px solid rgba(255, 255, 255, 0.05)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{ padding: "1rem", textAlign: "center", fontWeight: 800, fontSize: "0.85rem", color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                  {item.title}
                </div>
                
                {badgeText && (
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    backgroundColor: "#000",
                    border: `1px solid ${badgeType === "gold" ? "#f1c40f" : "#0047AB"}`,
                    color: badgeType === "gold" ? "#f1c40f" : "#0047AB",
                    borderRadius: "4px",
                    padding: "2px 5px",
                    fontSize: "0.55rem",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    zIndex: 10
                  }}>
                    {badgeText}
                  </div>
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "2px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted-color, #9ca3af)", textTransform: "capitalize" }}>
                  {item.genre} {item.chapters && `• ${item.chapters} Chs`}
                </span>
                <h3 style={{ margin: "2px 0 4px 0", fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-color, #fff)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.title}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981", fontSize: "0.78rem", fontWeight: "bold" }}>
                  <span>💚</span>
                  <span>{item.likes}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
