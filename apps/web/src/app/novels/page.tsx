"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { trpc } from "../../lib/trpc";

interface Novel {
  id: string;
  title: string;
  author: string;
  genre: string;
  format: string;
  status: string;
  desc: string;
  coverBg: string;
  likes: string;
  isNew: boolean;
  chapters: number;
}

export default function NovelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"explore" | "schedule">("explore");
  const [selectedFormat, setSelectedFormat] = useState("All Formats");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [sortBy, setSortBy] = useState("Popularity");

  const genres = [
    "All Genres",
    "Action",
    "Adventure",
    "Animal",
    "Apocalyptic",
    "BL",
    "Bloody",
    "Business",
    "Cartoon",
    "Childhood Friends",
    "Chinese",
    "College life",
    "Comedy",
    "Comic",
    "Cooking",
    "Crime",
    "Crossdressing",
    "Demon",
    "Detective",
    "Drama",
    "Dungeons",
    "Ecchi",
    "Fantasy",
    "Farming",
    "GL",
    "Harem",
    "Historical",
    "Horror",
    "Isekai",
    "Kingdom Building",
    "Magic",
    "Magical",
    "Manga",
    "Manhwa",
    "Martial Arts",
    "Mecha",
    "Medical",
    "Medicaldrama",
    "Monster",
    "Murim",
    "Music",
    "Mystery",
    "Office Workers",
    "One shot",
    "Philosophical",
    "Police",
    "Post apocalyptic",
    "Psychological",
    "Reincarnation",
    "Revenge",
    "Reverse",
    "Reverse harem",
    "Romance",
    "Royal family",
    "School Life",
    "Sci-fi",
    "Showbiz",
    "Slice of Life",
    "Sports",
    "Super power",
    "Superhero",
    "Supernatural",
    "Survival",
    "Thriller",
    "Time travel",
    "Tragedy",
    "Transmigration",
    "Vampire",
    "Villainess",
    "Violence",
    "Virtual Reality",
    "Webtoon",
    "Zombies"
  ];

  const statuses = [
    "All Statuses",
    "Ongoing",
    "Completed",
    "Hiatus"
  ];

  const formats = [
    "All Formats",
    "Web Novel",
    "Light Novel"
  ];

  const novels: Novel[] = useMemo(() => [
    { 
      id: "7", 
      title: "Born to be the Grand Duchess", 
      author: "DuchessPen", 
      genre: "Romance",
      format: "Light Novel",
      status: "Ongoing", 
      desc: "Reborn into royalty, she must claim her throne as the grand duchess.", 
      coverBg: "linear-gradient(135deg, #0c4a6e, #0369a1)",
      likes: "549,934",
      isNew: true,
      chapters: 52
    },
    { 
      id: "8", 
      title: "Life of a Demon Hunter", 
      author: "HunterJong", 
      genre: "Action",
      format: "Web Novel",
      status: "Ongoing", 
      desc: "A demon hunter struggles to balance his normal life and the underworld.", 
      coverBg: "linear-gradient(135deg, #062f4f, #000000)",
      likes: "25,011",
      isNew: true,
      chapters: 30
    },
    { 
      id: "9", 
      title: "Girlfriend Manual", 
      author: "ManualMaker", 
      genre: "Romance",
      format: "Light Novel",
      status: "Completed", 
      desc: "A guide to understanding love, heartbreaks, and relationships.", 
      coverBg: "linear-gradient(135deg, #581c87, #3b0764)",
      likes: "2.2M",
      isNew: false,
      chapters: 64
    },
    { 
      id: "10", 
      title: "Aiming for the Alimony", 
      author: "LawyerLover", 
      genre: "Romance",
      format: "Web Novel",
      status: "Ongoing", 
      desc: "A high-stakes divorce turns into an unexpected romance.", 
      coverBg: "linear-gradient(135deg, #111827, #1f2937)",
      likes: "919,423",
      isNew: true,
      chapters: 45
    },
    { 
      id: "11", 
      title: "Archmage Curriculum", 
      author: "MageTeacher", 
      genre: "Fantasy",
      format: "Web Novel",
      status: "Ongoing", 
      desc: "Teaching magic to the next generation of visual spellcasters.", 
      coverBg: "linear-gradient(135deg, #065f46, #047857)",
      likes: "61,697",
      isNew: true,
      chapters: 34
    },
    { 
      id: "12", 
      title: "My Child Will Have a Different Father", 
      author: "FatedPath", 
      genre: "Fantasy",
      format: "Light Novel",
      status: "Ongoing", 
      desc: "A mother changes her child's destiny by rewriting the past.", 
      coverBg: "linear-gradient(135deg, #451a03, #78350f)",
      likes: "2.1M",
      isNew: true,
      chapters: 58
    }
  ], []);

  // Fetch from tRPC API
  const { data: dbNovels } = trpc.series.getMany.useQuery({
    type: "NOVEL",
    searchQuery: searchQuery || undefined,
    genre: selectedGenre !== "All Genres" ? selectedGenre : undefined,
    sortBy: sortBy === "Newest" ? "Newest" : sortBy === "Likes" ? "Likes" : sortBy === "Alphabetical" ? "Alphabetical" : "Popularity",
  });

  const formatLikes = (likesCount: number): string => {
    if (likesCount >= 1000000) return (likesCount / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (likesCount >= 1000) return (likesCount / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return likesCount.toString();
  };

  const mapDbItem = (item: any): Novel => {
    const isImage = item.coverUrl && item.coverUrl.startsWith("http");
    const mockMatch = novels.find(n => n.title.toLowerCase() === item.title.toLowerCase());
    const fallbackCount = mockMatch ? mockMatch.chapters : 24;
    const chaptersCount = item.chapters && item.chapters.length > 0 ? item.chapters.length : fallbackCount;

    return {
      id: item.id,
      title: item.title,
      author: item.creator?.penName || "Unknown",
      genre: item.genre,
      format: item.type === "NOVEL" ? "Web Novel" : "Visual Comics",
      status: item.status === "COMPLETED" ? "Completed" : item.status === "HIATUS" ? "Hiatus" : "Ongoing",
      desc: item.description,
      coverBg: isImage ? `url(${item.coverUrl}) center/cover no-repeat` : (item.coverBg || "linear-gradient(135deg, #1e293b, #0f172a)"),
      likes: formatLikes(item.likes),
      isNew: false,
      chapters: chaptersCount,
    };
  };

  const filteredNovels = useMemo(() => {
    return novels.filter(novel => {
      const matchesSearch = novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            novel.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            novel.desc.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFormat = selectedFormat === "All Formats" || novel.format === selectedFormat;
      const matchesGenre = selectedGenre === "All Genres" || novel.genre === selectedGenre;
      const matchesStatus = selectedStatus === "All Statuses" || novel.status === selectedStatus;

      return matchesSearch && matchesFormat && matchesGenre && matchesStatus;
    });
  }, [novels, searchQuery, selectedFormat, selectedGenre, selectedStatus]);

  const displayList = dbNovels && dbNovels.length > 0
    ? dbNovels.map(mapDbItem)
    : filteredNovels;

  return (
    <div className="explore-page" style={{ minHeight: "100vh", backgroundColor: "#08090c", color: "var(--text-dark)", padding: "4rem 2rem", boxSizing: "border-box", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ maxWidth: "1200px", width: "100%", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      
      {/* 1. Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 800, margin: 0, color: "#2563eb", display: "flex", alignItems: "center" }}>
            Novels
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "14px" }}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          </h1>
          <span style={{ fontSize: "1.1rem", color: "var(--text-dark-muted)" }}>Read the greatest text-based stories.</span>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search novels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "#111216",
              border: "1px solid var(--dark-border)",
              padding: "10px 40px 10px 18px",
              borderRadius: "20px",
              color: "#fff",
              fontSize: "0.9rem",
              width: "240px",
              outline: "none"
            }}
          />
          <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dark-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2rem", borderBottom: "1px solid var(--dark-border)", paddingBottom: "10px", width: "100%" }}>
        <button 
          onClick={() => setActiveTab("explore")}
          style={{
            background: "none",
            border: "none",
            color: activeTab === "explore" ? "#fff" : "var(--text-dark-muted)",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingBottom: "12px",
            marginBottom: "-13px",
            borderBottom: activeTab === "explore" ? "3px solid #2563eb" : "3px solid transparent",
            transition: "all var(--transition-fast)"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          Explore
        </button>
        <button 
          onClick={() => setActiveTab("schedule")}
          style={{
            background: "none",
            border: "none",
            color: activeTab === "schedule" ? "#fff" : "var(--text-dark-muted)",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingBottom: "12px",
            marginBottom: "-13px",
            borderBottom: activeTab === "schedule" ? "3px solid #2563eb" : "3px solid transparent",
            transition: "all var(--transition-fast)"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Schedule
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel explore-filter-bar">
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: "6px", color: "var(--text-dark-muted)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
            Filters
          </div>

          <select 
            value={selectedFormat} 
            onChange={(e) => setSelectedFormat(e.target.value)}
            style={{ background: "#0c0d12", border: "1px solid var(--dark-border)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", outline: "none" }}
          >
            {formats.map((f, i) => <option key={i} value={f}>{f}</option>)}
          </select>

          <select 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{ background: "#0c0d12", border: "1px solid var(--dark-border)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", outline: "none" }}
          >
            {genres.map((g, i) => <option key={i} value={g}>{g}</option>)}
          </select>

          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ background: "#0c0d12", border: "1px solid var(--dark-border)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", outline: "none" }}
          >
            {statuses.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", fontWeight: 700 }}>SORT BY</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ background: "#0c0d12", border: "1px solid var(--dark-border)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", outline: "none" }}
          >
            <option value="Popularity">Popularity</option>
            <option value="Newest">Newest</option>
            <option value="Rating">Rating</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {displayList.length === 0 ? (
        <div style={{ width: "100%", border: "1px dashed var(--dark-border)", borderRadius: "12px", padding: "6rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a4b50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>No results found</h2>
          <span style={{ fontSize: "0.95rem", color: "var(--text-dark-muted)" }}>Try broadening your search or adjusting filters.</span>
        </div>
      ) : (
        <div className="explore-items-grid">
          {displayList.map((novel) => (
            <Link key={novel.id} href={`/read/${novel.id}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: "10px", width: "100%", minWidth: 0 }}>
              <div style={{
                position: "relative",
                width: "100%",
                aspectRatio: "3/4",
                borderRadius: "12px",
                background: novel.coverBg,
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
                  {novel.title}
                </div>
                {novel.isNew && (
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    backgroundColor: "#000",
                    border: "1px solid #0047AB",
                    color: "#0047AB",
                    borderRadius: "4px",
                    padding: "2px 5px",
                    fontSize: "0.55rem",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em"
                  }}>
                    New Episode
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "2px" }}>
                <span style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "capitalize" }}>
                  {novel.genre} {novel.chapters && `• ${novel.chapters} Chs`}
                </span>
                <h3 style={{ margin: "2px 0 4px 0", fontSize: "0.85rem", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {novel.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
