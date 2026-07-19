import React from "react";

export interface SeriesCardProps {
  title: string;
  category: string;
  chapter: string;
  imageSrc?: string;
  coverBg?: string; // Support for custom gradient/color background styles
  isNew?: boolean;  // Optional new badge tag
}

export function SeriesCard({
  title,
  category,
  chapter,
  imageSrc,
  coverBg,
  isNew
}: SeriesCardProps) {
  
  // Decide whether to render img tag or background style
  const isDirectImage = imageSrc && !imageSrc.startsWith("linear-gradient") && !imageSrc.startsWith("radial-gradient");

  return (
    <div className="group flex flex-col cursor-pointer w-full">
      {/* Aspect Ratio Box */}
      <div
        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800/60 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-zinc-700 group-hover:shadow-xl group-hover:shadow-blue-500/5"
        style={(!isDirectImage && (coverBg || imageSrc)) ? { background: coverBg || imageSrc, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {isDirectImage ? (
          <img src={imageSrc} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 flex items-center justify-center">
            {!(coverBg || imageSrc) && (
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Coming Soon</span>
            )}
          </div>
        )}
        
        {/* Subtle shadow overlay to pop details */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

        {isNew && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="rounded bg-yellow-400 px-1.5 py-0.5 text-[8px] font-bold text-black uppercase tracking-wider">
              NEW
            </span>
          </div>
        )}
      </div>
      
      {/* Title & Meta Group */}
      <div className="mt-3 px-1">
        <h3 className="truncate text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors duration-200">
          {title || "Untitled Series"}
        </h3>
        <p className="mt-0.5 text-[10px] font-medium text-zinc-500 truncate">
          {category} • {chapter}
        </p>
      </div>
    </div>
  );
}
