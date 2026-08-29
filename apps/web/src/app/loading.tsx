import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      {/* 1. Hero Section Skeleton */}
      <section className="relative h-[480px] w-full bg-zinc-950 overflow-hidden flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-950/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] to-transparent z-10" />
        
        {/* Skeleton content area matching HeroAndShowcase */}
        <div className="relative z-20 mx-auto max-w-7xl px-6 md:px-8 w-full flex flex-col justify-center">
          {/* Badge skeleton */}
          <div className="h-5 w-28 bg-zinc-800/80 animate-pulse rounded-full mb-4 border border-zinc-700/30" />
          
          {/* Title skeleton */}
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="h-12 w-[80%] bg-zinc-800/80 animate-pulse rounded-md" />
            <div className="h-12 w-[50%] bg-zinc-800/80 animate-pulse rounded-md" />
          </div>
          
          {/* Description skeleton */}
          <div className="mt-4 flex flex-col gap-2 max-w-lg">
            <div className="h-4 w-full bg-zinc-800/60 animate-pulse rounded-md" />
            <div className="h-4 w-[90%] bg-zinc-800/60 animate-pulse rounded-md" />
            <div className="h-4 w-[75%] bg-zinc-800/60 animate-pulse rounded-md" />
          </div>

          {/* Button skeletons */}
          <div className="mt-8 flex items-center gap-4">
            <div className="h-10 w-36 bg-zinc-800 animate-pulse rounded-full" />
            <div className="h-10 w-28 bg-zinc-800/60 animate-pulse rounded-full" />
          </div>
        </div>
      </section>

      {/* 2. Trending Showcase Section Skeleton */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 w-full py-12">
        <div className="flex items-center justify-between mb-6">
          {/* Header text skeleton */}
          <div className="h-6 w-48 bg-zinc-800 animate-pulse rounded-md" />
        </div>

        {/* Responsive Grid matching Trending Cards layout (SeriesCard) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col w-full">
              {/* Aspect Ratio Box */}
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-800/60 border border-zinc-700/20 animate-pulse" />
              {/* Text metadata */}
              <div className="mt-3 px-1 flex flex-col gap-1.5">
                <div className="h-3 w-[90%] bg-zinc-800 animate-pulse rounded-sm" />
                <div className="h-2.5 w-[60%] bg-zinc-800/60 animate-pulse rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Carousel Sections Container Skeleton */}
      <div className="home-page">
        <div className="home-sections-container">
          {/* We render 4 carousel skeletons */}
          {Array.from({ length: 4 }).map((_, sectionIndex) => (
            <div key={sectionIndex} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                {/* Title & subtitle skeletons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div className="h-5 w-48 bg-zinc-800 animate-pulse rounded-md" />
                  <div className="h-3 w-64 bg-zinc-800/60 animate-pulse rounded-md" />
                </div>
                
                {/* Control buttons skeletons */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
                  <div className="h-3.5 w-16 bg-zinc-800 animate-pulse rounded-sm" />
                  <div style={{ display: "flex", gap: "6px" }}>
                    <div className="h-[30px] w-[30px] rounded-full bg-zinc-800/60 animate-pulse" />
                    <div className="h-[30px] w-[30px] rounded-full bg-zinc-800/60 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Carousel grid: displays 2 on mobile, 4 on tablet, 8 on desktop */}
              <div className="home-carousel-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2 w-full">
                    {/* Carousel items have 3/4 aspect ratio */}
                    <div 
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "3/4",
                        borderRadius: "12px",
                        backgroundColor: "rgba(39, 39, 42, 0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.03)"
                      }}
                      className="animate-pulse"
                    />
                    
                    {/* Metadata text placeholders */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "2px" }}>
                      <div className="h-2.5 w-[50%] bg-zinc-800/60 animate-pulse rounded-sm" />
                      <div className="h-3 w-[90%] bg-zinc-800 animate-pulse rounded-sm" />
                      <div className="h-2.5 w-[35%] bg-zinc-800/60 animate-pulse rounded-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
