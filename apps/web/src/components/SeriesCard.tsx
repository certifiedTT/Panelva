import React from "react";
import Image from "next/image";
import { Badge } from "@panelva/ui";

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
    <div className="group flex flex-col cursor-pointer w-full focus-visible:outline-none">
      {/* Aspect Ratio Box */}
      <div
        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-slate-600 focus-visible:ring-2 focus-visible:ring-blue-500"
        style={(!isDirectImage && (coverBg || imageSrc)) ? { background: coverBg || imageSrc, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {isDirectImage ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 flex items-center justify-center">
            {!(coverBg || imageSrc) && (
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Coming Soon</span>
            )}
          </div>
        )}
        
        {/* Subtle gradient overlay to pop details */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

        {isNew && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge variant="warning" size="sm">
              NEW
            </Badge>
          </div>
        )}
      </div>
      
      {/* Title & Meta Group */}
      <div className="mt-2">
        <h3 className="truncate text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors duration-200">
          {title || "Untitled Series"}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-400 truncate">
          {category} • {chapter}
        </p>
      </div>
    </div>
  );
}
