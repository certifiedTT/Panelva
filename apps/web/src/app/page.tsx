"use client";

import Link from "next/link";
import { useState } from "react";
import { GlowingShadow } from "../components/GlowingShadow";
import { CarouselSection } from "../components/CarouselSection";
import { trpc } from "../lib/trpc";
import HeroAndShowcase from "../components/HeroAndShowcase";
import { comics, novels, bingeSeries, seasonReturns, earlyAccess, originals } from "@/lib/mockData";

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
        {displayComics.length > 0 && <CarouselSection
          title="Trending Comics"
          subtitle="Top picks from the comic community."
          items={displayComics}
          activeIndex={activeComicIndex}
          onNext={handleNextComics}
          onPrev={handlePrevComics}
          seeAllLink="/comics"
        />}

        {/* 2. Popular Novels Section */}
        {displayNovels.length > 0 && <CarouselSection
          title="Popular Novels"
          subtitle="Bestselling text-based adventures."
          items={displayNovels}
          activeIndex={activeNovelIndex}
          onNext={handleNextNovels}
          onPrev={handlePrevNovels}
          seeAllLink="/novels"
        />}

        {/* 3. Binge-A-Thon Section */}
        {displayBingeFiltered.length > 0 && <CarouselSection
          title="Binge-A-Thon"
          subtitle="Massive series with over 150 chapters ready for endless bingeing."
          items={displayBingeFiltered}
          activeIndex={activeBingeIndex}
          onNext={handleNextBinge}
          onPrev={handlePrevBinge}
          seeAllLink="/library"
        />}

        {/* 4. Season Returns Section */}
        {displaySeasonFiltered.length > 0 && <CarouselSection
          title="Season Returns"
          subtitle="Your favorites are back! Experience brand new seasons and story arcs."
          items={displaySeasonFiltered}
          activeIndex={activeSeasonIndex}
          onNext={handleNextSeason}
          onPrev={handlePrevSeason}
          seeAllLink="/trending"
        />}

        {/* 5. Early Access Section */}
        {displayEarlyFiltered.length > 0 && <CarouselSection
          title="Early Access"
          subtitle="Unlock chapters before anyone else with premium early splits."
          items={displayEarlyFiltered}
          activeIndex={activeEarlyIndex}
          onNext={handleNextEarly}
          onPrev={handlePrevEarly}
          seeAllLink="/premium"
        />}

        {/* 6. Panelva Originals Section */}
        {displayOriginalsFiltered.length > 0 && <CarouselSection
          title="Panelva Originals"
          subtitle="Exclusive stories crafted in-house by Panelva creators."
          items={displayOriginalsFiltered}
          activeIndex={activeOriginalIndex}
          onNext={handleNextOriginal}
          onPrev={handlePrevOriginal}
          seeAllLink="/premium"
        />}

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
