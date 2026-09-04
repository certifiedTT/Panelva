import Link from "next/link";
import { Card, Button } from "@panelva/ui";
import { Sparkles } from "lucide-react";
import { CarouselSection } from "../components/CarouselSection";
import HeroAndShowcase from "../components/HeroAndShowcase";
import { comics, novels, bingeSeries, seasonReturns, earlyAccess, originals } from "@/lib/mockData";
import { prisma } from "@panelva/db";

export const revalidate = 60; // Revalidate the homepage data cache every minute

export default async function HomePage() {
  // Fetch from database on the server
  let dbComics: any[] = [];
  let dbNovels: any[] = [];
  let dbTrending: any[] = [];

  try {
    const [comicsRes, novelsRes, trendingRes] = await Promise.all([
      prisma.series.findMany({
        where: { type: "COMIC" },
        orderBy: { views: "desc" },
        take: 16,
        include: {
          creator: true,
          chapters: {
            orderBy: { chapterIndex: "asc" },
          },
        },
      }),
      prisma.series.findMany({
        where: { type: "NOVEL" },
        orderBy: { views: "desc" },
        take: 16,
        include: {
          creator: true,
          chapters: {
            orderBy: { chapterIndex: "asc" },
          },
        },
      }),
      prisma.series.findMany({
        orderBy: [
          { views: "desc" },
          { likes: "desc" },
        ],
        take: 16,
        include: {
          creator: true,
          chapters: {
            orderBy: { chapterIndex: "asc" },
          },
        },
      }),
    ]);
    
    dbComics = comicsRes;
    dbNovels = novelsRes;
    dbTrending = trendingRes;
  } catch (error) {
    console.error("Failed to fetch homepage data from database:", error);
  }

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
      coverUrl: item.coverUrl || null,
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
    : (originals && originals.length > 0 ? originals[0] : null);

  const displayTrending = dbTrending && dbTrending.length > 0
    ? dbTrending.map(mapDbItem)
    : [...displayComics.slice(0, 4), ...displayNovels.slice(0, 4)];

  return (
    <>
      <HeroAndShowcase 
        featuredSeries={featuredOriginal} 
        trendingSeries={displayTrending} 
      />
      <div className="home-page">
        
        {/* 2. Main Content Grid Sections */}
        <div className="home-sections-container">
        
        {/* 1. Trending Comics Section */}
        {displayComics.length > 0 && <CarouselSection
          title="Trending Comics"
          subtitle="Top picks from the comic community."
          items={displayComics}
          seeAllLink="/comics"
        />}

        {/* 2. Popular Novels Section */}
        {displayNovels.length > 0 && <CarouselSection
          title="Popular Novels"
          subtitle="Bestselling text-based adventures."
          items={displayNovels}
          seeAllLink="/novels"
        />}

        {/* 3. Binge-A-Thon Section */}
        {displayBingeFiltered.length > 0 && <CarouselSection
          title="Binge-A-Thon"
          subtitle="Massive series with over 150 chapters ready for endless bingeing."
          items={displayBingeFiltered}
          seeAllLink="/library"
        />}

        {/* 4. Season Returns Section */}
        {displaySeasonFiltered.length > 0 && <CarouselSection
          title="Season Returns"
          subtitle="Your favorites are back! Experience brand new seasons and story arcs."
          items={displaySeasonFiltered}
          seeAllLink="/trending"
        />}

        {/* 5. Early Access Section */}
        {displayEarlyFiltered.length > 0 && <CarouselSection
          title="Early Access"
          subtitle="Unlock chapters before anyone else with premium early splits."
          items={displayEarlyFiltered}
          seeAllLink="/premium"
        />}

        {/* 6. Panelva Originals Section */}
        {displayOriginalsFiltered.length > 0 && <CarouselSection
          title="Panelva Originals"
          subtitle="Exclusive stories crafted in-house by Panelva creators."
          items={displayOriginalsFiltered}
          seeAllLink="/premium"
        />}

        {/* Premium Promo Section */}
        <div className="mt-16 pt-16 pb-8 border-t border-slate-800/80 flex flex-col items-center">
          <Card className="p-8 max-w-xl w-full flex flex-col items-center text-center gap-4 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Experience Panelva Premium</h2>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Get unlimited access to exclusive chapters, ad-free reading, and premium splits with direct creator support.
            </p>
            <Link href="/premium" className="mt-2">
              <Button variant="primary" size="lg" leftIcon={<Sparkles className="w-4 h-4" />}>
                Unlock Panelva +
              </Button>
            </Link>
          </Card>
        </div>

      </div>

    </div>
    </>
  );
}
