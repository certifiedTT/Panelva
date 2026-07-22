"use client";

import { useState } from "react";
import { trpc } from "../lib/trpc";
import { CarouselSection } from "./CarouselSection";
import { Sparkles } from "lucide-react";

export default function RecommendationsSection({ seriesId }: { seriesId: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: recommendations, isLoading } = trpc.series.getRecommendations.useQuery(
    { seriesId, limit: 8 },
    { enabled: !!seriesId }
  );

  if (isLoading || !recommendations || recommendations.length === 0) {
    return null; // hide if loading or none found
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % recommendations.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
  };

  const formattedItems = recommendations.map(rec => ({
    id: rec.id,
    title: rec.title,
    genre: rec.genre || "Unknown",
    coverBg: rec.coverUrl ? `url(${rec.coverUrl}) center/cover` : "linear-gradient(to bottom, #1e3a8a, #111827)",
    likes: (rec.likes / 1000).toFixed(1) + "k",
    chapters: rec.chapters?.length || 0,
  }));

  return (
    <div style={{ width: "100%", maxWidth: "800px", margin: "2rem 0", padding: "1.5rem", background: "rgba(124, 58, 237, 0.03)", border: "1px solid rgba(124, 58, 237, 0.15)", borderRadius: "16px" }}>
      <CarouselSection
        title="Readers Also Liked"
        subtitle="Discover similar stories you'll love"
        items={formattedItems}
        activeIndex={activeIndex}
        onNext={handleNext}
        onPrev={handlePrev}
        seeAllLink="/explore"
        icon={<Sparkles size={24} color="#8b5cf6" />}
        sectionBadgeType="none"
      />
    </div>
  );
}
