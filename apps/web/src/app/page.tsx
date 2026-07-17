"use client";

import Link from "next/link";
import { useState } from "react";
import { GlowingShadow } from "../components/GlowingShadow";
import { trpc } from "../lib/trpc";
import HeroAndShowcase from "../components/HeroAndShowcase";

export default function HomePage() {
  const [activeComicIndex, setActiveComicIndex] = useState(0);
  const [activeNovelIndex, setActiveNovelIndex] = useState(0);

  const featuredItems = [
    {
      id: "event-today",
      title: "TODAY'S EVENT",
      type: "promo",
      link: "/premium",
      coverBg: "linear-gradient(to bottom, #1d4ed8, #2563eb)",
      desc: "Today's Event",
      badgeText: "",
      badgeType: ""
    },
    {
      id: "event-novels",
      title: "PANELVA NOVELS",
      type: "promo",
      link: "/novels",
      coverBg: "linear-gradient(to bottom, #1e3a8a, #3b82f6)",
      desc: "Panelva Novels",
      badgeText: "",
      badgeType: ""
    },
    {
      id: "13",
      title: "Being Raised by Villains",
      type: "series",
      link: "/read/13",
      coverBg: "linear-gradient(135deg, #fef08a, #fbcfe8, #f472b6)",
      genre: "Fantasy",
      badgeText: "New Series",
      badgeType: "gold"
    },
    {
      id: "14",
      title: "Darling, Why Can't We Divorce?",
      type: "series",
      link: "/read/14",
      coverBg: "linear-gradient(135deg, #1e293b, #334155, #64748b)",
      genre: "Romance",
      badgeText: "",
      badgeType: ""
    },
    {
      id: "15",
      title: "The Holy Power of Modern Medicine",
      type: "series",
      link: "/read/15",
      coverBg: "linear-gradient(135deg, #e2e8f0, #cbd5e1, #fbbf24)",
      genre: "Fantasy",
      badgeText: "",
      badgeType: ""
    },
    {
      id: "event-binge",
      title: "June Binge-A-Thon",
      type: "promo",
      link: "/redeem",
      coverBg: "linear-gradient(to bottom, #ec4899, #db2777)",
      desc: "06/12-06/16",
      badgeText: "",
      badgeType: ""
    },
    {
      id: "16",
      title: "Parent-Teacher Conflict",
      type: "series",
      link: "/read/16",
      coverBg: "linear-gradient(135deg, #4c0519, #881337, #f43f5e)",
      genre: "Romance",
      badgeText: "",
      badgeType: ""
    },
    {
      id: "17",
      title: "Anna's Tale",
      type: "series",
      link: "/read/17",
      coverBg: "linear-gradient(135deg, #ffedd5, #fdedd5, #fbcfe8)",
      genre: "Drama",
      badgeText: "",
      badgeType: ""
    }
  ];

  const comics = [
    { id: "1", title: "Love Bites", author: "Lee Jehwan", likes: "3.9M", isNew: true, genre: "Romance", chapters: 42, coverBg: "linear-gradient(135deg, #4c0519, #9f1239)" },
    { id: "2", title: "Star Catcher", author: "DrawPro", likes: "3M", isNew: true, genre: "Romance", chapters: 36, coverBg: "linear-gradient(135deg, #1e1b4b, #311042)" },
    { id: "3", title: "A Spell for a Smith", author: "MagusSmith", likes: "3.4M", isNew: true, genre: "Fantasy", chapters: 48, coverBg: "linear-gradient(135deg, #022c22, #064e3b)" },
    { id: "4", title: "Surviving the Game as a Barbarian", author: "BarbarianKing", likes: "4.4M", isNew: true, genre: "Fantasy", chapters: 78, coverBg: "linear-gradient(135deg, #450a0a, #781c1c)" },
    { id: "5", title: "Swolemates", author: "GymTons", likes: "7.6M", isNew: true, genre: "Comedy", chapters: 88, coverBg: "linear-gradient(135deg, #1f2937, #111827)" },
    { id: "6", title: "Sweet Romance, Spicy Roommates", author: "SpiceWriter", likes: "92,054", isNew: true, genre: "Romance", chapters: 24, coverBg: "linear-gradient(135deg, #831843, #db2777)" },
    { id: "13", title: "Being Raised by Villains", author: "VillainWriter", likes: "1.2M", isNew: false, genre: "Fantasy", chapters: 30, coverBg: "linear-gradient(135deg, #fef08a, #fbcfe8, #f472b6)", isNewSeries: true },
    { id: "14", title: "Darling, Why Can't We Divorce?", author: "DivorceLover", likes: "890K", isNew: false, genre: "Romance", chapters: 24, coverBg: "linear-gradient(135deg, #1e293b, #334155, #64748b)" }
  ];

  const novels = [
    { id: "7", title: "Born to be the Grand Duchess", author: "DuchessPen", likes: "549,934", isNew: true, genre: "Romance", chapters: 52, coverBg: "linear-gradient(135deg, #0c4a6e, #0369a1)" },
    { id: "8", title: "Life of a Demon Hunter", author: "HunterJong", likes: "25,011", isNew: true, genre: "Action", chapters: 30, coverBg: "linear-gradient(135deg, #062f4f, #000000)" },
    { id: "9", title: "Girlfriend Manual", author: "ManualMaker", likes: "2.2M", isNew: false, genre: "Romance", chapters: 64, coverBg: "linear-gradient(135deg, #581c87, #3b0764)" },
    { id: "10", title: "Aiming for the Alimony", author: "LawyerLover", likes: "919,423", isNew: true, genre: "Romance", chapters: 45, coverBg: "linear-gradient(135deg, #111827, #1f2937)" },
    { id: "11", title: "Archmage Curriculum", author: "MageTeacher", likes: "61,697", isNew: true, genre: "Fantasy", chapters: 34, coverBg: "linear-gradient(135deg, #065f46, #047857)" },
    { id: "12", title: "My Child Will Have a Different Father", author: "FatedPath", likes: "2.1M", isNew: true, genre: "Fantasy", chapters: 58, coverBg: "linear-gradient(135deg, #451a03, #78350f)" },
    { id: "15", title: "The Holy Power of Modern Medicine", author: "DocMage", likes: "2.1M", isNew: false, genre: "Fantasy", chapters: 35, coverBg: "linear-gradient(135deg, #e2e8f0, #cbd5e1, #fbbf24)" },
    { id: "16", title: "Parent-Teacher Conflict", author: "ConflictWriter", likes: "450K", isNew: false, genre: "Romance", chapters: 20, coverBg: "linear-gradient(135deg, #4c0519, #881337, #f43f5e)" }
  ];

  const bingeSeries = [
    { id: "18", title: "Moonlight Sculptor", author: "SculptKing", likes: "5.6M", genre: "Fantasy", chapters: 215, coverBg: "linear-gradient(135deg, #311042, #1e1b4b)" },
    { id: "19", title: "Tomb Raider King", author: "RaiderAuthor", likes: "4.2M", genre: "Action", chapters: 184, coverBg: "linear-gradient(135deg, #0f172a, #334155)" },
    { id: "20", title: "Dungeon Reset", author: "ResetWriter", likes: "3.8M", genre: "Fantasy", chapters: 152, coverBg: "linear-gradient(135deg, #065f46, #064e3b)" },
    { id: "21", title: "God of Blackfield", author: "BlackfieldDoc", likes: "4.9M", genre: "Action", chapters: 167, coverBg: "linear-gradient(135deg, #450a0a, #1f2937)" },
    { id: "22", title: "Overgeared", author: "GridLover", likes: "8.1M", genre: "Fantasy", chapters: 198, coverBg: "linear-gradient(135deg, #781c1c, #4c0519)" },
    { id: "23", title: "The Great Mage", author: "MageWriter", likes: "3.1M", genre: "Fantasy", chapters: 172, coverBg: "linear-gradient(135deg, #1e3a8a, #0c4a6e)" },
    { id: "24", title: "Second Life Ranker", author: "RankerAuthor", likes: "4.7M", genre: "Fantasy", chapters: 158, coverBg: "linear-gradient(135deg, #3b0764, #18181b)" },
    { id: "25", title: "Returner's Magic", author: "MagicReturn", likes: "5.2M", genre: "Fantasy", chapters: 205, coverBg: "linear-gradient(135deg, #1f2937, #0f172a)" }
  ];

  const seasonReturns = [
    { id: "26", title: "Solo Leveling: Ragnarok", author: "Chugong", likes: "12M", genre: "Action", chapters: 140, coverBg: "linear-gradient(135deg, #062f4f, #1e1b4b)", isSeasonReturn: true },
    { id: "27", title: "Tower of God Season 3", author: "SIU", likes: "15M", genre: "Fantasy", chapters: 185, coverBg: "linear-gradient(135deg, #78350f, #3b0764)", isSeasonReturn: true },
    { id: "28", title: "The Boxer: Back Alley", author: "JH", likes: "9.4M", genre: "Drama", chapters: 104, coverBg: "linear-gradient(135deg, #111827, #000000)", isSeasonReturn: true },
    { id: "29", title: "Mercenary Enrollment S2", author: "EnrollWriter", likes: "8.6M", genre: "Action", chapters: 112, coverBg: "linear-gradient(135deg, #334155, #1e293b)", isSeasonReturn: true },
    { id: "30", title: "Eleceed New Season", author: "EleceedTeam", likes: "11M", genre: "Action", chapters: 156, coverBg: "linear-gradient(135deg, #022c22, #047857)", isSeasonReturn: true },
    { id: "31", title: "Beginning After the End S6", author: "TurtleMe", likes: "10.4M", genre: "Fantasy", chapters: 175, coverBg: "linear-gradient(135deg, #0c4a6e, #581c87)", isSeasonReturn: true },
    { id: "32", title: "Wind Breaker Season 4", author: "Yongseok", likes: "9.9M", genre: "Drama", chapters: 210, coverBg: "linear-gradient(135deg, #4c0519, #111827)", isSeasonReturn: true },
    { id: "33", title: "Doom Breaker Season 2", author: "DoomWriter", likes: "6.7M", genre: "Action", chapters: 95, coverBg: "linear-gradient(135deg, #450a0a, #3f3f46)", isSeasonReturn: true }
  ];

  const earlyAccess = [
    { id: "34", title: "Blossoming Blade", author: "BladeAuthor", likes: "7.1M", genre: "Action", chapters: 92, coverBg: "linear-gradient(135deg, #db2777, #4c0519)", isEarlyAccess: true },
    { id: "35", title: "Omniscient Reader", author: "SingShong", likes: "14M", genre: "Fantasy", chapters: 198, coverBg: "linear-gradient(135deg, #0f172a, #1d4ed8)", isEarlyAccess: true },
    { id: "36", title: "Doom Breaker", author: "BlueWriter", likes: "6.9M", genre: "Action", chapters: 84, coverBg: "linear-gradient(135deg, #1e3a8a, #111827)", isEarlyAccess: true },
    { id: "37", title: "Undercover Professor", author: "ProfAuthor", likes: "5.4M", genre: "Fantasy", chapters: 76, coverBg: "linear-gradient(135deg, #064e3b, #1e293b)", isEarlyAccess: true },
    { id: "38", title: "S-Classes That I Raised", author: "ClassWriter", likes: "6.2M", genre: "Fantasy", chapters: 110, coverBg: "linear-gradient(135deg, #581c87, #db2777)", isEarlyAccess: true },
    { id: "39", title: "Max-Level Newbie", author: "NewbieAuthor", likes: "8.3M", genre: "Action", chapters: 125, coverBg: "linear-gradient(135deg, #062f4f, #065f46)", isEarlyAccess: true },
    { id: "40", title: "Standard Reincarnation", author: "ReincWriter", likes: "4.1M", genre: "Fantasy", chapters: 68, coverBg: "linear-gradient(135deg, #781c1c, #111827)", isEarlyAccess: true },
    { id: "41", title: "Reaper of Drifting Moon", author: "MoonReaper", likes: "5.8M", genre: "Action", chapters: 96, coverBg: "linear-gradient(135deg, #1e1b4b, #000000)", isEarlyAccess: true }
  ];

  const originals = [
    { id: "42", title: "Panelva Chronicles", author: "PanelvaStudio", likes: "9.2M", genre: "Fantasy", chapters: 150, coverBg: "linear-gradient(135deg, #1d4ed8, #4c0519)", isOriginal: true },
    { id: "43", title: "Neon Genesis: Panelva", author: "NeonWriter", likes: "7.4M", genre: "Sci-Fi", chapters: 85, coverBg: "linear-gradient(135deg, #3b0764, #1e1b4b)", isOriginal: true },
    { id: "44", title: "Constellation Academy", author: "StarMage", likes: "6.1M", genre: "Fantasy", chapters: 94, coverBg: "linear-gradient(135deg, #064e3b, #0c4a6e)", isOriginal: true },
    { id: "45", title: "Legend of Northern Blade", author: "NorthernWriter", likes: "10M", genre: "Action", chapters: 130, coverBg: "linear-gradient(135deg, #111827, #334155)", isOriginal: true },
    { id: "46", title: "Second Life Ranker", author: "RankerTeam", likes: "8.7M", genre: "Fantasy", chapters: 158, coverBg: "linear-gradient(135deg, #581c87, #062f4f)", isOriginal: true },
    { id: "47", title: "The Archmage's Return", author: "ReturnMage", likes: "5.9M", genre: "Fantasy", chapters: 112, coverBg: "linear-gradient(135deg, #0f172a, #047857)", isOriginal: true },
    { id: "48", title: "Shadow Sovereign", author: "ShadowKing", likes: "12M", genre: "Fantasy", chapters: 180, coverBg: "linear-gradient(135deg, #311042, #111827)", isOriginal: true },
    { id: "49", title: "Leveling Up My Class", author: "ClassLeveler", likes: "4.8M", genre: "Fantasy", chapters: 74, coverBg: "linear-gradient(135deg, #450a0a, #78350f)", isOriginal: true }
  ];

  const [activeBingeIndex, setActiveBingeIndex] = useState(0);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [activeEarlyIndex, setActiveEarlyIndex] = useState(0);
  const [activeOriginalIndex, setActiveOriginalIndex] = useState(0);

  // tRPC queries
  const { data: dbComics } = trpc.series.getMany.useQuery({ type: "COMIC", limit: 16 });
  const { data: dbNovels } = trpc.series.getMany.useQuery({ type: "NOVEL", limit: 16 });
  const { data: dbTrending } = trpc.series.getTrending.useQuery({ limit: 16 });

  // Mapper function
  const formatLikes = (likesCount: number): string => {
    if (likesCount >= 1000000) return (likesCount / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (likesCount >= 1000) return (likesCount / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return likesCount.toString();
  };

  const mapDbItem = (item: any) => {
    const isImage = item.coverUrl && item.coverUrl.startsWith("http");
    
    // Find mock chapters count if DB has 0 chapters
    const mockMatch = comics.find(c => c.title.toLowerCase() === item.title.toLowerCase()) ||
                      novels.find(n => n.title.toLowerCase() === item.title.toLowerCase()) ||
                      bingeSeries.find(b => b.title.toLowerCase() === item.title.toLowerCase()) ||
                      seasonReturns.find(s => s.title.toLowerCase() === item.title.toLowerCase()) ||
                      earlyAccess.find(e => e.title.toLowerCase() === item.title.toLowerCase()) ||
                      originals.find(o => o.title.toLowerCase() === item.title.toLowerCase());
    const fallbackCount = mockMatch ? mockMatch.chapters : 24;
    const chaptersCount = item.chapters && item.chapters.length > 0 ? item.chapters.length : fallbackCount;

    return {
      id: item.id,
      title: item.title,
      author: item.creator?.penName || "Unknown",
      likes: formatLikes(item.likes),
      isNew: false,
      genre: item.genre,
      chapters: chaptersCount,
      coverBg: isImage ? `url(${item.coverUrl}) center/cover no-repeat` : (item.coverBg || "linear-gradient(135deg, #1e293b, #0f172a)"),
      isSeasonReturn: mockMatch ? (mockMatch as any).isSeasonReturn : false,
      isEarlyAccess: mockMatch ? (mockMatch as any).isEarlyAccess : false,
      isOriginal: mockMatch ? (mockMatch as any).isOriginal : false,
      description: item.description || (mockMatch as any)?.desc || "",
      bannerUrl: item.bannerUrl || null,
    };
  };

  // Mapped data feeds
  const displayComics = dbComics && dbComics.length > 0 ? dbComics.map(mapDbItem) : comics;
  const displayNovels = dbNovels && dbNovels.length > 0 ? dbNovels.map(mapDbItem) : novels;
  
  const displayBingeRaw = dbTrending && dbTrending.length > 0 ? dbTrending.map(mapDbItem) : bingeSeries;
  const displayBingeFiltered = displayBingeRaw.filter(item => item.chapters >= 150);

  const displaySeasonRaw = dbTrending && dbTrending.length > 0 ? dbTrending.map(mapDbItem) : seasonReturns;
  const displaySeasonFiltered = displaySeasonRaw.filter(item => item.isSeasonReturn === true);

  const displayEarlyRaw = dbTrending && dbTrending.length > 0 ? dbTrending.map(mapDbItem) : earlyAccess;
  const displayEarlyFiltered = displayEarlyRaw.filter(item => item.isEarlyAccess === true);

  const displayOriginalsRaw = dbTrending && dbTrending.length > 0 ? dbTrending.map(mapDbItem) : originals;
  const displayOriginalsFiltered = displayOriginalsRaw.filter(item => item.isOriginal === true);

  const featuredOriginal = displayOriginalsFiltered && displayOriginalsFiltered.length > 0
    ? displayOriginalsFiltered[0]
    : null;

  const displayTrending = dbTrending && dbTrending.length > 0
    ? dbTrending.map(mapDbItem)
    : [...displayComics.slice(0, 4), ...displayNovels.slice(0, 4)];

  const handleNextComics = () => {
    setActiveComicIndex((prev) => (prev + 1) % displayComics.length);
  };
  const handlePrevComics = () => {
    setActiveComicIndex((prev) => (prev - 1 + displayComics.length) % displayComics.length);
  };
  const handleNextNovels = () => {
    setActiveNovelIndex((prev) => (prev + 1) % displayNovels.length);
  };
  const handlePrevNovels = () => {
    setActiveNovelIndex((prev) => (prev - 1 + displayNovels.length) % displayNovels.length);
  };
  const handleNextBinge = () => {
    if (displayBingeFiltered.length === 0) return;
    setActiveBingeIndex((prev) => (prev + 1) % displayBingeFiltered.length);
  };
  const handlePrevBinge = () => {
    if (displayBingeFiltered.length === 0) return;
    setActiveBingeIndex((prev) => (prev - 1 + displayBingeFiltered.length) % displayBingeFiltered.length);
  };
  const handleNextSeason = () => {
    if (displaySeasonFiltered.length === 0) return;
    setActiveSeasonIndex((prev) => (prev + 1) % displaySeasonFiltered.length);
  };
  const handlePrevSeason = () => {
    if (displaySeasonFiltered.length === 0) return;
    setActiveSeasonIndex((prev) => (prev - 1 + displaySeasonFiltered.length) % displaySeasonFiltered.length);
  };
  const handleNextEarly = () => {
    if (displayEarlyFiltered.length === 0) return;
    setActiveEarlyIndex((prev) => (prev + 1) % displayEarlyFiltered.length);
  };
  const handlePrevEarly = () => {
    if (displayEarlyFiltered.length === 0) return;
    setActiveEarlyIndex((prev) => (prev - 1 + displayEarlyFiltered.length) % displayEarlyFiltered.length);
  };
  const handleNextOriginal = () => {
    if (displayOriginalsFiltered.length === 0) return;
    setActiveOriginalIndex((prev) => (prev + 1) % displayOriginalsFiltered.length);
  };
  const handlePrevOriginal = () => {
    if (displayOriginalsFiltered.length === 0) return;
    setActiveOriginalIndex((prev) => (prev - 1 + displayOriginalsFiltered.length) % displayOriginalsFiltered.length);
  };

  const renderSection = ({
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
  }) => {
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
  };

  return (
    <>
      <HeroAndShowcase 
        featuredSeries={featuredOriginal} 
        trendingSeries={displayTrending} 
      />
      <div className="home-page">
        
        {/* 2. Main Content Grid Sections */}
        <div className="home-sections-container">
        
        {/* Featured carousel Section */}
        <div className="featured-section">
          <div className="home-carousel-grid">
            {featuredItems.map((item) => (
              <GlowingShadow 
                key={item.id} 
                aspectRatio="3/4" 
                width="100%"
                radius="12px"
              >
                <Link 
                  href={item.link} 
                  className="featured-card"
                  style={{ background: item.coverBg }}
                >
                  {/* Badges */}
                  {item.badgeText && (
                    <div className={`featured-card-badge ${item.badgeType}`}>
                      {item.badgeText}
                    </div>
                  )}

                  {/* SVG/Graphics overlay for promo events if any */}
                  {item.id === "event-today" && (
                    <div className="event-icon-overlay">
                      <svg viewBox="0 0 100 100" width="100%" height="100%">
                        <rect x="35" y="20" width="30" height="50" rx="15" fill="#fbcfe8" />
                        <rect x="35" y="40" width="30" height="30" fill="#f472b6" />
                        <rect x="44" y="70" width="12" height="18" rx="6" fill="#fcd34d" />
                        <path d="M42 45 Q45 48 48 45" stroke="#4c0519" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        <path d="M52 45 Q55 48 58 45" stroke="#4c0519" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}

                  {item.id === "event-novels" && (
                    <div className="event-icon-overlay">
                      <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M30 20 h40 a10 10 0 0 1 10 10 v50 a10 10 0 0 1 -10 10 h-40 a10 10 0 0 1 -10 -10 v-50 a10 10 0 0 1 10 -10 z" fill="rgba(255,255,255,0.1)" />
                        <path d="M45 20 v30 l10 -6 l10 6 v-30" fill="#3b82f6" />
                        <circle cx="50" cy="65" r="5" fill="#ffffff" />
                      </svg>
                    </div>
                  )}

                  {item.id === "event-binge" && (
                    <div className="event-icon-overlay">
                      <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                        <circle cx="35" cy="45" r="18" fill="#fdf2f8" opacity="0.8" />
                        <circle cx="65" cy="45" r="18" fill="#fdf2f8" opacity="0.8" />
                        <circle cx="35" cy="45" r="2" fill="#db2777" />
                        <path d="M32 50 Q35 53 38 50" stroke="#db2777" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="65" cy="45" r="2" fill="#db2777" />
                        <path d="M62 50 Q65 53 68 50" stroke="#db2777" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}

                  {/* Gradient shadow for text readability */}
                  <div className="card-shadow-overlay" />

                  {/* Title and subtext inside card */}
                  <div className="card-content-overlay">
                    {item.desc && (
                      <span className="card-desc">
                        {item.desc}
                      </span>
                    )}
                    {item.genre && (
                      <span className="card-genre">
                        {item.genre}
                      </span>
                    )}
                    <h4 className="card-title">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              </GlowingShadow>
            ))}
          </div>

          {/* Double promotional banners */}
          <div className="promo-banners-container">
            
            {/* Left Banner (Yellow - Newcomer) */}
            <Link href="/help" className="promo-banner newcomer-banner">
              <div className="banner-text-group">
                <h3 className="banner-title">
                  NEW to Panelva?
                </h3>
                <span className="banner-subtitle">
                  Tips for Newcomers
                </span>
              </div>
              
              <div className="banner-mascot">
                <svg viewBox="0 0 100 100" width="45" height="45">
                  <ellipse cx="50" cy="55" rx="35" ry="30" fill="#f59e0b" />
                  <ellipse cx="50" cy="53" rx="32" ry="26" fill="#fbbf24" />
                  <path d="M22 35 C 10 32, 12 15, 26 22 C 30 24, 28 32, 22 35 Z" fill="#fbbf24" />
                  <path d="M78 35 C 90 32, 88 15, 74 22 C 70 24, 72 32, 78 35 Z" fill="#fbbf24" />
                  <ellipse cx="22" cy="27" rx="6" ry="6" fill="#f59e0b" />
                  <ellipse cx="78" cy="27" rx="6" ry="6" fill="#f59e0b" />
                  <circle cx="38" cy="52" r="3" fill="#ffffff" />
                  <circle cx="62" cy="52" r="3" fill="#ffffff" />
                  <path d="M46 64 C48 66, 52 66, 54 64" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </Link>

            {/* Right Banner (Dark - App Store) */}
            <div className="promo-banner app-store-banner">
              <div className="banner-text-group">
                <h3 className="banner-title">
                  Go to Panelva App
                </h3>
                <span className="banner-subtitle">
                  Get notified and free gifts
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {/* App Store button */}
                <a 
                  href="https://apple.com" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#000",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    textDecoration: "none",
                    color: "#fff",
                    transition: "border-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#71717a"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#3f3f46"}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M18.71,19.5 C17.88,20.74 17.0,21.95 15.66,21.97 C14.32,22 13.89,21.18 12.37,21.18 C10.84,21.18 10.37,21.95 9.1,22 C7.79,22.05 6.8,20.68 5.96,19.48 C4.25,17 2.94,12.45 4.7,9.39 C5.57,7.87 7.13,6.91 8.82,6.88 C10.1,6.86 11.32,7.75 12.11,7.75 C12.89,7.75 14.37,6.68 15.92,6.84 C16.57,6.87 18.39,7.1 19.56,8.82 C19.47,8.88 17.39,10.1 17.41,12.63 C17.44,15.65 20.06,16.66 20.1,16.67 C20.08,16.73 19.67,18.11 18.71,19.5 M15.97,4.17 C16.63,3.37 17.07,2.28 16.95,1 C16,1.04 14.9,1.6 14.24,2.38 C13.68,3.04 13.19,4.14 13.34,5.39 C14.39,5.47 15.4,4.88 15.97,4.17 Z"/>
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1" }}>
                    <span style={{ fontSize: "0.55rem", textTransform: "uppercase" }}>Download on the</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>App Store</span>
                  </div>
                </a>

                {/* Google Play button */}
                <a 
                  href="https://play.google.com" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#000",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    textDecoration: "none",
                    color: "#fff",
                    transition: "border-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#71717a"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#3f3f46"}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M3,5.27V18.73L16.55,12L3,5.27M17.87,11.33L19.46,12.12L17.87,12.92L16.55,12L17.87,11.33M3,3.41L18.23,11L3,3.41M3,20.59L18.23,13L3,20.59Z"/>
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1" }}>
                    <span style={{ fontSize: "0.55rem", textTransform: "uppercase" }}>GET IT ON</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Google Play</span>
                  </div>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* 1. Trending Comics Section */}
        {displayComics.length > 0 && renderSection({
          title: "Trending Comics",
          subtitle: "Top picks from the comic community.",
          items: displayComics,
          activeIndex: activeComicIndex,
          onNext: handleNextComics,
          onPrev: handlePrevComics,
          seeAllLink: "/comics",
        })}

        {/* 2. Popular Novels Section */}
        {displayNovels.length > 0 && renderSection({
          title: "Popular Novels",
          subtitle: "Bestselling text-based adventures.",
          items: displayNovels,
          activeIndex: activeNovelIndex,
          onNext: handleNextNovels,
          onPrev: handlePrevNovels,
          seeAllLink: "/novels",
        })}

        {/* 3. Binge-A-Thon Section */}
        {displayBingeFiltered.length > 0 && renderSection({
          title: "Binge-A-Thon",
          subtitle: "Massive series with over 150 chapters ready for endless bingeing.",
          items: displayBingeFiltered,
          activeIndex: activeBingeIndex,
          onNext: handleNextBinge,
          onPrev: handlePrevBinge,
          seeAllLink: "/library",
        })}

        {/* 4. Season Returns Section */}
        {displaySeasonFiltered.length > 0 && renderSection({
          title: "Season Returns",
          subtitle: "Your favorites are back! Experience brand new seasons and story arcs.",
          items: displaySeasonFiltered,
          activeIndex: activeSeasonIndex,
          onNext: handleNextSeason,
          onPrev: handlePrevSeason,
          seeAllLink: "/trending",
        })}

        {/* 5. Early Access Section */}
        {displayEarlyFiltered.length > 0 && renderSection({
          title: "Early Access",
          subtitle: "Unlock chapters before anyone else with premium early splits.",
          items: displayEarlyFiltered,
          activeIndex: activeEarlyIndex,
          onNext: handleNextEarly,
          onPrev: handlePrevEarly,
          seeAllLink: "/premium",
        })}

        {/* 6. Panelva Originals Section */}
        {displayOriginalsFiltered.length > 0 && renderSection({
          title: "Panelva Originals",
          subtitle: "Exclusive stories crafted in-house by Panelva creators.",
          items: displayOriginalsFiltered,
          activeIndex: activeOriginalIndex,
          onNext: handleNextOriginal,
          onPrev: handlePrevOriginal,
          seeAllLink: "/premium",
        })}

        {/* Premium Promo Section showcasing the Glowing Shadow Card */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", marginTop: "4rem", borderTop: "1px solid var(--border-color)", paddingTop: "4rem", paddingBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 750, margin: 0, textAlign: "center", color: "var(--text-color, #fff)", fontFamily: "var(--font-display)" }}>Experience Panelva Premium</h2>
          <p style={{ color: "var(--text-muted-color)", textAlign: "center", margin: 0, maxWidth: "500px" }}>
            Get unlimited access to exclusive chapters, ad-free reading, and premium splits with creator support.
          </p>
          
          <GlowingShadow>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", textAlign: "center", color: "#fff" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 900 }}>Panelva +</span>
              <span style={{ fontSize: "0.85rem", color: "#a78bfa" }}>Unlock All Features</span>
            </div>
          </GlowingShadow>
        </div>

      </div>

    </div>
    </>
  );
}
