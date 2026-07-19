import Link from "next/link";
import React from "react";
import { SeriesCard } from "./SeriesCard";

export interface SeriesItem {
  id: string;
  title: string;
  author: string;
  likes: string;
  genre: string;
  chapters: number;
  coverBg: string;
  isNew?: boolean;
  bannerUrl?: string | null;
  description?: string;
}

interface HeroAndShowcaseProps {
  featuredSeries?: SeriesItem | null;
  trendingSeries?: SeriesItem[];
}

export default function HeroAndShowcase({
  featuredSeries,
  trendingSeries = []
}: HeroAndShowcaseProps) {
  
  // Resolve hero information dynamically with sensible fallbacks
  const heroTitle = featuredSeries?.title || "Dive into New Dimensions";
  const heroDescription = featuredSeries?.description || "Experience the ultimate universe of stories. From heart-pounding action to epic web novels, find your next obsession today.";
  
  const startReadingLink = featuredSeries 
    ? `/read/${featuredSeries.id}?title=${encodeURIComponent(featuredSeries.title)}&genre=${featuredSeries.genre}&chapters=${featuredSeries.chapters || 24}&likes=${featuredSeries.likes}`
    : "/comics";
    
  const viewDetailsLink = featuredSeries
    ? `/read/${featuredSeries.id}?title=${encodeURIComponent(featuredSeries.title)}&genre=${featuredSeries.genre}&chapters=${featuredSeries.chapters || 24}&likes=${featuredSeries.likes}`
    : "/premium";

  const heroBgStyle = {
    backgroundImage: featuredSeries?.bannerUrl
      ? `url(${featuredSeries.bannerUrl})`
      : (featuredSeries?.coverBg && (featuredSeries.coverBg.startsWith("url") || featuredSeries.coverBg.startsWith("linear-gradient")))
        ? featuredSeries.coverBg
        : "url('https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop')"
  };

  return (
    <main className="min-h-screen bg-[#0b0c10] pt-16 text-white">
      
      {/* Immersive Hero Section */}
      <section className="relative h-[480px] w-full overflow-hidden">
        {/* Deep, professional background styling */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-950/90 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] to-transparent z-10" />
        
        {/* Dynamic artwork background with fallback */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-500" 
          style={heroBgStyle} 
        />

        {/* Hero Content Area */}
        <div className="relative z-20 mx-auto max-w-7xl px-6 md:px-8 w-full flex h-full flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400 border border-blue-500/20 w-fit mb-4">
            ✨ Featured Original
          </div>
          
          <h1 className="max-w-xl text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl leading-[1.1]">
            {heroTitle === "Dive into New Dimensions" ? (
              <>
                Dive into New <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Dimensions</span>
              </>
            ) : (
              heroTitle
            )}
          </h1>
          
          <p className="mt-4 max-w-lg text-sm md:text-base text-zinc-400 leading-relaxed line-clamp-3">
            {heroDescription}
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link href={startReadingLink}>
              <button className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition">
                ▶ Start Reading
              </button>
            </Link>
            <Link href={viewDetailsLink}>
              <button className="rounded-full bg-zinc-800/80 border border-zinc-700/50 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition">
                View Details
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Horizontal Card Showcase Section */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 w-full py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            🔥 Trending Series 
            <Link href="/comics" className="text-xs text-blue-500 hover:underline cursor-pointer font-normal">
              View All
            </Link>
          </h2>
        </div>

        {/* CSS Grid for beautiful, responsive card layout */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {trendingSeries.slice(0, 8).map((item) => {
            const cardLinkHref = `/read/${item.id}?title=${encodeURIComponent(item.title)}&genre=${item.genre}&chapters=${item.chapters || 24}&likes=${item.likes}`;
            
            return (
              <Link key={item.id} href={cardLinkHref} className="block w-full">
                <SeriesCard
                  title={item.title}
                  category={item.genre}
                  chapter={`Ch. ${item.chapters}`}
                  coverBg={item.coverBg || undefined}
                  isNew={item.isNew}
                />
              </Link>
            );
          })}
        </div>
      </section>

    </main>
  );
}
