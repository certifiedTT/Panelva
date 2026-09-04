"use client";

import { trpc } from "../lib/trpc";
import { CarouselSection } from "./CarouselSection";
import { Card } from "@panelva/ui";
import { Sparkles } from "lucide-react";

export default function RecommendationsSection({ seriesId }: { seriesId: string }) {
  const { data: recommendations, isLoading } = (trpc.series.getRecommendations as any).useQuery(
    { seriesId, limit: 8 },
    { enabled: !!seriesId }
  );

  // Skeleton Loader prevents Cumulative Layout Shift (CLS)
  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl my-8 p-6 border border-slate-800 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded-lg bg-slate-800" />
          <div className="h-5 w-48 rounded bg-slate-800" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-36 shrink-0 flex flex-col gap-2">
              <div className="aspect-[2/3] w-full rounded-xl bg-slate-800" />
              <div className="h-3.5 w-24 rounded bg-slate-800" />
              <div className="h-3 w-16 rounded bg-slate-800/60" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null; // hide if none found
  }

  const formattedItems = (recommendations as any[]).map((rec: any) => ({
    id: rec.id,
    title: rec.title,
    genre: rec.genre || "Unknown",
    coverUrl: rec.coverUrl || null,
    coverBg: rec.coverUrl ? `url(${rec.coverUrl}) center/cover` : "linear-gradient(to bottom, #1e3a8a, #111827)",
    likes: (rec.likes / 1000).toFixed(1) + "k",
    chapters: rec.chapters?.length || 0,
  }));

  return (
    <Card className="w-full max-w-3xl my-8 p-6 border border-slate-800 bg-slate-900/40">
      <CarouselSection
        title="Readers Also Liked"
        subtitle="Discover similar stories you'll love"
        items={formattedItems}
        seeAllLink="/comics"
        icon={<Sparkles className="w-6 h-6 text-blue-400" />}
        sectionBadgeType="none"
      />
    </Card>
  );
}
